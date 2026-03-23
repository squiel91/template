# Icon discovery and generation

## Local snippets already available

List them with:

```bash
node scripts/discover-icons.mjs local
```

## Search remote libraries

Lucide:

```bash
node scripts/discover-icons.mjs search lucide arrow
```

Heroicons:

```bash
node scripts/discover-icons.mjs search heroicons user
```

## Explore tags / variants

```bash
node scripts/discover-icons.mjs tags lucide
node scripts/discover-icons.mjs variants heroicons
```

## Add new icons

Lucide:

```bash
npx @ckreidl/sis add lucide search x arrow-right -d snippets -p icon- -f
```

Heroicons example:

```bash
npx @ckreidl/sis add heroicons:24/outline user magnifying-glass -d snippets -p icon- -f
```

## Caveats

- Be explicit about the Heroicons variant (`20/solid`, `24/outline`, etc.).
- After adding icons, use the generated partials directly in Liquid.
