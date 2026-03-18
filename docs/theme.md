# Theme docs

This storefront uses the custom Liquid renderer in `src/lib/server/liquid-storefront-handler/`.

## Mental model

- Every route resolves to a Liquid template name.
- `layout/theme.liquid` is the outer layout.
- Page templates provide `{% block content %}` and optionally `{% block head %}`.
- Two globals are always available in the theme: `store` and `request`.
- Route-specific objects are injected by the Liquid route loader.
- Liquid block tags like `{% products %}`, `{% categories %}`, `{% pages %}`, and `{% blog_posts %}` fetch extra public data inside templates.

## Start here

- Globals and always-available objects: `theme/globals.md`
- Layout, partials, and CSS entry points: `theme/layout-and-partials.md`

## Routes

- Home: `theme/home.md`
- Products listing and category detail: `theme/products.md`
- Product detail: `theme/product.md`
- Categories index: `theme/categories.md`
- Page detail: `theme/page.md`
- Blog index: `theme/blog.md`
- Blog post: `theme/blog-post.md`
- Products fragment pagination: `theme/fragments-products.md`

## Caveats

- The route loader only injects a small top-level context. If you need more data, first check whether an existing Liquid tag can fetch it before changing the resolver.
- Search params are available through `request.url`, not as a parsed object.
- Breadcrumb origin on the PDP is SSR and read from `request.url` (`url-origen` and `titulo-origen`).
- Product/category cards are snippets; when changing listing UI, keep fragment pagination output compatible with the main listing template.
