# Search

Template: `templates/busqueda.liquid`

Route:

- `/busqueda`

## Direct route context

- `current_page`
- `products_page_size`
- `criteria`
- `order`
- `search_query`

## Liquid tags used

- main search results use `{% products %}`
- output variables are:
  - `products`
  - `paginate`

## Current rendering pattern

- the page shows a search prompt when `search_query` is blank
- when a query is present, the page renders the matching product grid with load-more behavior
- product links keep origin query params so PDP breadcrumbs can point back to the search page

## Caveats

- Search suggestions in the header also link to `/busqueda?q=...`.
- If you change data attributes on `#product-listing`, update the load-more script and fragment template too.
