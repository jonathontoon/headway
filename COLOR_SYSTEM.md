# Terminal Color System

## Design Philosophy

The color system now tracks a more classic terminal palette: **zinc neutrals**
for structure, then a small set of vivid Tailwind utility colors for status and
highlights. It keeps the interface dark and legible, but reads closer to the
reference terminal styling.

## Core Colors

### Neutral

- **text** (`#fafafa`): Near-white primary text
- **muted** (`#71717a`): Zinc secondary text (`zinc-500`)
- **dim** (`#52525b`): Lower-emphasis text (`zinc-600`)
- **background** (`#09090b`): Main terminal background (`zinc-950`)
- **surface** (`#18181b`): Elevated surface (`zinc-900`)
- **hover** (`#27272a`): Hover/strong border surface (`zinc-800`)

### Status Colors

These now map directly to the reference palette:

- **success** (`#22c55e`): `green-500`
- **error** (`#ef4444`): `red-500`
- **warning** (`#f59e0b`): `amber-500`
- **info** (`#67e8f9`): `cyan-300`

### Accents

- **accent** (`#fef08a`): `yellow-200` for highlighted arguments and links
- **prompt** (`#fafafa`): Bright prompt marker text

## Todo Priority Colors (A-Z)

Each priority level uses a Tailwind accent that stays readable on the dark zinc
background:

| Priority | Color     | Hex     |
| -------- | --------- | ------- |
| A        | Red       | #ef4444 |
| B        | Yellow    | #fef08a |
| C        | Green     | #22c55e |
| D        | Green-2   | #4ade80 |
| E        | Emerald   | #6ee7b7 |
| F        | Cyan      | #67e8f9 |
| G        | Sky       | #7dd3fc |
| H        | Blue      | #93c5fd |
| I        | Indigo    | #a5b4fc |
| J        | Violet    | #c4b5fd |
| K        | Purple    | #d8b4fe |
| L        | Fuchsia   | #f0abfc |
| M        | Pink      | #f9a8d4 |
| N        | Rose      | #fda4af |
| O        | Orange    | #fdba74 |
| P        | Amber     | #fcd34d |
| Q        | Lime      | #bef264 |
| R        | Teal      | #5eead4 |
| S        | Cyan-2    | #22d3ee |
| T        | Yellow-2  | #fde047 |
| U        | Green-3   | #86efac |
| V        | Emerald-2 | #34d399 |
| W        | Sky-2     | #38bdf8 |
| X        | Violet-2  | #a78bfa |
| Y        | Pink-2    | #f472b6 |
| Z        | Zinc      | #a1a1aa |

## Implementation

Colors are defined in [src/styles/global.css](/Users/toon/src/headway/src/styles/global.css)
inside Tailwind v4's `@theme` block and used via classes like
`text-terminal-success`, `text-terminal-muted`, and `text-terminal-prioA`.

### Usage Examples

```tsx
// Status icon + message
<span className="text-terminal-success">[✓]</span>
<span className="text-terminal-text">Task completed</span>

// Todo priorities
<span className="text-terminal-prioA">(A)</span>
<span className="text-terminal-prioB">(B)</span>

// Prompt
<span className="text-terminal-muted">~</span>
<span className="text-terminal-text">$</span>
```

## Why This Palette?

1. **Closer visual match** to the reference terminal styles
2. **Stronger semantic signals** from familiar Tailwind status colors
3. **Cleaner hierarchy** with zinc neutrals handling most UI chrome
4. **Better contrast** for prompts, status markers, and command output
