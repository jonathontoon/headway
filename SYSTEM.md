# Design System & Terminal Response Rules

This document defines the complete design system, component patterns, styling conventions, and color rationale for this React + Tailwind project. All prompt responses must follow these rules to maintain visual consistency, behavior, and semantic meaning.

---

## Project Foundation

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4 (utility-first)
- **Components**: Located in `src/components`
- **Font**: Departure Mono monospace (custom font-face in global.css)
- **Theme**: Dark mode (background: #09090b, text: white)

---

## Component Organization

### IMPORTANT: Component Location
- All UI components MUST be placed in `src/components/`
- Export all components from `src/components/index.ts`
- Use PascalCase for component filenames (e.g., `Response.tsx`, `DefaultResponse.tsx`)

### Component Structure
```typescript
import { FunctionComponent, PropsWithChildren } from "react";

interface ComponentProps {
  className?: string; // Always accept className for composition
  // ... other props
}

const ComponentName: FunctionComponent<PropsWithChildren<ComponentProps>> = ({
  className = "",
  children,
}) => (
  // Component JSX
);

export default ComponentName;
```

### Key Rules
- All components MUST accept optional `className` prop for flexible composition
- Use `FunctionComponent` from React with proper TypeScript types
- Destructure with default empty string for className: `className = ""`
- Trim className strings: `.trim()` to remove trailing spaces
- Use `memo()` for components that don't need frequent re-renders

---

## Color System Philosophy

**Less is More**: The color palette is intentionally restrained. Most content is white or grayscale. Colors are reserved for:
- **Status indicators** (success, error, warning)
- **Task priority levels** (urgency)
- **Interactive elements** (tags, mentions, contexts)
- **Semantic meaning** (informational vs background information)

This approach maintains readability, reduces cognitive load, and keeps the focus on content rather than decoration.

---

## Color Palette & Usage

### Neutral Colors (Grayscale)

| Color | Tailwind Class | Usage | Context |
|-------|---|---|---|
| White | `text-white` | Primary content, main text | Response body, task text, labels |
| Light Gray | `text-gray-100` | Active/important items | Uncompleted todo items |
| Gray 400 | `text-gray-400` | Section headers, command syntax | Help responses, label text |
| Gray 500 | `text-gray-500` | Secondary information | Hints, muted context, tags, dates |
| Gray 600 | `text-gray-600` | De-emphasized content | Completed tasks, archived items |

### Semantic Colors

| Color | Tailwind Class | Meaning | Usage |
|-------|---|---|---|
| Green | `text-green-500` | Success, completion | Status success, low priority (C) |
| Red | `text-red-500` | Error, failure, urgent | Status error, critical priority (A) |
| Amber | `text-amber-500` | Warning, in-progress | Status loading/waiting, medium priority (B) |
| Cyan | `text-cyan-400` | @ mentions (context) | Task contexts (@home, @work) |
| Blue | `text-blue-400` | + projects (scope) | Task projects (+groceries, +garden) |

### Contrast & Accessibility

All colors meet WCAG AA standards:
- White (#FFFFFF) on dark: 20:1+ (AAA)
- Gray-100 (#F3F4F6) on dark: 18:1+ (AAA)
- Gray-400 (#9CA3AF) on dark: 9:1+ (AA)
- Green-500 (#10B981) on dark: 12:1+ (AAA)
- Red-500 (#EF4444) on dark: 8:1+ (AA)
- Cyan-400 (#22D3EE) on dark: 14:1+ (AAA)
- Blue-400 (#60A5FA) on dark: 10:1+ (AA)

---

## Styling with Tailwind

### IMPORTANT: Tailwind Usage Rules

1. **Use Tailwind utility classes exclusively** - Never use inline `style` attributes or CSS modules for component styling
2. **Typography**: `text-[15px]` for base response text, adjust sizes with scale (sm, base, lg, xl)
3. **Colors**: Use Tailwind color palette (`white`, `gray-*`, `red-*`, `green-*`, etc.) - no hardcoded hex values
4. **Spacing**: Use Tailwind spacing scale (`p-2`, `py-2`, `gap-2`, etc.)
5. **Line height**: Use `leading-*` classes (`leading-normal`, `leading-relaxed`)
6. **Tracking**: Use `tracking-*` for letter spacing (`tracking-tight`, `tracking-normal`)

### Common Tailwind Classes for Responses

**Text Styling:**
```
text-[15px]        - Base response text size
leading-normal     - Standard line height
tracking-tight     - Compressed letter spacing
text-white         - Primary text color
text-gray-400      - Section headers/labels
text-gray-500      - Hints and secondary info
text-gray-600      - Completed/archived items
```

**Spacing:**
```
py-2               - Vertical padding (response container)
gap-1              - Tight spacing between elements (4px)
gap-2              - Standard spacing (8px, most common)
gap-3              - Loose spacing (12px)
gap-4              - Large gaps between sections (16px)
```

**Layout:**
```
grid grid-cols-1 md:grid-cols-[200px_1fr]  - Responsive grid (help layout)
flex flex-col                               - Vertical flex container
line-through                                - Text decoration (completed items)
```

### Responsive Design
- Use Tailwind's responsive prefixes: `md:`, `lg:`, `sm:`
- Example: `grid-cols-1 md:grid-cols-[200px_1fr]` (stacked on mobile, side-by-side on medium+)

---

## Response Component Hierarchy

### Response Container (`Response.tsx`)
```tsx
<Response className="optional-extra-classes">
  <Text>{content}</Text>
  <Hint>{hint}</Hint>
</Response>
```
- Base response wrapper with `text-[15px] leading-normal tracking-tight text-white py-2`
- Accepts className for extensions
- Must wrap all response content

### Typography Components

**Text** (`Text.tsx`)
- Simple paragraph wrapper, `text-white` by default
- Accepts className for custom styling
- Usage: `<Text className="text-gray-400">{content}</Text>`

**Label** (`Label.tsx`)
- Styled label text, `text-gray-400` by default
- Used for headings in help/status responses
- Section indicators and command syntax

**Hint** (`Hint.tsx`)
- Secondary information, `text-gray-500` by default
- Used for helpful suggestions or next steps
- De-emphasized guidance text

**Muted** (`Muted.tsx`)
- Dimmed text, `text-gray-500` by default
- Used for descriptions, dates, and tertiary info
- Line numbers and counts

### Layout Components

**Stack** (`Stack.tsx`)
- Vertical flex container with gap control
- Props: `gap` (number, maps to Tailwind scale)
- Usage: `<Stack gap={2}><Item /><Item /></Stack>`

**ScrollView** (`ScrollView.tsx`)
- Scrollable container for lists/histories
- Maintains overflow behavior
- Used for terminal history and long lists

---

## Response Type Patterns & Color Usage

### DefaultResponse
For simple text responses with optional hint:
```tsx
<DefaultResponse 
  responseText="3 tasks added."
  hintText="Type 'list' to view your tasks."
/>
```
- **Body**: `text-white` - Direct command output
- **Hint**: `text-gray-500` - Helpful suggestion or next step

**Composes**: Response → Text + Hint  
**Optimization**: Uses `memo()`

---

### HelpResponse
For command help/documentation:
```tsx
<Response>
  <Stack gap={2}>
    <Label>[command] [...arguments]</Label>
    <Stack>
      {items.map(item => (
        <p key={item.id} className="grid grid-cols-1 md:grid-cols-[200px_1fr] md:gap-4">
          <span>{item.usage}</span>
          <Muted>{item.description}</Muted>
        </p>
      ))}
    </Stack>
  </Stack>
</Response>
```
**Colors:**
- **Header**: `text-gray-400` - Section label
- **Command names**: `text-white` - Primary reference
- **Descriptions**: `text-gray-500` - Secondary explanation

**Pattern**: Responsive grid (stacked mobile, 200px/1fr on medium+)

---

### StatusResponse
For status/progress displays:
```tsx
<StatusResponse
  statusType="success"
  statusText="Task completed."
  hintText="Type 'list' to see updates."
/>
```

#### Success Status
- **Symbol**: `[√]` in `text-green-500`
- **Message**: `text-white`
- **Hint**: `text-gray-500`
- **Rationale**: Green signals "goal achieved" - familiar from traffic lights

#### Error Status
- **Symbol**: `[×]` in `text-red-500`
- **Message**: `text-white`
- **Hint**: `text-gray-500`
- **Rationale**: Red signals "problem/danger" - universal stop symbol

#### Loading/Waiting Status
- **Symbol**: `[~]` in `text-amber-500`
- **Message**: `text-white`
- **Hint**: `text-gray-500`
- **Rationale**: Amber signals "wait/processing" - familiar from loading states

**Pattern**: Compact status items with `gap-1`

---

### TodoListResponse
For task lists:
```tsx
<Response>
  <Stack gap={2}>
    {items.map((item, i) => <TodoLine key={item.id} num={i + 1} item={item} />)}
  </Stack>
</Response>
```

#### Uncompleted Task Colors
```
1. (A) Buy groceries @home
└─ Line#: text-gray-500
   Priority (A): text-red-500
   Task text: text-gray-100
   @context: text-cyan-400
   +project: text-blue-400
```

**Priority colors** (traffic light semantics):
- `(A)` Critical: `text-red-500` - Stop, immediate attention
- `(B)` High: `text-yellow-500` - Caution, soon but not now
- `(C)` Normal: `text-green-500` - Go, standard priority
- None: `text-gray-500` - Background/informational

**Tag colors**:
- `@contexts`: `text-cyan-400` - Easy to distinguish from projects
- `+projects`: `text-blue-400` - Easy to distinguish from contexts

#### Completed Task Colors
```
2. Buy milk @store                [text-gray-600 line-through]
└─ All text gray with strikethrough
   Priority/tags: hidden
```

**Pattern**: Reduces visual noise while keeping readable

---

### TagListResponse
For tag/context display:
```tsx
<Response>
  <Stack gap={2}>
    <Label>Contexts:</Label>
    {tags.map(tag => (
      <p key={tag.name}>
        <span>{tag.name}</span>
        <Muted>({tag.count} tasks)</Muted>
      </p>
    ))}
  </Stack>
</Response>
```
- **Title**: `text-white` - Section label
- **Tag name**: `text-white` - Primary reference
- **Count**: `text-gray-500` - Supporting metric

---

### TerminalHistory
For scrollable command log:
```tsx
<ScrollView className="flex flex-col gap-2">
  {history.map((entry) => (
    <Response key={entry.id}>{entry.content}</Response>
  ))}
</ScrollView>
```
- **Prompt (>)**: `text-gray-400` - System UI indicator
- **Responses**: Follow their specific response type colors
- **Stacked vertically**: Consistent spacing

**Rationale**: Each response maintains its own color scheme. Prompt is gray to show it's system UI, not content.

---

## Visual Characteristics

- **Monospace**: All text uses Departure Mono font
- **Dark theme**: White text on #09090b background
- **Minimal decoration**: Clean, text-focused design
- **Terminal-like**: Mimics terminal output aesthetic
- **Readable spacing**: Generous padding and gaps for clarity

## Typography Hierarchy

1. **Primary text** - `text-white` `text-[15px]` - Main content
2. **Section headers** - `text-gray-400` - Labels, command syntax
3. **Secondary text** - `text-gray-500` - Hints, descriptions, dates
4. **De-emphasized** - `text-gray-600` - Completed items, archive state
5. **Status colors** - `text-red/green/amber-500` - Semantic meaning only

## Spacing System

- `gap-1` (4px) - Tight spacing between elements
- `gap-2` (8px) - Standard spacing (most common)
- `gap-3` (12px) - Loose spacing
- `gap-4` (16px) - Large gaps (between major sections)
- `py-2` (8px) - Vertical padding for response containers
- `p-2`, `p-4` - Padding for contained sections

## Behavior Standards

1. **Responsive**: Content adapts to viewport width (use `md:` prefix for changes)
2. **Composable**: Components accept className prop for customization
3. **Memoized**: Response components use `memo()` to prevent unnecessary re-renders
4. **Accessible**: Use semantic HTML (`<p>`, `<label>`, proper structure)
5. **Performant**: Components are lightweight, no unnecessary wrappers

---

## Tailwind Configuration

The project uses Tailwind CSS v4 with minimal custom configuration:

```typescript
// tailwind.config.ts
export default {
  content: [
    "./index.html",
    "./src/**/*.{tsx,ts,jsx,js}",
  ],
}
```

- Content paths automatically purge unused styles
- All CSS classes must be in source files (not generated strings)
- Uses Tailwind's default color palette and spacing scale
- No custom theme extensions needed

---

## Common Patterns & Examples

### Vertical Stack with Gap
```tsx
<Stack gap={2}>
  <Text>Item 1</Text>
  <Text>Item 2</Text>
  <Text>Item 3</Text>
</Stack>
```

### Responsive Grid (Help Layout)
```tsx
<p className="grid grid-cols-1 md:grid-cols-[200px_1fr] md:gap-4">
  <span>{command}</span>
  <Muted>{description}</Muted>
</p>
```

### Semantic Status with Colors
```tsx
<Status current="success">Task completed.</Status>
<!-- Renders: [√] in text-green-500 + message in text-white -->
```

### Priority-colored Todo Item
```tsx
<span className={PRIORITY_COLORS[priority] ?? "text-gray-500"}>
  ({priority})
</span>
<!-- (A) → text-red-500, (B) → text-yellow-500, (C) → text-green-500 -->
```

### Context/Project Tags
```tsx
<span className="text-cyan-400">@home</span>  {/* Context */}
<span className="text-blue-400">+groceries</span>  {/* Project */}
```

### Muted Text
```tsx
<Stack gap={1}>
  <Text>Primary content</Text>
  <Muted>Secondary explanation</Muted>
</Stack>
```

### Conditional Hint
```tsx
<Response>
  <Text>{responseText}</Text>
  {hintText && <Hint>{hintText}</Hint>}
</Response>
```

### Scrollable List
```tsx
<ScrollView className="flex flex-col gap-2">
  {items.map(item => (
    <Response key={item.id}>
      <Text>{item.content}</Text>
    </Response>
  ))}
</ScrollView>
```

---

## Color Usage Guidelines

### Always use `text-white` for:
- Main command output
- Task text content
- Primary information
- Command names in help
- Tag names in lists
- Success/status messages

### Always use `text-gray-400` for:
- Section headers
- Command syntax in help
- Prompt indicators (>)
- System labels

### Always use `text-gray-500` for:
- Hints and suggestions
- Line numbers in lists
- Dates in task text
- Task counts in tag lists
- De-emphasized context

### Always use `text-gray-600` for:
- Completed/archived tasks
- Historical/past information
- Deeply de-emphasized content

### Always use semantic status colors for:
- `text-green-500` → Success states, low priority (C)
- `text-red-500` → Error states, critical priority (A)
- `text-amber-500` → Loading/waiting states, medium priority (B)
- `text-cyan-400` → @ contexts in tasks
- `text-blue-400` → + projects in tasks

### Color combinations to avoid:
- ✗ Red text on red background (no contrast)
- ✗ Multiple status colors in one response (conflicting signals)
- ✗ Rainbow gradient of colors (carnival effect)
- ✗ Gray-600 on dark background (low contrast, unreadable)

---

## DO's and DON'Ts

### DO
- ✓ Use Tailwind utility classes for all styling
- ✓ Accept and use the `className` prop in components
- ✓ Use semantic HTML elements (`<p>`, `<label>`, `<div>` appropriately)
- ✓ Group related content with `<Stack>` component
- ✓ Use grayscale for content hierarchy
- ✓ Use semantic colors only for status/priority/tags
- ✓ Use responsive prefixes: `md:`, `lg:`, `sm:`
- ✓ Memoize response components to prevent re-renders
- ✓ Trim className strings with `.trim()` to remove trailing spaces
- ✓ Use `PropsWithChildren` for components that accept children
- ✓ Export all components from `src/components/index.ts`
- ✓ Verify contrast meets WCAG AA minimum

### DON'T
- ✗ Don't hardcode colors (use Tailwind color names)
- ✗ Don't use inline `style` attributes
- ✗ Don't create CSS modules or separate stylesheets
- ✗ Don't forget the `className = ""` default
- ✗ Don't use HTML elements without semantic meaning
- ✗ Don't skip component export in index.ts
- ✗ Don't hardcode spacing values (use Tailwind scale)
- ✗ Don't forget to accept `className` prop for composition
- ✗ Don't forget `trim()` when concatenating classNames
- ✗ Don't create utility functions; use Tailwind classes directly
- ✗ Don't use status colors for non-semantic content
- ✗ Don't mix multiple status colors in one response

---

## Implementation Checklist for New Components

When creating a new response component, verify:

- [ ] Component is in `src/components/ComponentName.tsx`
- [ ] Component is exported from `src/components/index.ts`
- [ ] Uses TypeScript with `FunctionComponent` type
- [ ] Accepts `className?: string` prop
- [ ] Uses `className = ""` default
- [ ] All styling uses Tailwind utility classes
- [ ] Strings are trimmed: `className...".trim()`
- [ ] Uses semantic HTML elements
- [ ] Contains JSDoc comment if complex
- [ ] Follows naming: PascalCase for components
- [ ] Memoized if it's a response type (using `memo()`)
- [ ] All colors from Tailwind palette
- [ ] All spacing from Tailwind scale
- [ ] Responsive prefixes for breakpoints
- [ ] No hardcoded hex colors or inline styles
- [ ] Color hierarchy follows grayscale → semantic pattern
- [ ] Status colors only used for semantic meaning
- [ ] Contrast meets WCAG AA minimum

---

## Testing Checklist

When implementing new response types:

- [ ] Main content is `text-white` (high contrast)
- [ ] Secondary info is `text-gray-500` (visible but muted)
- [ ] Status indicators use semantic colors (green/red/amber)
- [ ] No hardcoded hex colors
- [ ] All colors from Tailwind palette
- [ ] Contrast meets WCAG AA minimum
- [ ] One dominant semantic color per response (if any)
- [ ] Completed/historical items use `text-gray-600`
- [ ] Context tags (@) use `text-cyan-400`
- [ ] Project tags (+) use `text-blue-400`
- [ ] Priority uses red (A), yellow (B), green (C)
- [ ] Spacing uses gap/padding scale consistently
- [ ] Responsive behavior works on mobile (md: prefixes)
