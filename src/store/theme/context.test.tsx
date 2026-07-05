import { act, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "./context";
import { useTheme } from "./themeContext";

const colorSchemeQuery = "(prefers-color-scheme: dark)";
const listeners = new Set<(event: MediaQueryListEvent) => void>();
let prefersDark = false;

function installMatchMediaMock() {
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn((query: string) => ({
      get matches() {
        return query === colorSchemeQuery && prefersDark;
      },
      media: query,
      onchange: null,
      addEventListener(event: string, listener: EventListener) {
        if (event === "change") {
          listeners.add(listener as (event: MediaQueryListEvent) => void);
        }
      },
      removeEventListener(event: string, listener: EventListener) {
        if (event === "change") {
          listeners.delete(listener as (event: MediaQueryListEvent) => void);
        }
      },
      dispatchEvent: () => true,
    })),
    configurable: true,
  });
}

function setPreferredColorScheme(nextPrefersDark: boolean) {
  prefersDark = nextPrefersDark;
  const event = {
    matches: prefersDark,
    media: colorSchemeQuery,
  } as MediaQueryListEvent;

  listeners.forEach((listener) => listener(event));
}

function Probe() {
  const { setTheme, theme } = useTheme();

  return (
    <>
      <div data-testid="theme">
        {theme.name}:{theme.mode}
      </div>
      <button type="button" onClick={() => setTheme("catppuccin")}>
        Set Catppuccin
      </button>
    </>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    listeners.clear();
    prefersDark = false;
    localStorage.removeItem("headway-theme");
    document.documentElement.removeAttribute("style");
    installMatchMediaMock();
  });

  it("applies the light palette from the browser preference", () => {
    localStorage.setItem("headway-theme", "ayu");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("ayu:light");
    expect(
      document.documentElement.style.getPropertyValue("--background"),
    ).toBe("#f8f9fa");
  });

  it("applies the dark palette from the browser preference", () => {
    prefersDark = true;
    localStorage.setItem("headway-theme", "ayu");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("ayu:dark");
    expect(
      document.documentElement.style.getPropertyValue("--background"),
    ).toBe("#0b0e14");
  });

  it("updates the applied palette when the browser preference changes", () => {
    localStorage.setItem("headway-theme", "ayu");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    act(() => setPreferredColorScheme(true));

    expect(screen.getByTestId("theme")).toHaveTextContent("ayu:dark");
    expect(
      document.documentElement.style.getPropertyValue("--background"),
    ).toBe("#0b0e14");
  });

  it("stores only the selected theme name", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Set Catppuccin" }));

    expect(localStorage.getItem("headway-theme")).toBe("catppuccin");
  });
});
