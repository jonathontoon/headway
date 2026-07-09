import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { blendToRatio, contrastRatio } from "./wcag.mjs";

const GOGH_THEMES_URL =
  "https://raw.githubusercontent.com/Gogh-Co/Gogh/master/data/themes.json";
const GOGH_WCAG_URL =
  "https://raw.githubusercontent.com/Gogh-Co/Gogh/master/data/wcag.json";
const OUT_FILE = path.join(process.cwd(), "src/store/theme/defaultThemes.ts");

// Semantic role resolution. Each role takes the first preferred slot whose
// contrast vs the theme background meets WCAG AA for normal text (4.5:1),
// falling back to the foreground, then to a synthesized blend.
const MIN_CONTRAST = 4.5;
const BLEND_TARGET_CONTRAST = 4.6;
// Muted text must stay de-emphasized: slot 8 above this band would read as
// body text, so it gets replaced with a blend near the minimum instead.
const MUTED_MAX_CONTRAST = 9;

const ROLE_SLOT_PREFERENCES = {
  error: [1, 9],
  warning: [3, 11, 1, 9],
  success: [2, 10, 6, 14],
  info: [5, 13, 4, 12],
  accent: [6, 14, 4, 12],
  context: [4, 12, 5, 13],
  command: [3, 11, 6, 14],
};
const CUSTOM_THEME_FAMILIES = [
  {
    name: "hyper",
    dark: {
      name: "hyper",
      mode: "dark",
      background: "#000000",
      foreground: "#c8c8c8",
      colors: [
        "#2d3139",
        "#e06c75",
        "#14fa50",
        "#e0c285",
        "#52adf2",
        "#d55fde",
        "#57b6c2",
        "#ffffff",
        "#5c6370",
        "#ef596f",
        "#89ca78",
        "#e5c07b",
        "#6796e6",
        "#c679dd",
        "#2bbac5",
        "#f8fafd",
      ],
    },
  },
];

function slugifyName(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\+/g, "plus")
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function normalizeGoghFamilyName(name) {
  return slugifyName(
    name.replace(
      /\s+(day|night|dark|light|dark\+|light\+|light-theme|dark-theme)$/i,
      "",
    ),
  );
}

function normalizeHex(value) {
  if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)) {
    return null;
  }

  return value.toLowerCase();
}

function parseGoghTheme(rawTheme) {
  const mode = rawTheme.variant;
  if (mode !== "dark" && mode !== "light") return null;

  const colors = Array.from({ length: 16 }, (_, index) => {
    const key = `color_${String(index + 1).padStart(2, "0")}`;
    return normalizeHex(rawTheme[key]);
  });
  const background = normalizeHex(rawTheme.background);
  const foreground = normalizeHex(rawTheme.foreground);
  const name = normalizeGoghFamilyName(rawTheme.name);

  if (!name || !background || !foreground || colors.some((color) => !color)) {
    return null;
  }

  return {
    name,
    mode,
    background,
    foreground,
    colors,
  };
}

function validateCustomTheme(theme) {
  if (theme.name !== slugifyName(theme.name)) {
    throw new Error(`Custom theme name must be slugified: ${theme.name}`);
  }

  for (const mode of ["dark", "light"]) {
    const variant = theme[mode];
    if (!variant) continue;

    const colors = variant.colors ?? [];
    const normalizedColors = colors.map(normalizeHex);

    if (
      variant.name !== theme.name ||
      variant.mode !== mode ||
      !normalizeHex(variant.background) ||
      !normalizeHex(variant.foreground) ||
      colors.length !== 16 ||
      normalizedColors.some((color) => !color)
    ) {
      throw new Error(`Invalid custom ${mode} theme: ${theme.name}`);
    }
  }
}

function addTheme(families, theme) {
  const modes = families.get(theme.name) ?? new Map();

  if (modes.has(theme.mode)) {
    return false;
  }

  modes.set(theme.mode, theme);
  families.set(theme.name, modes);
  return true;
}

function addCustomThemeFamilies(families, customFamilies) {
  for (const customFamily of customFamilies) {
    validateCustomTheme(customFamily);

    if (families.has(customFamily.name)) {
      throw new Error(
        `Custom theme duplicates existing theme: ${customFamily.name}`,
      );
    }

    for (const mode of ["dark", "light"]) {
      const variant = customFamily[mode];
      if (variant) addTheme(families, variant);
    }
  }
}

// number = slot index into theme.colors, string = literal hex
// (foreground or synthesized blend).
function resolveRoles(theme) {
  const slotRatios = theme.colors.map((color) =>
    contrastRatio(color, theme.background),
  );
  const foregroundPasses =
    contrastRatio(theme.foreground, theme.background) >= MIN_CONTRAST;

  const roles = {};
  for (const [role, preferences] of Object.entries(ROLE_SLOT_PREFERENCES)) {
    const slot = preferences.find((index) => slotRatios[index] >= MIN_CONTRAST);
    if (slot !== undefined) {
      roles[role] = slot;
    } else if (foregroundPasses) {
      roles[role] = theme.foreground;
    } else {
      roles[role] = blendToRatio(
        theme.foreground,
        theme.background,
        BLEND_TARGET_CONTRAST,
      );
    }
  }

  roles.muted =
    slotRatios[8] >= MIN_CONTRAST && slotRatios[8] <= MUTED_MAX_CONTRAST
      ? 8
      : blendToRatio(theme.foreground, theme.background, BLEND_TARGET_CONTRAST);

  return roles;
}

