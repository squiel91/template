# Tiendu CLI

The Tiendu CLI (`tiendu`) is used to develop, preview, and publish storefront themes.

## Installation

```bash
npm install -g tiendu
```

Or run without installing:

```bash
npx tiendu <command>
```

Requires Node.js >= 20.

## Getting started

```bash
# Initialize in the current directory — connects to your store
tiendu init

# Download the live theme files
tiendu pull
```

`tiendu init` prompts for:
1. API key (from the Tiendu admin)
2. API base URL (defaults to `https://tiendu.uy`)
3. Store selection (if the API key has access to multiple stores)

Config is saved in `.cli/config.json` and credentials in `.cli/credentials.json`. Add `.cli/` to `.gitignore` — it contains the API key.

## Development

```bash
tiendu dev
```

This starts a file watcher that syncs changes to a remote preview. On first run it creates a preview and uploads all files. After that, it watches for file changes and uploads them individually.

The CLI prints a **preview URL** when it starts. Open that URL to see the live preview. After saving a file locally, **wait a few seconds** for the upload to complete before refreshing — the CLI logs `↑ filename` when each file is uploaded.

Press `Ctrl+C` to stop the watcher.

### What happens during `tiendu dev`

- File saves → multipart upload to the preview (300ms debounce)
- File deletes → remote file deletion
- Dotfiles (`.cli/`, `.git/`, etc.) are ignored
- The preview URL is shareable and uses the same Liquid engine as production
- Analytics are disabled on previews (no test traffic pollution)
- Cart and checkout work normally (real orders)

## Preview management

```bash
tiendu preview create [name]   # Create a new preview
tiendu preview list             # List active previews
tiendu preview delete           # Delete the active preview
tiendu preview open             # Open preview URL in browser
```

## Publishing

```bash
tiendu publish
```

Promotes the active preview to the live theme. After publishing, the preview is removed and the config is cleaned up.

## Full sync

```bash
tiendu push
```

Zips all local files (excluding dotfiles) and uploads them to the active preview, replacing its content entirely. Useful if the preview has drifted from the local state.

## Typical workflow

```bash
tiendu init              # One-time setup
tiendu pull              # Download the live theme
tiendu dev               # Start developing with live preview
# ... edit templates, CSS, JS ...
tiendu publish           # Push to production
```
