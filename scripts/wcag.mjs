// WCAG 2.1 contrast math shared by the theme generator.
// Mirrored in src/store/theme/contrast.ts for app/test use; the generator
// cannot import TypeScript, so the two must stay in sync.

export function relativeLuminance(hex) {
  const value = parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
  const [r, g, b] = channels.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function mixHex(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const mixed = [16, 8, 0].map((shift) => {
    const channelA = (a >> shift) & 0xff;
    const channelB = (b >> shift) & 0xff;
    return Math.round(channelA + (channelB - channelA) * t);
  });
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

// Blend `foreground` toward `background` (or, when foreground itself lacks
// contrast, toward black/white) until the result sits just above `target`
// contrast vs `background`. Deterministic; returns the best pole if even
// pure black/white cannot reach the target.
export function blendToRatio(foreground, background, target) {
  let toward;
  let increasing;
  if (contrastRatio(foreground, background) >= target) {
    toward = background;
    increasing = false;
  } else {
    toward =
      contrastRatio("#ffffff", background) >=
      contrastRatio("#000000", background)
        ? "#ffffff"
        : "#000000";
    increasing = true;
    if (contrastRatio(toward, background) < target) return toward;
  }

  let lo = 0;
  let hi = 1;
  let best = increasing ? toward : foreground;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const candidate = mixHex(foreground, toward, mid);
    if (contrastRatio(candidate, background) >= target) {
      best = candidate;
      if (increasing) {
        hi = mid;
      } else {
        lo = mid;
      }
    } else if (increasing) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return best;
}
