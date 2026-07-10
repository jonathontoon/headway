import type { Theme } from "./types";

// Base palette: Gogh "earthsong". Tweak freely — this is the only theme.
export const THEME: Theme = {
  name: "earthsong",
  background: "#292520",
  foreground: "#e5c7a9",
  colors: [
    "#121418",
    "#c94234",
    "#85c54c",
    "#f5ae2e",
    "#1398b9",
    "#d0633d",
    "#509552",
    "#e5c6aa",
    "#675f54",
    "#ff645a",
    "#98e036",
    "#e0d561",
    "#5fdaff",
    "#ff9269",
    "#84f088",
    "#f6f7ec",
  ],
  roles: {
    error: 9,
    warning: 3,
    success: 2,
    info: 13,
    accent: 14,
    context: 4,
    command: 3,
    muted: "#9e8a76",
  },
};
