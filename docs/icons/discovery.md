# Icon discovery and generation

## Local snippets already available

List them with:

```bash
node storefronts/30/scripts/discover-icons.mjs local
```

## Search remote libraries

Lucide:

```bash
node storefronts/30/scripts/discover-icons.mjs search lucide arrow
```

Heroicons:

```bash
node storefronts/30/scripts/discover-icons.mjs search heroicons user
```

## Explore tags / variants

```bash
node storefronts/30/scripts/discover-icons.mjs tags lucide
node storefronts/30/scripts/discover-icons.mjs variants heroicons
```

## Add new icons

Lucide:

```bash
npx @ckreidl/sis add lucide search x arrow-right -d storefronts/30/snippets -p icon- -f
```

Heroicons example:

```bash
npx @ckreidl/sis add heroicons:24/outline user magnifying-glass -d storefronts/30/snippets -p icon- -f
```

## Caveats

- Be explicit about the Heroicons variant (`20/solid`, `24/outline`, etc.).
- After adding icons, use the generated partials directly in Liquid.