function buildWcagMap(rawWcagEntries) {
  const map = new Map();
  for (const entry of rawWcagEntries) {
    const slots = new Map();
    for (const result of entry.results ?? []) {
      slots.set(result.Color, {
        hex: normalizeHex(result.Hex),
        ratio: Number.parseFloat(result.Ratio),
      });
    }
    map.set(entry.theme, slots);
  }
  return map;
}

// Cross-check locally computed ratios against Gogh's published WCAG data.
// Local math stays authoritative (the published ratios are rounded to one
// decimal); mismatches only warn so the build never ships silently.
function crossCheckWcag(theme, rawName, wcagMap, stats) {
  const slots = wcagMap.get(rawName);
  if (!slots) {
    stats.wcagMissing += 1;
    console.warn(`No wcag.json entry for "${rawName}"; used local math only.`);
    return;
  }

  theme.colors.forEach((color, index) => {
    const key = `color_${String(index + 1).padStart(2, "0")}`;
    const published = slots.get(key);
    if (!published || published.hex !== color) {
      stats.wcagHexMismatches += 1;
      return;
    }
    const local = contrastRatio(color, theme.background);
    if (Math.abs(local - published.ratio) > 0.2) {
      stats.wcagRatioDrift += 1;
      console.warn(
        `Ratio drift for "${rawName}" ${key}: local ${local.toFixed(2)} vs published ${published.ratio}`,
      );
    }
  });
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "headway-theme-generator/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`);
  }

  return response.text();
}

function formatRoleValue(value) {
  return typeof value === "number" ? `${value}` : `"${value}"`;
}

function formatTheme(theme) {
  const colors = theme.colors.map((color) => `        "${color}",`).join("\n");
  const roles = Object.entries(theme.roles)
    .map(([role, value]) => `        ${role}: ${formatRoleValue(value)},`)
    .join("\n");

  return `    ${theme.mode}: {
      name: "${theme.name}",
      mode: "${theme.mode}",
      background: "${theme.background}",
      foreground: "${theme.foreground}",
      colors: [
${colors}
      ],
      roles: {
${roles}
      },
    },`;
}

function formatThemeFamilies(families) {
  const body = families
    .map(([name, modes]) => {
      const entries = ["dark", "light"]
        .filter((mode) => modes.has(mode))
        .map((mode) => formatTheme(modes.get(mode)))
        .join("\n");

      return `  {
    name: "${name}",
${entries}
  },`;
    })
    .join("\n");

  return `import type { ThemeFamily } from "./types";

// Generated by scripts/generate-terminal-colors.mjs.
// Source: https://raw.githubusercontent.com/Gogh-Co/Gogh/master/data/themes.json
// Role colors are contrast-validated (WCAG AA, 4.5:1 vs background) against
// https://raw.githubusercontent.com/Gogh-Co/Gogh/master/data/wcag.json
export const DEFAULT_THEME_FAMILIES: readonly ThemeFamily[] = [
${body}
];
`;
}

const families = new Map();
const stats = {
  goghThemes: 0,
  skippedGoghThemes: 0,
  wcagMissing: 0,
  wcagHexMismatches: 0,
  wcagRatioDrift: 0,
};

const [goghThemes, wcagEntries] = await Promise.all([
  fetchText(GOGH_THEMES_URL).then(JSON.parse),
  fetchText(GOGH_WCAG_URL).then(JSON.parse),
]);
const wcagMap = buildWcagMap(wcagEntries);

for (const rawTheme of goghThemes) {
  const parsed = parseGoghTheme(rawTheme);

  if (!parsed) {
    stats.skippedGoghThemes += 1;
    continue;
  }

  if (!addTheme(families, parsed)) {
    stats.skippedGoghThemes += 1;
    continue;
  }
  crossCheckWcag(parsed, rawTheme.name, wcagMap, stats);
  stats.goghThemes += 1;
}

addCustomThemeFamilies(families, CUSTOM_THEME_FAMILIES);

const roleStats = { slot: 0, foreground: 0, blend: 0 };
for (const modes of families.values()) {
  for (const theme of modes.values()) {
    theme.roles = resolveRoles(theme);
    for (const value of Object.values(theme.roles)) {
      if (typeof value === "number") roleStats.slot += 1;
      else if (value === theme.foreground) roleStats.foreground += 1;
      else roleStats.blend += 1;
    }
  }
}

const sortedFamilies = [...families.entries()].sort(([a], [b]) =>
  a.localeCompare(b),
);

await mkdir(path.dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, formatThemeFamilies(sortedFamilies));

console.log(`Generated ${sortedFamilies.length} theme families in ${OUT_FILE}`);
console.log(
  `Added ${stats.goghThemes} Gogh palettes; skipped ${stats.skippedGoghThemes} duplicates/invalid entries.`,
);
console.log(
  `Role resolution: ${roleStats.slot} from palette slots, ${roleStats.foreground} from foreground, ${roleStats.blend} blended for contrast.`,
);
console.log(
  `WCAG cross-check: ${stats.wcagMissing} missing entries, ${stats.wcagHexMismatches} hex mismatches, ${stats.wcagRatioDrift} ratio drifts.`,
);
