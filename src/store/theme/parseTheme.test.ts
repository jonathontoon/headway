import { parseAlacrittyToml } from "./parseTheme";

const toml = `
[colors.primary]
background = "#101010"
foreground = "#f0f0f0"

[colors.normal]
black = "#000000"
red = "#111111"
green = "#222222"
yellow = "#333333"
blue = "#444444"
magenta = "#555555"
cyan = "#666666"
white = "#777777"

[colors.bright]
black = "#888888"
red = "#999999"
green = "#aaaaaa"
yellow = "#bbbbbb"
blue = "#cccccc"
magenta = "#dddddd"
cyan = "#eeeeee"
white = "#ffffff"
`;

describe("parseAlacrittyToml", () => {
  it("parses Alacritty colors into a named light or dark theme", () => {
    const theme = parseAlacrittyToml(toml, {
      name: "sample",
      mode: "light",
    });

    expect(theme).toEqual({
      name: "sample",
      mode: "light",
      background: "#101010",
      foreground: "#f0f0f0",
      colors: [
        "#000000",
        "#111111",
        "#222222",
        "#333333",
        "#444444",
        "#555555",
        "#666666",
        "#777777",
        "#888888",
        "#999999",
        "#aaaaaa",
        "#bbbbbb",
        "#cccccc",
        "#dddddd",
        "#eeeeee",
        "#ffffff",
      ],
    });
  });

  it("returns null when required sections are missing", () => {
    expect(parseAlacrittyToml("[colors.primary]")).toBeNull();
  });
});
