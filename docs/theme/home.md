# Home

Template: `templates/index.liquid`

## Direct route context

- `current_page`
- `products_page_size`

These are currently only useful for tag-driven sections and future pagination; the template mostly relies on Liquid tags.

## Liquid tags used

- `{% products limit: 8, sort: 'sales', order: 'desc' %}`
  - injects `products`
  - injects `paginate`
- `{% categories as: 'home_categories' %}`
  - injects `home_categories`
- `{% blog_posts limit: 4 as: 'latest_posts' %}`
  - injects `latest_posts`

## Current rendering pattern

- hero is static copy in the template
- featured products use `product-item`
- categories use `category-item`
- blog cards use `blog-card`

## Caveats

- If you change the listing snippets here, verify they still work in other pages too.
- `product-item` on the home page does not currently pass origin params; only listing/category/search flows do.
