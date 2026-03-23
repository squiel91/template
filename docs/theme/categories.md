# Categories index

Template: `templates/list-collections.liquid`

`request.page_type`: `list-collections`

## Direct route context

- no extra top-level route object beyond `store` and `request`

## Liquid tags used

- `{% categories as: 'all_categories' %}`
  - injects `all_categories`

Each category item exposes fields such as:

- `id`
- `name`
- `description`
- `productCount`
- `coverImage`
- `children`
- `url` (relative path)
- `publicUrl` (absolute URL)

## Current rendering pattern

- the page itself is a simple wrapper with heading + `category-item` cards
- category cards link to the category public URL

## Caveats

- This route is the category index; category detail is rendered by `templates/collection.liquid`.
- Category trees come from the public service and may include nested `children`, but the current page renders only the top-level items it receives.

## Template selection note

- `list-collections.liquid` is a route-level template and does not support per-resource template selection.
