# Storefront guide (developers and coding agents)

This storefront is delivered as static files from this directory.

## Core rules

- Everything here is public and can be accessed by URL.
- Do not store secrets here (API keys, private tokens, credentials).
- There is no build process for this storefront.
- Use plain JavaScript only, max ES2020 for compatibility.
- Put storefront runtime variables in `tiendu.config.js`.

## Required config

Define public runtime values in `tiendu.config.js`:

```js
export const PUBLIC_TIENDU_API_BASE_URL = 'https://tiendu.uy'
export const PUBLIC_TIENDU_STORE_ID = 2
```

Treat these values as public.

## Directory-based routing

Routing is file based with `+page.html` and optional nested `+layout.html` using `{{content}}`.

Segment types:

- Static: `productos`
- Required param: `[productId]`
- Optional terminal param: `[[safeSearchProductTitle]]`

Examples:

- `/` -> `+page.html`
- `/productos` -> `productos/+page.html`
- `/productos/323` -> `productos/[productId]/+page.html`
- `/productos/323/camisa-azul` -> `productos/[productId]/[[safeSearchProductTitle]]/+page.html`

We recommend using Spanish route groups like:

- `/productos`
- `/categorias`
- `/paginas`

## Reading route params in scripts

Dynamic params are injected into `window.PARAMS`.

```js
const params = /** @type {{ productId?: string }} */ (window.PARAMS ?? {})
const productId = Number(params.productId)
```

## Use `tiendu-sdk.js` for data access

Use `tiendu-sdk.js` to interact with products, categories, pages, and cart.

Recommended usage through shared client:

```js
import { tiendu } from '/shared/tiendu-client.js'

const productsRes = await tiendu.products.list({
  search: 'camisa',
  page: 1,
  size: 20,
  criteria: 'price',
  order: 'asc'
})
const products = productsRes.data

const product = await tiendu.products.get(323)
const categories = await tiendu.categories.list()
const page = await tiendu.pages.get(10)

await tiendu.cart.addProductVariant(selectedVariant, 1)
const { quantity } = await tiendu.cart.getQuantity()
tiendu.cart.open()
```

## SEO-friendly URL slugs

Use `/shared/url-safe.js` to build readable optional slug URLs.

```js
import { urlSafe } from '/shared/url-safe.js'

const productHref = `/productos/${product.id}/${urlSafe(product.title)}`
const categoryHref = `/categorias/${category.id}/${urlSafe(category.name)}`
const pageHref = `/paginas/${page.id}/${urlSafe(page.title || 'pagina')}`
```

Patterns:

- `/productos/:id/:slug?`
- `/categorias/:id/:slug?`
- `/paginas/:id/:slug?`

Notice: This `README.md` is enforced as unmutable by the server tooling and cannot be edited or removed through storefront code operations.
