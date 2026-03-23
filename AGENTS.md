# Storefront theme

This is a server-rendered Liquid theme built on Tiendu, a multi-tenant online store platform. It follows a standard theme directory convention. Most interactive behavior is progressively enhanced with plain JS after the Liquid is already rendered in the server.

## How to work on it

- Start with `docs/theme.md` for the theme system, route map, injected globals, and page-by-page context references.
- Start with `docs/icons.md` for the icon system, snippet usage, discovery commands, and how to add new Lucide/Heroicons snippets.
- Prefer editing Liquid templates, snippets, and asset files (CSS/JS in `assets/`).

## Directory structure

```
assets/          — All browser-served CSS, JS, images, fonts, icons, including `tiendu-sdk.js`
layout/          — Liquid layout shells (e.g. theme.liquid)
templates/       — Page templates (index, collection, product, search, etc.)
snippets/        — Reusable Liquid snippets and icon partials
docs/            — Implementation notes for agents and maintainers
scripts/         — Build/dev scripts (not served to browser)
skills/          — Agent skill definitions
```

### `assets/`

All browser-served static files live here. This is the only folder served under the `/assets/` URL path.

- CSS: `theme.css`, `buttons.css`, `toast.css`, `listing.css`, `gallery.css`, `product-page.css`, `header-search.css`, component CSS (`product-item.css`, `category-item.css`, `breadcrumbs.css`, `rating-stars.css`, `blog-card.css`)
- JS: `layout.js` (main layout script), `search.js`, `product-page.js`, `gallery.js`, `helpers.js`, `listing-quick-add.js`, `tiendu-sdk.js`, `toast.js`, `product-pricing.js`, `infinite-scroll.js`, `content-blocks.js`, `css-color.js`, `navigation-origin.js`, `sanitize.js`, `tracking.js`, `url-safe.js`
- Images: `favicon.svg`, `no-image.svg`, `whatsapp-logo.svg`, `social-share-default.svg`, `payment-methods/*.svg`

### `layout/`

Contains the main Liquid layout shell (`theme.liquid`). This wraps all page templates.

### `templates/`

Page templates rendered per route: `index.liquid`, `collection.liquid`, `product.liquid`, `list-collections.liquid`, `search.liquid`, `page.liquid`, `blog.liquid`, `article.liquid`, `404.liquid`. Also contains `fragments/products.liquid` for partial HTML responses. Alternate templates use dot-suffix naming (e.g. `product.gift-guide.liquid`); see `docs/template-selection.md`.

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
import { Tiendu } from '/assets/tiendu-sdk.js'
import { showErrorToast } from '/assets/toast.js'

const tiendu = Tiendu()
```

No runtime window globals are needed. The SDK resolves the store from the request host automatically.

## Core references

- Theme system: `docs/theme.md`
- Template selection (alternate templates): `docs/template-selection.md`
- Icons: `docs/icons.md`
- CLI: `docs/cli.md`
- MCP server: `docs/mcp.md`
- Storefront SDK: `assets/tiendu-sdk.js`

## Checkout architecture (same-origin)

The checkout loads in an iframe at `/checkout` (same host as the storefront), served by SvelteKit. The liquid storefront handler excludes `/checkout` and `/api/*` paths.

### Auth model

- **Cookie-only**: The `shopper-session-token` HttpOnly cookie is set by the liquid storefront handler on page load. All `/api/*` requests carry it automatically.
- **No token management**: No `localStorage`, no `X-Shopper-Session-Token` header, no `postMessage` token handshake.

### SDK cart surface

```js
// Add to cart and open checkout iframe
await tiendu.cart.addProductVariant(selectedVariant, 1, onClose)

// Get cart quantity (badge count)
const { quantity } = await tiendu.cart.getQuantity()

// Open checkout iframe directly
tiendu.cart.open(onClose)
```

- `addProductVariant` calls `POST /api/cart/products/variants/{id}` (no headers)
- `getQuantity` calls `GET /api/cart/quantity` (no headers)
- `cart.open` creates a full-screen iframe at `/checkout`

### API paths (all same-origin, cookie-authenticated)

All API calls use relative paths (`/api/...`). StoreId is resolved from the request host.

**Storefront data:**

| Purpose | Method | Path |
|---|---|---|
| List products | GET | `/api/products` |
| Get product | GET | `/api/products/{id}` |
| Related products | GET | `/api/products/{id}/related` |
| List reviews | GET | `/api/reviews` |
| List categories | GET | `/api/categories` |
| Get category | GET | `/api/categories/{id}` |
| Add subscriber | POST | `/api/subscribers` |
| Get image | GET | `/api/images/{id}` |
| List pages | GET | `/api/pages` |
| Get page | GET | `/api/pages/{id}` |
| List blog posts | GET | `/api/blog-posts` |
| Get blog post | GET | `/api/blog-posts/{id}` |
| Get public metadata | GET | `/api/metadata/{key}` |

**Cart & checkout:**

| Purpose | Method | Path |
|---|---|---|
| Add to cart | POST | `/api/cart/products/variants/{id}` |
| Update item qty | POST | `/api/cart/items/{id}` |
| Delete item | DELETE | `/api/cart/items/{id}` |
| Cart quantity | GET | `/api/cart/quantity` |
| Load cart | GET | `/api/checkout/cart` |
| Edit checkout | POST | `/api/checkout/cart` |
| Delivery methods | GET | `/api/checkout/available-delivery-methods` |
| Shipping quote | POST | `/api/checkout/shipping-info` |
| Apply coupon | POST | `/api/checkout/coupons` |
| Price summary | POST | `/api/checkout/price-summary` |
| Payment link | POST | `/api/checkout/payment-link` |
| Payment status | GET | `/api/checkout/payment-status/{paymentId}` |
| Create order | POST | `/api/checkout/orders` |
| Store metadata | GET | `/api/checkout/metadata/{dataKey}` |

**Analytics:**

| Purpose | Method | Path |
|---|---|---|
| Checkout events | POST | `/api/analytics/checkout-events` |
| GA4 events | POST | `/api/analytics/ga4-events` |
| Meta CAPI events | POST | `/api/analytics/meta-events` |

### PostMessage protocol (iframe → parent)

Only two message types:

1. **`close`** — User dismisses the checkout. Payload: `{ type: 'close', updatedCartItemsQuantity: number }`
2. **`step-changed`** — Checkout step transitions. Payload: `{ type: 'step-changed', step: string, totalPriceInCents: number, items: array, currencyCode: string, orderId?: number, paymentExternalReference?: string }`

The SDK listens for these to fire client-side analytics (begin_checkout, purchase) and to clean up the iframe on close. No messages flow from parent → iframe.

## Important conventions

- Product/category/blog/page/metadata content is SSR in Liquid. Use `{% metadata key: 'my-key' %}` to fetch public store metadata in templates.
- Cart, search suggestions, variant selection, gallery behavior, and similar UI are hydrated with plain JS.
- For async storefront data/actions in the browser, use the Tiendu SDK instead of ad-hoc fetch calls. Import `Tiendu` from `assets/tiendu-sdk.js` and create the client in the module that needs it.
- Icons are snippet-rendered; do not reintroduce runtime Lucide replacement.
- SEO metadata is centralized in `snippets/seo-head.liquid` and rendered from `layout/theme.liquid`.
- All static files (CSS, JS, images, fonts) belong in `assets/`. Do not create `shared/`, `public/`, or route-scoped asset directories.
