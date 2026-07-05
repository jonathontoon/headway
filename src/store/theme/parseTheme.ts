import type { Theme } from "./types";

function extractHex(text: string, key: string): string | null {
  const match = text.match(
    new RegExp(`${key}\\s*=\\s*["']?(#[0-9a-fA-F]{6})["']?`),
  );
  return match ? match[1].toLowerCase() : null;
}

function extractSection(raw: string, header: string): string {
  const start = raw.indexOf(header);
  if (start === -1) return "";
  const nextSection = raw.indexOf("[", start + header.length);
  return nextSection === -1 ? raw.slice(start) : raw.slice(start, nextSection);
}

export function parseAlacrittyToml(raw: string): Theme | null {
  const bg = extractHex(raw, "background");
  const fg = extractHex(raw, "foreground");

  const normalSection = extractSection(raw, "[colors.normal]");
  const brightSection = extractSection(raw, "[colors.bright]");

  if (!normalSection || !brightSection) return null;

  const normal = [
    extractHex(normalSection, "black"),
    extractHex(normalSection, "red"),
    extractHex(normalSection, "green"),
    extractHex(normalSection, "yellow"),
    extractHex(normalSection, "blue"),
    extractHex(normalSection, "magenta"),
    extractHex(normalSection, "cyan"),
    extractHex(normalSection, "white"),
  ];

  const bright = [
    extractHex(brightSection, "black"),
    extractHex(brightSection, "red"),
    extractHex(brightSection, "green"),
    extractHex(brightSection, "yellow"),
    extractHex(brightSection, "blue"),
    extractHex(brightSection, "magenta"),
    extractHex(brightSection, "cyan"),
    extractHex(brightSection, "white"),
  ];

  if (!bg || !fg || normal.some((c) => !c) || bright.some((c) => !c)) {
    return null;
  }

  return {
    name: "imported",
    variant: "custom",
    background: bg,
    foreground: fg,
    colors: [...normal, ...bright] as unknown as Theme["colors"],
  };
}
