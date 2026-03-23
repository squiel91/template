# Product detail

Template: `templates/product.liquid`

## Direct route context

- `product`
- `product_page`

## `product`

Main public product object from `viewPublicProductById(...)`.

Fields used by the template and scripts:

- `product.id`
- `product.title`
- `product.url` (relative path, e.g. `/productos/123/mi-producto`)
- `product.publicUrl` (absolute URL)
- `product.description`
- `product.specifications`
- `product.images`
- `product.attributes`
- `product.variants`
- `product.basePriceInCents`
- `product.baseCompareAtPriceInCents`
- `product.averageRating`
- `product.reviewsQuantity`
- `product.unitsSold`

## `product_page`

Built in `src/lib/server/liquid-storefront-handler/product-page.ts`.

Fields:

- `product_page.gallery_images`
- `product_page.price`
  - `price_in_cents`
  - `compare_at_price_in_cents`
  - `price_is_from`
  - `compare_is_from`
- `product_page.stock_note`
  - `tone`
  - `message`
- `product_page.requires_variant_selection`
- `product_page.default_attribute_values`
- `product_page.quantity_hidden`
- `product_page.quantity_disabled`
- `product_page.quantity_max`
- `product_page.add_to_cart`
  - `label`
  - `icon`
  - `disabled`
- `product_page.reviews`
- `product_page.related_products`

## Query-driven behavior

The template reads `request.url` directly for:

- `url-origen`
- `titulo-origen`

That determines the SSR breadcrumb middle item on the PDP.

## Client hydration

Script: `assets/product-page.js`

Client JS owns:

- variant selection
- price/stock updates
- `variant-id` sync in the URL
- add-to-cart behavior
- gallery interaction
- review expand/collapse
- description expand/collapse

## Caveats

- The visible product content should remain SSR.
- If you add new PDP server state, prefer extending `product_page` instead of bloating `product` or the global context.
- Keep `product-json` aligned with the client script if the PDP JS changes.
