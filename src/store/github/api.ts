export type FetchFn = typeof fetch;
export type WaitFn = (
  milliseconds: number,
  signal?: AbortSignal,
) => Promise<void>;

export type SyncTarget = {
  readonly owner: string;
  readonly repo: string;
  readonly branch: string;
  readonly path: string;
};

export type DeviceCode = {
  readonly deviceCode: string;
  readonly userCode: string;
  readonly verificationUri: string;
  readonly interval: number;
  readonly expiresIn: number;
};

export type RemoteFile = {
  readonly sha: string;
  readonly lines: readonly string[];
};

export class GitHubApiError extends Error {
  readonly status: number;

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

function contentsUrl(target: SyncTarget): string {
  return `https://api.github.com/repos/${target.owner}/${target.repo}/contents/${target.path}`;
}

export async function requestDeviceCode(
  clientId: string,
  fetchFn: FetchFn = fetch,
  signal?: AbortSignal,
): Promise<DeviceCode> {
  const response = await fetchFn("/api/github/device/code", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ client_id: clientId, scope: "repo" }),
    signal,
  });
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

    const response = await fetchFn("/api/github/device/token", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        client_id: clientId,
        device_code: device.deviceCode,
        grant_type: DEVICE_GRANT_TYPE,
      }),
      signal,
    });
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
export async function revokeToken(
  token: string,
  fetchFn: FetchFn = fetch,
  signal?: AbortSignal,
): Promise<"revoked" | "unsupported"> {
  const response = await fetchFn("/api/github/token/revoke", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ access_token: token }),
    signal,
  });

  if (response.status === 501) {
    return "unsupported";
  }

  if (!response.ok) {
    throw new GitHubApiError(response.status, "could not revoke the token");
  }

  return "revoked";
}

export async function getAuthenticatedLogin(
  token: string,
  fetchFn: FetchFn = fetch,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetchFn("https://api.github.com/user", {
    headers: apiHeaders(token),
    signal,
  });

  if (!response.ok) {
    throw new GitHubApiError(response.status, "could not read GitHub user");
  }

  const data = await response.json();
  return data.login;
}

export async function getFile(
  target: SyncTarget,
  token: string,
  fetchFn: FetchFn = fetch,
  signal?: AbortSignal,
): Promise<RemoteFile | "not_found"> {
  const response = await fetchFn(
    `${contentsUrl(target)}?ref=${encodeURIComponent(target.branch)}`,
    { headers: apiHeaders(token), signal },
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

export async function putFile(
  target: SyncTarget,
  token: string,
  lines: readonly string[],
  sha: string | undefined,
  fetchFn: FetchFn = fetch,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetchFn(contentsUrl(target), {
    method: "PUT",
    headers: apiHeaders(token),
    body: JSON.stringify({
      message: "chore: sync todos from headway",
      content: encodeLines(lines),
      branch: target.branch,
      ...(sha ? { sha } : {}),
    }),
    signal,
  });

  if (!response.ok) {
    throw new GitHubApiError(
      response.status,
      `GitHub returned ${response.status} while writing the file`,
    );
  }

  const data = await response.json();
  return data.content.sha;
}

// UTF-8-safe base64: btoa/atob only handle byte strings.
export function encodeLines(lines: readonly string[]): string {
  const bytes = new TextEncoder().encode(lines.join("\n") + "\n");
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export function decodeContent(content: string): readonly string[] {
  const binary = atob(content.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const lines = new TextDecoder().decode(bytes).split("\n");

  while (lines.length > 0 && lines.at(-1) === "") {
    lines.pop();
  }

  return lines;
}
