# Storefront 30 Icon Snippets Skill

Use `shopify-icon-snippets` for all icon work in `storefronts/30`.

## Goal

- Prefer snippet-rendered icons over runtime icon libraries.
- Keep icon snippets in `storefronts/30/snippets`.
- Use the library for both Lucide and Heroicons discovery.

## Current setup

- Snippet directory: `storefronts/30/snippets`
- Prefix: `icon-`
- Example usage in Liquid:

```liquid
{% render 'icon-search' %}
{% render 'icon-search', size: 18 %}
{% render 'icon-search', class: 'custom-class' %}
{% render 'icon-search', stroke_width: 1.5 %}
```

## Add new Lucide icons

```bash
npx @ckreidl/sis add lucide search x arrow-right -d storefronts/30/snippets -p icon- -f
```

## Add new Heroicons snippets

Pick a variant first:

```bash
npx @ckreidl/sis variants heroicons
```

Then add icons:

```bash
npx @ckreidl/sis add heroicons:24/outline user magnifying-glass -d storefronts/30/snippets -p icon- -f
```

## Discover available icons

Use the helper script:

```bash
node storefronts/30/scripts/discover-icons.mjs local
node storefronts/30/scripts/discover-icons.mjs search lucide arrow
node storefronts/30/scripts/discover-icons.mjs search heroicons user
node storefronts/30/scripts/discover-icons.mjs tags lucide
node storefronts/30/scripts/discover-icons.mjs variants heroicons
```

## Rules for storefront 30

- Do not add `data-lucide` placeholders.
- Do not load Lucide in the browser just to replace placeholders.
- Prefer `{% render 'icon-*' %}` in Liquid templates.
- If JS must swap icons at runtime, pre-render the needed icon snippets in the DOM and toggle them.
- Keep icon sizing in CSS or `size:` args, not ad-hoc inline SVG markup.
