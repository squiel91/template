# Globals

These objects are available in every Liquid template rendered by the Liquid storefront handler.

## `store`

Injected in `src/lib/server/liquid-storefront-handler/index.ts`.

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

Also injected in `src/lib/server/liquid-storefront-handler/index.ts`.

Fields:

- `request.host`
- `request.path`
- `request.url`
- `request.page_type`

## Caveats

- `request.url` is the full absolute URL string, including query params.
- If you need query values in Liquid, parse them from `request.url`.
- `request.path` is only the pathname.
- The theme uses `store.url` for canonical and metadata generation.
