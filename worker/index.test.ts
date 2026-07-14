// @vitest-environment node
import worker from "./index";

describe("device flow proxy worker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards device code requests to github.com", async () => {
    const upstream = vi.fn(
      async () =>
        new Response(JSON.stringify({ device_code: "dev1" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://headway.example/api/github/device/code", {
        method: "POST",
        body: JSON.stringify({ client_id: "client123", scope: "repo" }),
      }),
    );

    expect(upstream).toHaveBeenCalledWith(
      "https://github.com/login/device/code",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ client_id: "client123", scope: "repo" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ device_code: "dev1" });
  });

  it("forwards token requests and passes the upstream status through", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "authorization_pending" }), {
            status: 200,
          }),
      ),
    );

    const response = await worker.fetch(
      new Request("https://headway.example/api/github/device/token", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(await response.json()).toEqual({ error: "authorization_pending" });
  });

  it("rejects unknown paths and non-POST methods", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const unknown = await worker.fetch(
      new Request("https://headway.example/api/other", { method: "POST" }),
    );
    const wrongMethod = await worker.fetch(
      new Request("https://headway.example/api/github/device/code"),
    );

    expect(unknown.status).toBe(404);
    expect(wrongMethod.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests but allows same-origin ones", async () => {
    const upstream = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", upstream);

    const crossOrigin = await worker.fetch(
      new Request("https://headway.example/api/github/device/code", {
        method: "POST",
        headers: { Origin: "https://evil.example" },
        body: "{}",
      }),
    );
    expect(crossOrigin.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();

    const sameOrigin = await worker.fetch(
      new Request("https://headway.example/api/github/device/code", {
        method: "POST",
        headers: { Origin: "https://headway.example" },
        body: "{}",
      }),
    );
    expect(sameOrigin.status).toBe(200);
  });

  it("rejects oversized request bodies", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://headway.example/api/github/device/code", {
        method: "POST",
        body: "x".repeat(5000),
      }),
    );

    expect(response.status).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies sent without a Content-Length header, without forwarding upstream", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(3000));
        controller.enqueue(new Uint8Array(3000));
        controller.close();
      },
    });

    const request = new Request(
      "https://headway.example/api/github/device/code",
      {
        method: "POST",
        body: stream,
        duplex: "half",
      } as RequestInit,
    );
    expect(request.headers.get("Content-Length")).toBeNull();

    const response = await worker.fetch(request);

    expect(response.status).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("pins the client id when the deployment configures one", async () => {
    const upstream = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", upstream);
    const env = { GITHUB_CLIENT_ID: "pinned123" };

    const mismatched = await worker.fetch(
      new Request("https://headway.example/api/github/device/code", {
        method: "POST",
        body: JSON.stringify({ client_id: "someone-else", scope: "repo" }),
      }),
      env,
    );
    expect(mismatched.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();

    await worker.fetch(
      new Request("https://headway.example/api/github/device/code", {
        method: "POST",
        body: JSON.stringify({ scope: "repo" }),
      }),
      env,
    );
    expect(upstream).toHaveBeenCalledWith(
      "https://github.com/login/device/code",
      expect.objectContaining({
        body: JSON.stringify({ scope: "repo", client_id: "pinned123" }),
      }),
    );
  });

  it("answers 501 for revocation until the worker is configured for it", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://headway.example/api/github/token/revoke", {
        method: "POST",
        body: JSON.stringify({ access_token: "gho_token" }),
      }),
    );

    expect(response.status).toBe(501);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("revokes the grant through GitHub's application API when configured", async () => {
    const upstream = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://headway.example/api/github/token/revoke", {
        method: "POST",
        body: JSON.stringify({ access_token: "gho_token" }),
      }),
      { GITHUB_CLIENT_ID: "pinned123", GITHUB_CLIENT_SECRET: "shhh" },
    );

    expect(response.status).toBe(204);
    expect(upstream).toHaveBeenCalledWith(
      "https://api.github.com/applications/pinned123/grant",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ access_token: "gho_token" }),
      }),
    );
    const headers = (upstream.mock.calls[0] as unknown[])[1] as RequestInit;
    expect((headers.headers as Record<string, string>).Authorization).toBe(
      `Basic ${btoa("pinned123:shhh")}`,
    );
  });

  it("does not report revoked when GitHub answers 404 (mismatched client id or app)", async () => {
    const upstream = vi.fn(
      async () => new Response("Not Found", { status: 404 }),
    );
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://headway.example/api/github/token/revoke", {
        method: "POST",
        body: JSON.stringify({ access_token: "gho_token" }),
      }),
      { GITHUB_CLIENT_ID: "pinned123", GITHUB_CLIENT_SECRET: "shhh" },
    );

    expect(response.status).toBe(502);
  });

  it("rejects revocation requests without a token", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://headway.example/api/github/token/revoke", {
        method: "POST",
        body: "{}",
      }),
      { GITHUB_CLIENT_ID: "pinned123", GITHUB_CLIENT_SECRET: "shhh" },
    );

    expect(response.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
});
