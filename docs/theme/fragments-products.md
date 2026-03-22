# Products fragment

Template: `templates/fragments/products.liquid`

Route: `/__fragments/products`

## Purpose

- returns SSR product cards for "load more" behavior
- should stay markup-compatible with the main product grid in `templates/collection.liquid` and `templates/search.liquid`

## Direct route context

- `current_page`
- `products_page_size`
- `criteria`
- `order`
- optionally `search_query`
- optionally `category_id`
- optionally `include_products_from_subcategories`

## Request-driven values parsed in-template

- `originUrl`
- `originTitle`

These are pulled from `request.url` and passed to `product-item` so breadcrumb origin continues to work for appended cards.

## Liquid tags used

- `{% products ... as: 'frag_products' %}`
  - injects `frag_products`
  - injects `paginate`

## Caveats

- This response is marked as a Liquid fragment by the resolver, so shopper session bootstrapping and page-view analytics are skipped.
- Any markup change to product cards should be checked both here and in `templates/collection.liquid` and `templates/search.liquid`.
