# Products listing and category detail

Template: `templates/products.liquid`

This template renders two page types:

- `/productos`
- `/categorias/:id/:slug`

## Direct route context

Always available:

- `current_page`
- `products_page_size`

Products listing route also injects:

- `criteria`
- `order`
- `search_query`

Category detail route also injects:

- `category`

Useful `category` fields used in the template:

- `category.id`
- `category.name`
- `category.description`
- `category.publicUrl`

## Liquid tags used

- main listing/category content uses `{% products %}`
- output variables are:
  - `products`
  - `paginate`

Tag caveats:

- `search` is the supported search arg for the products tag.
- `paginate` is only set when the tag is used as a listing, not when fetching a single item by `id`.

## Origin handling

- Product links are SSR-decorated with `url-origen` and `titulo-origen` through `product-item.liquid`.
- The load-more fragment also receives `originUrl` and `originTitle` so appended cards keep the same breadcrumb behavior on the PDP.

## Caveats

- Search result pages are still `/productos?q=...` and should stay in Spanish route form.
- Category detail intentionally shares this template with product listing.
- If you change data attributes on `#product-listing`, update the load-more script and fragment template too.
