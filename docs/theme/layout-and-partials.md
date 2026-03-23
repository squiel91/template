# Layout and snippets

## Layout

Main layout: `layout/theme.liquid`

Responsibilities:

- global `<head>` metadata via `snippets/seo-head.liquid`
- global CSS includes (via `asset_url` filter)
- site header, side menu, footer
- search snippet include
- cart button shell
- `main` wrapper and `{% block content %}`

## Common snippets

- `snippets/breadcrumbs.liquid`
- `snippets/header-search.liquid`
- `snippets/product-item.liquid`
- `snippets/category-item.liquid`
- `snippets/blog-card.liquid`
- `snippets/product-gallery.liquid`
- `snippets/rating-stars.liquid`
- `snippets/seo-head.liquid`

## CSS

All CSS lives in `assets/`. Referenced in templates via `asset_url`:

- `theme.css` — general theme styles
- `header-search.css` — header search only
- `buttons.css` — shared button styles
- `toast.css` — global toast UI
- `listing.css` — product/category/blog listing styles
- `gallery.css` — product gallery
- `product-page.css` — product detail page
- Component CSS: `breadcrumbs.css`, `product-item.css`, `category-item.css`, `rating-stars.css`, `blog-card.css`
- Page CSS files are linked from each template with `{% block head %}`

## JS

All JS lives in `assets/`. Referenced in templates via `asset_url`:

- `layout.js` — side menu, cart button, newsletter, footer year
- `search.js` — search suggestion dropdown and mobile search behavior
- `product-page.js` — product detail page hydration (gallery, variants, cart, reviews)
- `listing-quick-add.js` — quick add-to-cart from listing pages
- `tiendu-sdk.js` — same-origin browser SDK surface

## Caveats

- Keep layout behavior SSR-first; header/footer HTML should remain usable without JS.
- When changing shared snippets, check all templates that render them.
- Do not move SEO tags out of `seo-head.liquid` unless the metadata system itself changes.
