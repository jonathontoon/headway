import { act, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "./context";
import { DEFAULT_THEME_FAMILIES } from "./defaultThemes";
import { useTheme } from "./themeContext";

const colorSchemeQuery = "(prefers-color-scheme: dark)";
const listeners = new Set<(event: MediaQueryListEvent) => void>();
const testTheme = DEFAULT_THEME_FAMILIES[0];
const alternateTheme = DEFAULT_THEME_FAMILIES[1];
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
      <button type="button" onClick={() => setTheme(alternateTheme.name)}>
        Set Alternate
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
    localStorage.setItem("headway-theme", testTheme.name);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent(
      `${testTheme.name}:light`,
    );
    expect(
      document.documentElement.style.getPropertyValue("--background"),
    ).toBe(testTheme.light?.background);
  });

  it("applies the dark palette from the browser preference", () => {
    prefersDark = true;
    localStorage.setItem("headway-theme", testTheme.name);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent(
      `${testTheme.name}:dark`,
    );
    expect(
      document.documentElement.style.getPropertyValue("--background"),
    ).toBe(testTheme.dark?.background);
    expect(
      document.documentElement.style.getPropertyValue("--role-error"),
    ).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("updates the applied palette when the browser preference changes", () => {
    localStorage.setItem("headway-theme", testTheme.name);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    act(() => setPreferredColorScheme(true));

    expect(screen.getByTestId("theme")).toHaveTextContent(
      `${testTheme.name}:dark`,
    );
    expect(
      document.documentElement.style.getPropertyValue("--background"),
    ).toBe(testTheme.dark?.background);
  });

  it("stores only the selected theme name", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Set Alternate" }));

    expect(localStorage.getItem("headway-theme")).toBe(alternateTheme.name);
  });
});
