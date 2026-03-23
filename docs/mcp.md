# Tiendu MCP

The Tiendu MCP server gives AI agents access to store management tools — products, categories, pages, blog posts, images, orders, settings, and more. It runs as a remote HTTP MCP server at `/mcp` on the Tiendu app.

## Requirements

- The Tiendu app must be running (e.g. `pnpm dev` on the app, default `http://localhost:4000`)
- An API key (from the Tiendu admin panel)
- A store ID

## Required headers

| Header | Value |
|---|---|
| `Authorization` | `Bearer <API_KEY>` |
| `X-Store-Id` | `<STORE_ID>` |

The `storeId` is injected server-side from the header — tool calls should not include it in their input.

## Configuration by editor

Replace `YOUR_API_KEY` and `YOUR_STORE_ID` with your actual credentials. Replace `localhost:4000` with the production URL if not running locally.

### Claude Code

Add to `.mcp.json` in the project root (or `~/.claude/mcp.json` for global):

```json
{
  "mcpServers": {
    "tiendu": {
      "type": "url",
      "url": "http://localhost:4000/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY",
        "X-Store-Id": "YOUR_STORE_ID"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in the project root:

```json
{
  "mcpServers": {
    "tiendu": {
      "url": "http://localhost:4000/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY",
        "X-Store-Id": "YOUR_STORE_ID"
      }
    }
  }
}
```

### VS Code (Copilot)

Add to `.vscode/mcp.json` in the project root:

```json
{
  "servers": {
    "tiendu": {
      "type": "http",
      "url": "http://localhost:4000/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY",
        "X-Store-Id": "YOUR_STORE_ID"
      }
    }
  }
}
```

### Codex CLI

Add to `.codex/config.toml` in the project root:

```toml
[mcp_servers.tiendu]
url = "http://localhost:4000/mcp"
http_headers = { "Authorization" = "Bearer YOUR_API_KEY", "X-Store-Id" = "YOUR_STORE_ID" }
```

### OpenCode

Add to `~/.opencode/opencode.json` (or project-level `opencode.json`):

```json
{
  "mcp": {
    "tiendu": {
      "type": "remote",
      "url": "http://localhost:4000/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY",
        "X-Store-Id": "YOUR_STORE_ID"
      },
      "enabled": true
    }
  }
}
```

## What it provides

The MCP server exposes tRPC procedures that have `meta.mcp.enabled === true`. Tools are scoped to the store specified in the `X-Store-Id` header. Typical capabilities include:

- **Products** — list, view, create, update, delete
- **Categories** — list, view, create, update, delete
- **Pages** — list, view, create, update, delete
- **Blog posts** — list, view, create, update, delete
- **Images** — list, view, upload
- **Store settings** — view and update configuration
- **Orders** — list, view

Use the MCP `tools/list` call to see all available tools for the connected store.
