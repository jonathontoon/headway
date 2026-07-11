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
});
