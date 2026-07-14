// GitHub's device-flow endpoints reject browser CORS requests, so the
// worker forwards them same-origin. The Contents API is called directly
// from the browser and never passes through here.
const DEVICE_FLOW_ROUTES: Readonly<Record<string, string>> = {
  "/api/github/device/code": "https://github.com/login/device/code",
  "/api/github/device/token": "https://github.com/login/oauth/access_token",
};

// Revoking an OAuth grant requires the app's client secret, so it can only
// happen here, never in the browser. Configure via
// `wrangler secret put GITHUB_CLIENT_SECRET` plus a GITHUB_CLIENT_ID var;
// the route answers 501 until both are set.
const REVOKE_ROUTE = "/api/github/token/revoke";

// Device-flow request bodies are a couple of short fields; anything larger
// is not a legitimate client.
const MAX_BODY_BYTES = 4096;

type Env = {
  readonly GITHUB_CLIENT_ID?: string;
  readonly GITHUB_CLIENT_SECRET?: string;
};

function parseJsonObject(body: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(body);
    return typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

async function revokeGrant(body: string, env: Env): Promise<Response> {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response("Token revocation is not configured", { status: 501 });
  }

  const token = parseJsonObject(body)?.access_token;

  if (typeof token !== "string" || token === "") {
    return new Response("Bad request", { status: 400 });
  }

  const response = await fetch(
    `https://api.github.com/applications/${encodeURIComponent(env.GITHUB_CLIENT_ID)}/grant`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`)}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: token }),
    },
  );

  // 404 means the grant is already gone, which is the state the caller
  // wanted; report both as revoked.
  if (response.status === 204 || response.status === 404) {
    return new Response(null, { status: 204 });
  }

  return new Response("Could not revoke the token", { status: 502 });
}

export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const url = new URL(request.url);

    // Same-origin browsers only: without this, any site could use these
    // routes as a CORS-bypassing proxy to GitHub's device-flow endpoints
    // and run its authorization phishing through this domain.
    const origin = request.headers.get("Origin");
    if (origin !== null && origin !== url.origin) {
      return new Response("Forbidden", { status: 403 });
    }

    const upstream = DEVICE_FLOW_ROUTES[url.pathname];
    const isRevoke = url.pathname === REVOKE_ROUTE;

    if ((!upstream && !isRevoke) || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    const body = await request.text();

    if (body.length > MAX_BODY_BYTES) {
      return new Response("Payload too large", { status: 413 });
    }

    if (isRevoke) {
      return revokeGrant(body, env);
    }

    // When the deployment pins its client id, refuse to proxy for any
    // other OAuth app and forward the pinned id regardless of what the
    // caller sent.
    let forwardBody = body;
    if (env.GITHUB_CLIENT_ID) {
      const parsed = parseJsonObject(body);

      if (!parsed) {
        return new Response("Bad request", { status: 400 });
      }

      if (
        parsed.client_id !== undefined &&
        parsed.client_id !== env.GITHUB_CLIENT_ID
      ) {
        return new Response("Unknown client id", { status: 403 });
      }

      forwardBody = JSON.stringify({
        ...parsed,
        client_id: env.GITHUB_CLIENT_ID,
      });
    }

    const response = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: forwardBody,
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
    });
  },
};
