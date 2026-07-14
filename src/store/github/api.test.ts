import {
  GitHubApiError,
  decodeContent,
  encodeLines,
  getFile,
  pollForToken,
  putFile,
  requestDeviceCode,
  revokeToken,
  type DeviceCode,
  type FetchFn,
  type SyncTarget,
  type WaitFn,
} from "./api";

const target: SyncTarget = {
  owner: "toon",
  repo: "todos",
  branch: "main",
  path: "todo.txt",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function fetchOnce(response: Response, calls: RequestInit[] = []): FetchFn {
  return (_input, init) => {
    calls.push(init ?? {});
    return Promise.resolve(response);
  };
}

const instantWait = () => Promise.resolve();

describe("github api", () => {
  it("requests a device code through the worker proxy", async () => {
    const calls: RequestInit[] = [];
    const device = await requestDeviceCode(
      "client123",
      fetchOnce(
        jsonResponse({
          device_code: "dev1",
          user_code: "ABCD-1234",
          verification_uri: "https://github.com/login/device",
          interval: 5,
          expires_in: 900,
        }),
        calls,
      ),
    );

    expect(device).toEqual({
      deviceCode: "dev1",
      userCode: "ABCD-1234",
      verificationUri: "https://github.com/login/device",
      interval: 5,
      expiresIn: 900,
    });
    expect(JSON.parse(calls[0].body as string)).toEqual({
      client_id: "client123",
      scope: "repo",
    });
  });

  it("polls until authorization succeeds, backing off on slow_down", async () => {
    const device: DeviceCode = {
      deviceCode: "dev1",
      userCode: "ABCD-1234",
      verificationUri: "https://github.com/login/device",
      interval: 5,
      expiresIn: 900,
    };
    const responses = [
      jsonResponse({ error: "authorization_pending" }),
      jsonResponse({ error: "slow_down" }),
      jsonResponse({ error: "authorization_pending" }),
      jsonResponse({ access_token: "gho_token" }),
    ];
    const waits: number[] = [];
    const fetchFn: FetchFn = () => Promise.resolve(responses.shift()!);

    const token = await pollForToken("client123", device, fetchFn, (ms) => {
      waits.push(ms);
      return Promise.resolve();
    });

    expect(token).toBe("gho_token");
    expect(waits).toEqual([5000, 5000, 10000, 10000]);
  });

  it("fails when access is denied or the device code expires", async () => {
    const device: DeviceCode = {
      deviceCode: "dev1",
      userCode: "ABCD-1234",
      verificationUri: "https://github.com/login/device",
      interval: 5,
      expiresIn: 900,
    };

    await expect(
      pollForToken(
        "client123",
        device,
        fetchOnce(jsonResponse({ error: "access_denied" })),
        instantWait,
      ),
    ).rejects.toThrow("authorization was denied on GitHub");

    await expect(
      pollForToken(
        "client123",
        device,
        fetchOnce(jsonResponse({ error: "expired_token" })),
        instantWait,
      ),
    ).rejects.toThrow("device code expired");
  });

  it("propagates an abort signal through the wait function", async () => {
    const device: DeviceCode = {
      deviceCode: "dev1",
      userCode: "ABCD-1234",
      verificationUri: "https://github.com/login/device",
      interval: 5,
      expiresIn: 900,
    };
    const controller = new AbortController();
    controller.abort();
    const waitFn: WaitFn = (_ms, signal) =>
      signal?.aborted
        ? Promise.reject(new DOMException("Aborted", "AbortError"))
        : Promise.resolve();
    const fetchFn: FetchFn = () => {
      throw new Error("fetch should not run once aborted");
    };

    await expect(
      pollForToken("client123", device, fetchFn, waitFn, controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("passes the abort signal into the underlying fetch calls", async () => {
    const controller = new AbortController();
    const calls: RequestInit[] = [];

    await requestDeviceCode(
      "client123",
      fetchOnce(
        jsonResponse({
          device_code: "dev1",
          user_code: "ABCD-1234",
          verification_uri: "https://github.com/login/device",
          interval: 5,
          expires_in: 900,
        }),
        calls,
      ),
      controller.signal,
    );

    expect(calls[0].signal).toBe(controller.signal);
  });

  it("reads a remote file with its blob sha", async () => {
    const fetchFn = fetchOnce(
      jsonResponse({
        sha: "abc123",
        content: encodeLines(["(A) Pay bill", "Call plumber"]),
      }),
    );

    expect(await getFile(target, "gho_token", fetchFn)).toEqual({
      sha: "abc123",
      lines: ["(A) Pay bill", "Call plumber"],
    });
  });

  it("maps 404 to not_found and other failures to GitHubApiError", async () => {
    expect(
      await getFile(target, "gho_token", fetchOnce(jsonResponse({}, 404))),
    ).toBe("not_found");

    await expect(
      getFile(target, "gho_token", fetchOnce(jsonResponse({}, 401))),
    ).rejects.toThrow(GitHubApiError);
  });

  it("writes a file and returns the new content sha", async () => {
    const calls: RequestInit[] = [];
    const sha = await putFile(
      target,
      "gho_token",
      ["(A) Pay bill"],
      "old-sha",
      fetchOnce(jsonResponse({ content: { sha: "new-sha" } }, 201), calls),
    );

    expect(sha).toBe("new-sha");
    const body = JSON.parse(calls[0].body as string);
    expect(body.sha).toBe("old-sha");
    expect(body.branch).toBe("main");
    expect(body.message).toBe("chore: sync todos from headway");
  });

  it("encodes owner, repo, and path segments into the contents URL", async () => {
    const urls: string[] = [];
    const fetchFn: FetchFn = (input) => {
      urls.push(typeof input === "string" ? input : input.toString());
      return Promise.resolve(jsonResponse({ sha: "abc", content: "" }));
    };

    await getFile(
      {
        owner: "toon?",
        repo: "todos#1",
        branch: "feature/x",
        path: "lists/todo list.txt",
      },
      "gho_token",
      fetchFn,
    );

    expect(urls[0]).toBe(
      "https://api.github.com/repos/toon%3F/todos%231/contents/lists/todo%20list.txt?ref=feature%2Fx",
    );
  });

  it("revokes a token through the worker and reports unsupported deployments", async () => {
    const calls: RequestInit[] = [];
    expect(
      await revokeToken(
        "gho_token",
        fetchOnce(new Response(null, { status: 204 }), calls),
      ),
    ).toBe("revoked");
    expect(JSON.parse(calls[0].body as string)).toEqual({
      access_token: "gho_token",
    });

    expect(
      await revokeToken(
        "gho_token",
        fetchOnce(new Response("", { status: 501 })),
      ),
    ).toBe("unsupported");

    await expect(
      revokeToken("gho_token", fetchOnce(new Response("", { status: 502 }))),
    ).rejects.toThrow(GitHubApiError);
  });

  it("round-trips unicode content through base64", () => {
    const lines = ["(A) Café rüsumé ♥ 日本語", "plain ascii"];
    expect(decodeContent(encodeLines(lines))).toEqual(lines);
  });

  it("tolerates whitespace inside base64 payloads from the contents API", () => {
    const encoded = encodeLines(["(A) Pay bill", "Call plumber"]);
    const wrapped = encoded.replace(/(.{10})/g, "$1\n");
    expect(decodeContent(wrapped)).toEqual(["(A) Pay bill", "Call plumber"]);
  });
});
