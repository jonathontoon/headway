/** Fetch-compatible function used by GitHub sync code. */
export type FetchFn = typeof fetch;

/** Delay function used while polling GitHub device authorization. */
export type WaitFn = (
  milliseconds: number,
  signal?: AbortSignal,
) => Promise<void>;

/** GitHub repository file target used for todo sync. */
export type SyncTarget = {
  readonly owner: string;
  readonly repo: string;
  readonly branch: string;
  readonly path: string;
};

/** Device-flow code response returned by GitHub. */
export type DeviceCode = {
  readonly deviceCode: string;
  readonly userCode: string;
  readonly verificationUri: string;
  readonly interval: number;
  readonly expiresIn: number;
};

/** GitHub file content and SHA needed for conflict-aware updates. */
export type RemoteFile = {
  readonly sha: string;
  readonly lines: readonly string[];
};

/** Error thrown when a GitHub or worker request fails with a status code. */
export class GitHubApiError extends Error {
  /** HTTP status returned by the failed request. */
  readonly status: number;

  /**
   * Creates a GitHub API error.
   *
   * @param status - HTTP status returned by the failed request.
   * @param message - Error message for terminal output or tests.
   */
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const DEVICE_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";

function abortError(): DOMException {
  return new DOMException("The operation was aborted.", "AbortError");
}

const defaultWait: WaitFn = (milliseconds, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(abortError());
      },
      { once: true },
    );
  });

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json", Accept: "application/json" };
}

function apiHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function requestInit(init: RequestInit, signal?: AbortSignal): RequestInit {
  return signal === undefined ? init : { ...init, signal };
}

// `encodeURIComponent` leaves `.`/`..` untouched (they're unreserved), so a
// segment of exactly "." or ".." survives encoding and is normalized away by
// the URL parser before the request is sent - letting it retarget the
// request to a different endpoint. Reject those (and empty segments)
// instead of just encoding.
/**
 * Checks that a path segment cannot be normalized by URL parsing.
 *
 * @param segment - Owner, repo, branch, or file path segment.
 * @returns True when the segment is safe to use.
 */
export function isValidPathSegment(segment: string): boolean {
  return segment !== "" && segment !== "." && segment !== "..";
}

/**
 * Checks that a repository file path is relative and safe.
 *
 * @param path - Repository file path.
 * @returns True when each segment is valid.
 */
export function isValidRepoPath(path: string): boolean {
  return path.split("/").every(isValidPathSegment);
}

// owner/repo/path are user input from `connect`, but may also arrive here
// via stored settings that could be tampered with, so this is enforced at
// the actual sink, not just where `connect` first accepts it.
function contentsUrl(target: SyncTarget): string {
  if (
    !isValidPathSegment(target.owner) ||
    !isValidPathSegment(target.repo) ||
    !isValidRepoPath(target.path)
  ) {
    throw new Error(
      "path must be a relative file path without '.' or '..' segments",
    );
  }

  const path = target.path.split("/").map(encodeURIComponent).join("/");
  return `https://api.github.com/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repo)}/contents/${path}`;
}

/**
 * Starts GitHub OAuth device authorization through the same-origin worker.
 *
 * @param clientId - GitHub OAuth app client id.
 * @param fetchFn - Fetch function to use.
 * @param signal - Optional abort signal.
 * @returns Device-flow data for the user prompt and token poll.
 * @throws GitHubApiError when GitHub or the worker rejects the request.
 */
export async function requestDeviceCode(
  clientId: string,
  fetchFn: FetchFn = fetch,
  signal?: AbortSignal,
): Promise<DeviceCode> {
  const response = await fetchFn(
    "/api/github/device/code",
    requestInit(
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ client_id: clientId, scope: "repo" }),
      },
      signal,
    ),
  );
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new GitHubApiError(
      response.status,
      data.error_description ?? data.error ?? "device code request failed",
    );
  }

  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri,
    interval: data.interval,
    expiresIn: data.expires_in,
  };
}

/**
 * Polls GitHub until the device code is authorized.
 *
 * @param clientId - GitHub OAuth app client id.
 * @param device - Device-flow data returned by `requestDeviceCode`.
 * @param fetchFn - Fetch function to use.
 * @param wait - Delay function used between polls.
 * @param signal - Optional abort signal.
 * @returns The OAuth access token.
 * @throws GitHubApiError when authorization fails unexpectedly.
 */
export async function pollForToken(
  clientId: string,
  device: DeviceCode,
  fetchFn: FetchFn = fetch,
  wait: WaitFn = defaultWait,
  signal?: AbortSignal,
): Promise<string> {
  let interval = device.interval;
  const deadline = Date.now() + device.expiresIn * 1000;

  for (;;) {
    await wait(interval * 1000, signal);

    if (Date.now() > deadline) {
      throw new Error("the device code expired - run 'connect' again");
    }

    const response = await fetchFn(
      "/api/github/device/token",
      requestInit(
        {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify({
            client_id: clientId,
            device_code: device.deviceCode,
            grant_type: DEVICE_GRANT_TYPE,
          }),
        },
        signal,
      ),
    );
    const data = await response.json();

    if (data.access_token) {
      return data.access_token;
    }

    switch (data.error) {
      case "authorization_pending":
        continue;
      case "slow_down":
        interval += 5;
        continue;
      case "expired_token":
        throw new Error("the device code expired - run 'connect' again");
      case "access_denied":
        throw new Error("authorization was denied on GitHub");
      default:
        throw new GitHubApiError(
          response.status,
          data.error_description ?? data.error ?? "authorization failed",
        );
    }
  }
}

