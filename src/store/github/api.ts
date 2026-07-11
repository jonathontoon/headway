export type FetchFn = typeof fetch;
export type WaitFn = (milliseconds: number) => Promise<void>;

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

const defaultWait: WaitFn = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

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
): Promise<DeviceCode> {
  const response = await fetchFn("/api/github/device/code", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ client_id: clientId, scope: "repo" }),
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
): Promise<string> {
  let interval = device.interval;
  const deadline = Date.now() + device.expiresIn * 1000;

  for (;;) {
    await wait(interval * 1000);

    if (Date.now() > deadline) {
      throw new Error("the device code expired - run 'login' again");
    }

    const response = await fetchFn("/api/github/device/token", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        client_id: clientId,
        device_code: device.deviceCode,
        grant_type: DEVICE_GRANT_TYPE,
      }),
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
        throw new Error("the device code expired - run 'login' again");
      case "access_denied":
        throw new Error("login was cancelled on GitHub");
      default:
        throw new GitHubApiError(
          response.status,
          data.error_description ?? data.error ?? "login failed",
        );
    }
  }
}

export async function getAuthenticatedLogin(
  token: string,
  fetchFn: FetchFn = fetch,
): Promise<string> {
  const response = await fetchFn("https://api.github.com/user", {
    headers: apiHeaders(token),
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
): Promise<RemoteFile | "not_found"> {
  const response = await fetchFn(
    `${contentsUrl(target)}?ref=${encodeURIComponent(target.branch)}`,
    { headers: apiHeaders(token) },
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
