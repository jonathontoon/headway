// GitHub's device-flow endpoints reject browser CORS requests, so the
// worker forwards them same-origin. The Contents API is called directly
// from the browser and never passes through here.
const DEVICE_FLOW_ROUTES: Readonly<Record<string, string>> = {
  "/api/github/device/code": "https://github.com/login/device/code",
  "/api/github/device/token": "https://github.com/login/oauth/access_token",
};

export default {
  async fetch(request: Request): Promise<Response> {
    const upstream = DEVICE_FLOW_ROUTES[new URL(request.url).pathname];

    if (!upstream || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    const response = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: await request.text(),
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  },
};
