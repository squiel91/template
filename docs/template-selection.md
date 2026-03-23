# Template selection

Alternate template support for the storefront theme. Allows resources (products, collections, pages, articles) to render with alternate templates instead of the default one.

The theme intentionally ships with only the default templates. Alternate templates are opt-in and should be added only when a store needs them.

## Naming convention

Alternate templates use dot-suffix naming inside `templates/`:

```
templates/
  product.liquid            ← default product template
  product.gift-guide.liquid ← alternate "gift-guide" template
  product.minimal.liquid    ← alternate "minimal" template
  collection.liquid
  collection.featured.liquid
  page.liquid
  page.faq.liquid
  article.liquid
  article.recipe.liquid
```

Suffix must match `[a-zA-Z0-9_-]+`. Files that don't match this pattern are ignored.

## Resolution chain

When rendering a supported resource page, the engine resolves which template to use in this order:

1. **`?view=` query parameter** — e.g. `/productos/123/mi-producto?view=gift-guide` → tries `product.gift-guide.liquid`
2. **Saved `template_suffix`** — the value stored on the resource in the database
3. **Default template** — e.g. `product.liquid`

At each step, the file must exist on disk. If it doesn't, the chain falls through to the next option.

Only single-resource routes participate in alternate template resolution:

- `/productos/:id/:slug?`
- `/categorias/:id/:slug?`
- `/paginas/:id/:slug?`
- `/blog/:id/:slug?`

Route-level templates like `index.liquid`, `blog.liquid`, `list-collections.liquid`, `search.liquid`, and `404.liquid` are not part of this system.

## Saved template suffix

Each resource table has an optional `template_suffix` column (`varchar(64)`, nullable):

- `products.template_suffix`
- `categories.template_suffix`
- `pages.template_suffix`
- `blog_posts.template_suffix`

Set via the admin API when creating or updating a resource. Pass `null` to clear it and revert to the default template.

### API usage

All four resource endpoints accept `templateSuffix` in their create/update payloads:

```bash
# Set a product's template suffix
curl -X PATCH "http://localhost:4000/api/stores/30/products/123" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"templateSuffix": "gift-guide"}'

# Clear it (use default template)
curl -X PATCH "http://localhost:4000/api/stores/30/products/123" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"templateSuffix": null}'
```

## Discovery API

To list which alternate suffixes are available for a template family:

```
GET /api/stores/{storeId}/code/template-suffixes?templateFamily=product
```

Returns an array of suffix strings found by scanning the theme's `templates/` directory. For example, if `templates/product.gift-guide.liquid` and `templates/product.minimal.liquid` exist, the response is `["gift-guide", "minimal"]`.

Supported families:

- `product`
- `collection`
- `page`
- `article`

## How it works internally

1. `routes.ts` marks only product, collection, page, and article routes as template-selectable and includes the saved `template_suffix` in their route context.
2. `resolveLiquidStorefrontResponse` in `index.ts` applies `?view=` only for those supported resource routes.
3. `resolveTemplateName` checks `?view=` first, then saved suffix, falling back to the base template. For suffixed templates, it returns an absolute path to work around a LiquidJS limitation with dots in filenames.

## Adding a new alternate template

1. Create `templates/{family}.{suffix}.liquid` (e.g. `templates/product.landing.liquid`).
2. The template uses the same layout and has access to the same context variables as the default template.
3. Optionally set the suffix on a resource via the API so it renders by default.
4. Or use `?view=landing` in the URL to preview it.

## Admin behavior

- Product, category, page, and blog post editors expose a template dropdown.
- The dropdown shows the default option plus the live suffixes discovered from the current theme.
- If a saved suffix no longer exists on disk, it stays visible as unavailable so the merchant can recover cleanly.
- In that missing-template state, the storefront falls back to the default template until a valid template is selected.

## Template families that support alternates

| Family             | Base template            | Route URL pattern        |
|--------------------|--------------------------|--------------------------|
| `product`          | `product.liquid`         | `/productos/:id/:slug?`  |
| `collection`       | `collection.liquid`      | `/categorias/:id/:slug?` |
| `page`             | `page.liquid`            | `/paginas/:id/:slug?`    |
| `article`          | `article.liquid`         | `/blog/:id/:slug?`       |
