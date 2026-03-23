# Icon Snippets Skill

Use `@ckreidl/sis` (icon snippet generator) for all icon work.

## Goal

- Prefer snippet-rendered icons over runtime icon libraries.
- Keep icon snippets in `snippets`.
- Use the library for both Lucide and Heroicons discovery.

## Current setup

- Snippet directory: `snippets`
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
npx @ckreidl/sis add lucide search x arrow-right -d snippets -p icon- -f
```

## Add new Heroicons snippets

Pick a variant first:

```bash
npx @ckreidl/sis variants heroicons
```

Then add icons:

```bash
npx @ckreidl/sis add heroicons:24/outline user magnifying-glass -d snippets -p icon- -f
```

## Discover available icons

Use the helper script:

```bash
node scripts/discover-icons.mjs local
node scripts/discover-icons.mjs search lucide arrow
node scripts/discover-icons.mjs search heroicons user
node scripts/discover-icons.mjs tags lucide
node scripts/discover-icons.mjs variants heroicons
```

## Rules

- Do not add `data-lucide` placeholders.
- Do not load Lucide in the browser just to replace placeholders.
- Prefer `{% render 'icon-*' %}` in Liquid templates.
- If JS must swap icons at runtime, pre-render the needed icon snippets in the DOM and toggle them.
- Keep icon sizing in CSS or `size:` args, not ad-hoc inline SVG markup.
