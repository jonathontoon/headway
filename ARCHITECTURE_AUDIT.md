# Architecture Audit: Folder Structure & Organization

## Current Structure

```
src/
├── actions/          (19 files) - Command handlers
├── components/       (13 files) - React components
├── context/          (1 file) - TerminalContext provider
├── hooks/            (1 file) - Custom React hooks
├── models/           (1 file) - Type definitions
├── reducers/         (1 file) - Old terminal reducer (can delete)
├── services/         (3 files) - Business logic
├── store/            (1 file) - Terminal state hook
├── styles/           (1 file) - Global CSS
├── types/            (1 file) - Consolidated types
├── utilities/        (3 files) - Helper functions
├── App.tsx           - Main app component
└── index.tsx         - Entry point
```

## Issues Identified

### 1. **Actions Folder Mixing Concerns** ⚠️

Currently: Each command is a separate file in `actions/`

```
actions/
├── add.ts
├── append.ts
├── delete.ts
├── ... (15 more)
├── registry.ts
└── withTodos.ts
```

**Problems:**

- No clear separation between command logic and command metadata
- `registry.ts` is a god file (exports all metadata + imports all commands)
- `withTodos.ts` is a utility disguised as an action
- Commands aren't grouped by semantic domain (core vs priority vs discovery)

### 2. **Services Folder Lacks Organization** ⚠️

Currently:

```
services/
├── storageService.ts
├── todoService.ts
└── __tests__/
```

**Problems:**

- No clear layer boundary (business logic vs infrastructure)
- Test directory inside services (unusual pattern)
- `storageService` is persistence, `todoService` is business logic (different concerns)

### 3. **Components Not Categorized** ⚠️

All 13 components in one folder:

```
components/
├── DefaultResponse.tsx
├── HelpResponse.tsx
├── Terminal.tsx          ← Root container
├── Response.tsx          ← Base wrapper
├── Status.tsx            ← Base primitive
├── TodoListResponse.tsx  ← Specific response type
├── renderResponse.tsx    ← Utility function
```

**Problems:**

- Base components mixed with feature components
- Response rendering utility is a component file
- No distinction between container vs presentational
- No folder structure for feature complexity

### 4. **Type Definitions Scattered** ⚠️

Types in multiple places:

- `types/terminal.ts` - Terminal state
- `models/terminalResponse.ts` - Response types
- `services/todoService.ts` - TodoItem interface
- Inline interfaces in action files

**Problems:**

- No single source of truth for app types
- Inconsistent naming (`models` vs `types`)
- Types colocated with logic

### 5. **Utilities Not Grouped** ⚠️

```
utilities/
├── parseArguments.ts
├── parseCommand.ts
└── pushResponses.ts
```

**Problems:**

- Parser utilities grouped with dispatch utilities
- No domain organization
- `pushResponses` is dispatch-specific, not a general utility

### 6. **Hooks Under-utilized** ⚠️

Currently:

```
hooks/
└── useViewportResize.ts
```

**Problems:**

- Only one hook in dedicated folder (should be colocated or integrated)
- No terminal-specific hooks extracted
- Logic lives in components, not reusable hooks

## Recommended Structure

### Simpler: Feature-based (Best for this app)

```
src/
├── features/
│   ├── terminal/
│   │   ├── store/
│   │   │   └── useTerminal.ts
│   │   ├── types.ts
│   │   ├── components/
│   │   │   ├── Terminal.tsx
│   │   │   ├── ScrollView.tsx
│   │   │   ├── Prompt.tsx
│   │   │   └── Response.tsx
│   │   ├── context.tsx
│   │   └── index.ts (public API)
│   │
│   ├── todos/
│   │   ├── models.ts
│   │   ├── todoService.ts
│   │   ├── commands/
│   │   │   ├── index.ts (registry)
│   │   │   ├── core/
│   │   │   │   ├── add.ts
│   │   │   │   ├── list.ts
│   │   │   │   └── delete.ts
│   │   │   ├── priority/
│   │   │   │   ├── pri.ts
│   │   │   │   └── depri.ts
│   │   │   ├── text/
│   │   │   │   ├── append.ts
│   │   │   │   └── prepend.ts
│   │   │   └── discovery/
│   │   │       ├── listpri.ts
│   │   │       ├── listcon.ts
│   │   │       └── listproj.ts
│   │   ├── responses/
│   │   │   ├── TodoListResponse.tsx
│   │   │   ├── TagListResponse.tsx
│   │   │   └── StatusResponse.tsx
│   │   └── index.ts (public API)
│   │
│   └── shared/
│       ├── types/
│       │   └── index.ts
│       ├── utils/
│       │   ├── parse/
│       │   │   ├── parseCommand.ts
│       │   │   └── parseArguments.ts
│       │   └── storage/
│       │       └── storageService.ts
│       └── components/
│           ├── Response.tsx
│           ├── Status.tsx
│           ├── Hint.tsx
│           └── Logo.tsx
│
├── styles/
│   └── global.css
├── App.tsx
└── index.tsx
```

