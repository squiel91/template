# Category detail

Template: `templates/categoria.liquid`

Route:

- `/categorias/:id/:slug`

## Direct route context

- `category`
- `current_page`
- `products_page_size`

Useful `category` fields used in the template:

- `category.id`
- `category.name`
- `category.description`
- `category.publicUrl`

## Liquid tags used

- main listing content uses `{% products %}`
- output variables are:
  - `products`
  - `paginate`

## Origin handling

- Product links are SSR-decorated with `url-origen` and `titulo-origen` through `product-item.liquid`.
- The load-more fragment also receives `originUrl` and `originTitle` so appended cards keep the same breadcrumb behavior on the PDP.

## Caveats

- This template currently handles category detail only.
- If you change data attributes on `#product-listing`, update the load-more script and fragment template too.
