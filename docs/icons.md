# Icons docs

Storefront 30 uses snippet-rendered icons generated with `shopify-icon-snippets`.

## Start here

- Usage rules: `icons/usage.md`
- Discovery commands: `icons/discovery.md`

## Current conventions

- Snippets live in `snippets/`
- The prefix is `icon-`
- Use `{% render 'icon-name' %}` in Liquid
- Do not reintroduce `data-lucide` placeholders or runtime icon replacement
- If JS needs to change an icon, pre-render the possible icons in the DOM and toggle them with `hidden`

## Related files

- Skill: `skills/icon-snippets/SKILL.md`
- Discovery helper: `scripts/discover-icons.mjs`

## Caveats

- Most current icons are Lucide snippets.
- Heroicons can also be added, but choose the variant explicitly when generating them.
