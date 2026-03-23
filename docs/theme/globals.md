# Globals

These objects are available in every Liquid template rendered by the Liquid storefront handler.

## `store`

Injected by the Liquid storefront handler at render time.

Fields:

- `store.id`
- `store.name`
- `store.description`
- `store.hostname`
- `store.url`
- `store.country_code`
- `store.currency.code`
- `store.currency.name`
- `store.currency.symbol`
- `store.whatsapp_number`
- `store.email_address`

## `request`

Also injected by the Liquid storefront handler at render time.

Fields:

- `request.host`
- `request.path`
- `request.url`
- `request.page_type`

Current `request.page_type` values produced by the Liquid route loader:

- `index`
- `products` (`/__fragments/products`)
- `product`
- `list-collections`
- `collection`
- `search`
- `page`
- `blog`
- `article`
- `404`

## `{% metadata %}` tag

Fetches public metadata by key from the store's metadata system. Available in any template.

Usage:

```liquid
{% metadata key: 'my-key' %}
  {{ metadata }}
{% endmetadata %}
```

With custom variable name:

```liquid
{% metadata key: 'extra-payment-methods' as: 'payment_methods' %}
  {% for method in payment_methods %}
    {{ method.name }}
  {% endfor %}
{% endmetadata %}
```

- `key` (required): The metadata key to look up.
- `as` (optional): Variable name to inject. Defaults to `metadata`.
- Returns `null` if the key doesn't exist or isn't marked as public.
- The data is the populated metadata value (references to images, products, categories are resolved).

API equivalent: `GET /api/metadata/{key}`

## Caveats

- `request.url` is the full absolute URL string, including query params.
- If you need query values in Liquid, parse them from `request.url`.
- `request.path` is only the pathname.
- The theme uses `store.url` for canonical and metadata generation.
