# Terminal Color System

## Design Philosophy

The color system uses a **calm, expressive pastel palette** rather than harsh high-contrast colors. This creates a gentler, more inviting interface while maintaining readability. All colors are desaturated and softened compared to standard bright terminal colors.

## Core Colors

### Neutral
- **text** (#e8e8ea): Off-white base text. Slightly warm, reduces glare compared to pure white
- **subtle** (#1a1a1f): Very dark background for secondary elements
- **hover** (#252530): Slightly lighter for interactive states

### Status Colors
These use soft pastels instead of bright primaries:

- **success** (#8dd7b8): Soft mint green — calm confirmation
- **error** (#d89b9b): Soft rose red — gentle error indication
- **warning** (#dcc89d): Soft warm sand — muted caution
- **info** (#a8c7e8): Soft sky blue — secondary information

### Accents
- **accent** (#b8a8d8): Soft lavender for highlights
- **prompt** (#a8d7e8): Soft cyan for the prompt prefix

## Todo Priority Colors (A-Z)

Each priority level gets its own pastel shade:

| Priority | Color | Hex |
|----------|-------|-----|
| A | Soft Red | #d89b9b |
| B | Soft Yellow | #dcc89d |
| C | Soft Mint | #8dd7b8 |
| D | Soft Emerald | #8dd7b0 |
| E | Soft Teal | #8dd7d0 |
| F | Soft Cyan | #a8d7e8 |
| G | Soft Sky | #b0c7e8 |
| H | Soft Blue | #b8c0e8 |
| I | Soft Indigo | #c0b8e8 |
| J | Soft Violet | #c8b0e8 |
| K | Soft Purple | #d0a8e8 |
| L | Soft Fuchsia | #d8a0d8 |
| M | Soft Pink | #d8a8c8 |
| N | Soft Rose | #d8a8b8 |
| O | Soft Orange | #d8b8a0 |
| P | Soft Amber | #dcc89d |
| Q | Soft Lime | #c8d89d |
| R | Soft Red-3 | #d8a8a0 |
| S | Soft Orange-3 | #dcc0a0 |
| T | Soft Yellow-3 | #dcd0a0 |
| U | Soft Green-3 | #c0d0a0 |
| V | Soft Teal-3 | #a8d0c0 |
| W | Soft Blue-3 | #a8c0d8 |
| X | Soft Violet-3 | #c0a8d8 |
| Y | Soft Pink-3 | #d0a8c0 |
| Z | Soft Zinc | #b0b0b8 |

## Implementation

Colors are defined in `tailwind.config.js` under the `terminal` namespace and used via Tailwind classes like `text-terminal-success`, `text-terminal-prioA`, etc.

### Usage Examples

```tsx
// Status responses
<span className="text-terminal-success">✓ Task completed</span>
<span className="text-terminal-error">✗ Error occurred</span>
<span className="text-terminal-warning">~ Warning</span>

// Todo priorities
<span className="text-terminal-prioA">(A)</span>
<span className="text-terminal-prioB">(B)</span>

// Prompt
<span className="text-terminal-prompt">~$</span>
```

## Why Pastels Instead of High Contrast?

1. **Calm tone** — Pastel colors feel less aggressive and more approachable
2. **Expressive** — Each color maintains its semantic meaning while being softer
3. **Less eye strain** — Desaturated colors are gentler for extended terminal use
4. **Visual harmony** — All colors share similar saturation and brightness, creating cohesion
5. **Distinction without intensity** — Colors remain distinct but don't compete for attention
