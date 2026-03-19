# Storefront 30

This storefront is a server-rendered Liquid theme built on Tiendu, a multi-tenant online store manager. It follows a Shopify-like directory convention. Most interactive behavior is progressively enhanced with plain JS after the HTML is already rendered.

## How to work on it

- Start with `docs/theme.md` for the theme system, route map, injected globals, and page-by-page context references.
- Start with `docs/icons.md` for the icon system, snippet usage, discovery commands, and how to add new Lucide/Heroicons snippets.
- Prefer editing Liquid templates, snippets, and asset files (CSS/JS in `assets/`).
- Only change the Liquid resolver in `src/lib/server/liquid-storefront-handler/` if the template truly needs new server context.
- Keep SSR-first behavior. JS should enhance the rendered HTML, not replace major content.

## Directory structure (Shopify-like)

```
storefronts/30/
  assets/          — All browser-served CSS, JS, images, fonts, icons
  layout/          — Liquid layout shells (e.g. theme.liquid)
  templates/       — Page templates (index, products, product, etc.)
  snippets/        — Reusable Liquid snippets and icon partials
  docs/            — Implementation notes for agents and maintainers
  scripts/         — Build/dev scripts (not served to browser)
  skills/          — Agent skill definitions
  tiendu-sdk.js    — Typed storefront SDK surface
```

### `assets/`

All browser-served static files live here. This is the only folder served under the `/assets/` URL path.

- CSS: `theme.css`, `buttons.css`, `toast.css`, `listing.css`, `gallery.css`, `product-page.css`, `header-search.css`, component CSS (`product-item.css`, `category-item.css`, `breadcrumbs.css`, `rating-stars.css`, `blog-card.css`)
- JS: `layout.js` (main layout script), `search.js`, `product-page.js`, `gallery.js`, `helpers.js`, `listing-quick-add.js`, `tiendu-client.js`, `storefront-config.js`, `toast.js`, `product-pricing.js`, `infinite-scroll.js`, `content-blocks.js`, `css-color.js`, `navigation-origin.js`, `sanitize.js`, `tracking.js`, `url-safe.js`
- Images: `favicon.svg`, `no-image.svg`, `whatsapp-logo.svg`, `social-share-default.svg`, `payment-methods/*.svg`

### `layout/`

Contains the main Liquid layout shell (`theme.liquid`). This wraps all page templates.

### `templates/`

Page templates rendered per route: `index.liquid`, `products.liquid`, `product.liquid`, `categories.liquid`, `page.liquid`, `blog.liquid`, `blog-post.liquid`. Also contains `fragments/products.liquid` for partial HTML responses.

### `snippets/`

Reusable Liquid snippets: component partials (`product-item.liquid`, `category-item.liquid`, `blog-card.liquid`, `breadcrumbs.liquid`, `rating-stars.liquid`, `product-gallery.liquid`, `header-search.liquid`, `seo-head.liquid`) and icon snippets (`icon-*.liquid`).

## Referencing assets in templates

Use the `asset_url` Liquid filter for all static files:

```liquid
{{ 'theme.css' | asset_url | stylesheet_tag }}
{{ 'layout.js' | asset_url | script_tag }}
<img src="{{ 'favicon.svg' | asset_url }}" />
```

`asset_url` outputs `/assets/<filename>`. Nested paths are supported: `{{ 'payment-methods/visa.svg' | asset_url }}` outputs `/assets/payment-methods/visa.svg`.

Do NOT hardcode `/assets/...` paths in templates. Always use `asset_url` so cache-busting versioning can be applied centrally.

## JS module imports

All JS files live in `assets/`. Imports use absolute paths:

```js
import { tiendu } from '/assets/tiendu-client.js'
import { showErrorToast } from '/assets/toast.js'
```

The only exception is the root-level file that stays outside `assets/`:
- `/tiendu-sdk.js` — the SDK factory

Runtime storefront config is injected from `layout/theme.liquid` through window globals:

- `window.__TIENDU_STORE_ID__`
- `window.__TIENDU_BASE_URL__`

## Core references

- Theme system: `docs/theme.md`
- Icons: `docs/icons.md`
- Storefront SDK: `tiendu-sdk.js`

## Important conventions

- Product/category/blog/page content is SSR in Liquid.
- Cart, search suggestions, variant selection, gallery behavior, and similar UI are hydrated with plain JS.
- For async storefront data/actions in the browser, use the Tiendu SDK instead of ad-hoc fetch calls. The main client entrypoint is `assets/tiendu-client.js`, and the typed SDK reference lives in `tiendu-sdk.js`.
- Icons are snippet-rendered; do not reintroduce runtime Lucide replacement.
- SEO metadata is centralized in `snippets/seo-head.liquid` and rendered from `layout/theme.liquid`.
- All static files (CSS, JS, images, fonts) belong in `assets/`. Do not create `shared/`, `public/`, or route-scoped asset directories.