### Alternative: Domain-based (For scaling)

If app grows beyond todo management:

```
src/
├── core/
│   ├── store/         (All global state)
│   ├── types/         (All type definitions)
│   └── utils/         (Core utilities)
├── domains/
│   ├── terminal/      (Terminal UI)
│   ├── todos/         (Todo business logic)
│   └── settings/      (Settings if added)
└── shared/
    ├── components/    (Reusable UI components)
    └── hooks/         (Reusable React hooks)
```

## Recommended Changes (Simplest Path)

### Phase 1: Organize Commands (Low risk)

```
actions/
├── index.ts           ← New: Re-export all
├── core/
│   ├── add.ts
│   ├── list.ts
│   ├── delete.ts
│   └── done.ts
├── priority/
│   ├── pri.ts
│   ├── depri.ts
│   └── listpri.ts
├── text/
│   ├── append.ts
│   ├── prepend.ts
│   ├── replace.ts
│   └── archive.ts
├── discovery/
│   ├── listcon.ts
│   └── listproj.ts
├── maintenance/
│   ├── clear.ts
│   ├── help.ts
│   └── default.ts
├── registry.ts        ← Move metadata here
└── withTodos.ts       ← Move to utils/
```

### Phase 2: Consolidate Types

```
types/
├── terminal.ts
├── terminal-response.ts  ← Rename from models/
├── todo.ts             ← Extract from services
├── command.ts          ← Extract from registry
└── index.ts            ← Aggregate all
```

### Phase 3: Organize Components

```
components/
├── Terminal/           ← Terminal container
│   ├── Terminal.tsx
│   ├── Terminal.module.css
│   └── index.ts
├── base/               ← Primitives
│   ├── Response.tsx
│   ├── Prompt.tsx
│   ├── Hint.tsx
│   ├── Status.tsx
│   └── ScrollView.tsx
├── responses/          ← Response types
│   ├── TodoListResponse.tsx
│   ├── TagListResponse.tsx
│   ├── StatusResponse.tsx
│   ├── HelpResponse.tsx
│   ├── IntroResponse.tsx
│   ├── LogoResponse.tsx
│   └── DefaultResponse.tsx
├── renderResponse.tsx  ← Move to utils
└── index.ts           ← Public API
```

### Phase 4: Clean Up Services

```
services/
├── todos.ts           ← Core business logic
└── persistence/
    └── storage.ts     ← Infrastructure
```

## Priorities

**High Priority (Do first):**

1. Consolidate all types into `types/` folder with clear names
2. Add `index.ts` files as public APIs for each folder
3. Reorganize `actions/` by command domain
4. Separate `services/` into business logic vs infrastructure

**Medium Priority:**

1. Create component subfolders (base, responses)
2. Move render utilities to utils folder
3. Add barrel exports for each feature

**Low Priority (Can wait):**

1. Extract more custom hooks
2. Add component-specific CSS modules
3. Create feature-level type files

## File Structure Benefits

### Current Problems Solved

✅ Commands organized by domain (easier to find related commands)
✅ Clear separation between UI, business logic, infrastructure
✅ Types colocated logically (shared types, feature types)
✅ Components clearly distinguished (base, container, feature)
✅ Public APIs via `index.ts` files (easier refactoring)
✅ Utilities organized by domain (parsing, storage, etc.)

### Scalability

✅ Easy to add new command domains
✅ Easy to add new response types
✅ Easy to extract new features without restructuring
✅ Clear boundaries between features

## Migration Path (Minimal disruption)

1. **Week 1:** Create new folder structure (empty)
2. **Week 2:** Move actions into organized folders, update imports
3. **Week 3:** Consolidate types, update imports
4. **Week 4:** Reorganize components, add index files
5. **Week 5:** Clean up services, test everything

Can be done incrementally with each PR.

## Files to Delete

- `src/reducers/terminalReducer.ts` - Moved to store/useTerminal.ts

## Files to Create

- Multiple `index.ts` for public APIs
- New subfolders as outlined

## Import Impact

- Will require updating path imports
- Can use TypeScript path aliases to minimize changes
- Consider using barrel exports to reduce import depth
