# Agentation Setup

Agentation is installed and configured in this project.

## Development Setup

### 1. Start the MCP Server (in a separate terminal)

```bash
npx agentation-mcp server
```

The server will run on `http://localhost:4747` by default.

### 2. Start the dev server

```bash
npm run dev
# or
pnpm dev
```

The Agentation component will appear in the bottom-right corner of the dev app (only in development mode).

## How It Works

- The `Agentation` component is added to `src/App.tsx` and only loads when `NODE_ENV === "development"`
- It connects to the MCP server at `http://localhost:4747`
- Annotations are stored locally and synced to the server when available
- The server enables AI agents (like Amp) to read and manage annotations in real-time

## Key Files

- `src/App.tsx` - Agentation component integrated here
- `package.json` - `agentation` added as dev dependency

## Verify Setup

To verify the MCP server is running and configured correctly:

```bash
npx agentation-mcp doctor
```

This will check the connection and configuration status.