// Revocation needs the app's client secret, so it goes through the worker.
// "unsupported" means the worker isn't configured for it (501), which the
// caller reports rather than treating as failure.
/**
 * Revokes a GitHub OAuth grant through the same-origin worker.
 *
 * @param token - Token to revoke.
 * @param fetchFn - Fetch function to use.
 * @param signal - Optional abort signal.
 * @returns Whether the token was revoked or the worker lacks configuration.
 * @throws GitHubApiError when the worker reports a revoke failure.
 */
export async function revokeToken(
  token: string,
  fetchFn: FetchFn = fetch,
  signal?: AbortSignal,
): Promise<"revoked" | "unsupported"> {
  const response = await fetchFn(
    "/api/github/token/revoke",
    requestInit(
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ access_token: token }),
      },
      signal,
    ),
  );

  if (response.status === 501) {
    return "unsupported";
  }

  if (!response.ok) {
    throw new GitHubApiError(response.status, "could not revoke the token");
  }

  return "revoked";
}

/**
 * Reads the login for an authenticated GitHub token.
 *
 * @param token - GitHub access token.
 * @param fetchFn - Fetch function to use.
 * @param signal - Optional abort signal.
 * @returns GitHub login name.
 * @throws GitHubApiError when GitHub rejects the token or request.
 */
export async function getAuthenticatedLogin(
  token: string,
  fetchFn: FetchFn = fetch,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetchFn(
    "https://api.github.com/user",
    requestInit({ headers: apiHeaders(token) }, signal),
  );

  if (!response.ok) {
    throw new GitHubApiError(response.status, "could not read GitHub user");
  }

  const data = await response.json();
  return data.login;
}

/**
 * Reads the configured todo file from GitHub.
 *
 * @param target - Repository file target.
 * @param token - GitHub access token.
 * @param fetchFn - Fetch function to use.
 * @param signal - Optional abort signal.
 * @returns Remote file content, or `not_found` when the file does not exist.
 * @throws GitHubApiError when GitHub rejects the read.
 */
export async function getFile(
  target: SyncTarget,
  token: string,
  fetchFn: FetchFn = fetch,
  signal?: AbortSignal,
): Promise<RemoteFile | "not_found"> {
  const response = await fetchFn(
    `${contentsUrl(target)}?ref=${encodeURIComponent(target.branch)}`,
    requestInit({ headers: apiHeaders(token) }, signal),
  );

  if (response.status === 404) {
    return "not_found";
  }

  if (!response.ok) {
    throw new GitHubApiError(
      response.status,
      `GitHub returned ${response.status} while reading the file`,
    );
  }

  const data = await response.json();
  return { sha: data.sha, lines: decodeContent(data.content) };
}

/**
 * Writes todo lines to the configured GitHub file.
 *
 * @param target - Repository file target.
 * @param token - GitHub access token.
 * @param lines - Todo lines to write.
 * @param sha - Current remote SHA when replacing an existing file.
 * @param fetchFn - Fetch function to use.
 * @param signal - Optional abort signal.
 * @returns New remote file SHA.
 * @throws GitHubApiError when GitHub rejects the write.
 */
export async function putFile(
  target: SyncTarget,
  token: string,
  lines: readonly string[],
  sha: string | undefined,
  fetchFn: FetchFn = fetch,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetchFn(
    contentsUrl(target),
    requestInit(
      {
        method: "PUT",
        headers: apiHeaders(token),
        body: JSON.stringify({
          message: "chore: sync todos from headway",
          content: encodeLines(lines),
          branch: target.branch,
          ...(sha ? { sha } : {}),
        }),
      },
      signal,
    ),
  );

  if (!response.ok) {
    throw new GitHubApiError(
      response.status,
      `GitHub returned ${response.status} while writing the file`,
    );
  }

  const data = await response.json();
  return data.content.sha;
}

/**
 * Encodes todo lines as UTF-8-safe base64 for GitHub Contents API writes.
 *
 * @param lines - Todo lines to encode.
 * @returns Base64 content with a trailing newline.
 */
export function encodeLines(lines: readonly string[]): string {
  const bytes = new TextEncoder().encode(lines.join("\n") + "\n");
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

/**
 * Decodes GitHub Contents API base64 content to todo lines.
 *
 * @param content - Base64 content from GitHub.
 * @returns Decoded todo lines without trailing blank lines.
 */
export function decodeContent(content: string): readonly string[] {
  const binary = atob(content.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const lines = new TextDecoder().decode(bytes).split("\n");

  while (lines.length > 0 && lines.at(-1) === "") {
    lines.pop();
  }

  return lines;
}
