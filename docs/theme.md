# Theme docs

This storefront uses the Tiendu Liquid renderer.

## Mental model

- Every route resolves to a Liquid template name.
- `layout/theme.liquid` is the outer layout.
- Page templates provide `{% block content %}` and optionally `{% block head %}`.
- Two globals are always available in the theme: `store` and `request`.
- Route-specific objects are injected by the Liquid route loader.
- Liquid block tags like `{% products %}`, `{% categories %}`, `{% pages %}`, `{% blog_posts %}`, and `{% metadata %}` fetch extra public data inside templates.

## Start here

- Globals and always-available objects: `theme/globals.md`
- Layout, partials, and CSS entry points: `theme/layout-and-partials.md`

## Routes

- Home: `theme/home.md`
- Collection detail (`collection.liquid`): `theme/categoria.md`
- Search: `theme/busqueda.md`
- Product detail: `theme/product.md`
- Collections index (`list-collections.liquid`): `theme/categories.md`
- Page detail: `theme/page.md`
- Blog index: `theme/blog.md`
- Article (`article.liquid`): `theme/blog-post.md`
- Not found: `theme/404.md`
- Products fragment pagination: `theme/fragments-products.md`

## Template selection

Alternate templates can be created for products, collections, pages, and articles using dot-suffix naming. See `docs/template-selection.md` for full details.

- Supported single-resource routes: `/productos/:id/:slug?`, `/categorias/:id/:slug?`, `/paginas/:id/:slug?`, `/blog/:id/:slug?`
- Route-level templates like `index.liquid`, `search.liquid`, `blog.liquid`, `list-collections.liquid`, and `404.liquid` stay outside per-resource template selection.

## Caveats

- The route loader only injects a small top-level context. If you need more data, first check whether an existing Liquid tag can fetch it before changing the resolver.
- Search params are available through `request.url`, not as a parsed object.
- Breadcrumb origin on the PDP is SSR and read from `request.url` (`url-origen` and `titulo-origen`).
- Product/category cards are snippets; when changing listing UI, keep fragment pagination output compatible with the main listing template.
