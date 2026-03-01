import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("react-redux");
});

describe("app hooks", () => {
  it("exports the typed dispatch hook from react-redux", async () => {
    const typedDispatchHook = Symbol("typedDispatchHook");
    const withDispatchTypes = vi.fn(() => typedDispatchHook);

    vi.doMock("react-redux", () => ({
      useDispatch: {
        withTypes: withDispatchTypes,
      },
      useSelector: {
        withTypes: vi.fn(),
      },
    }));

    const module = await import("../useAppDispatch");

    expect(withDispatchTypes).toHaveBeenCalledTimes(1);
    expect(module.useAppDispatch).toBe(typedDispatchHook);
  });

  it("exports the typed selector hook from react-redux", async () => {
    const typedSelectorHook = Symbol("typedSelectorHook");
    const withSelectorTypes = vi.fn(() => typedSelectorHook);

    vi.doMock("react-redux", () => ({
      useDispatch: {
        withTypes: vi.fn(),
      },
      useSelector: {
        withTypes: withSelectorTypes,
      },
    }));

    const module = await import("../useAppSelector");

    expect(withSelectorTypes).toHaveBeenCalledTimes(1);
    expect(module.useAppSelector).toBe(typedSelectorHook);
  });
});
