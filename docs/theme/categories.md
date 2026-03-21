# Categories index

Template: `templates/categories.liquid`

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
- `publicUrl`

## Current rendering pattern

- the page itself is a simple wrapper with heading + `category-item` cards
- category cards link to the category public URL

## Caveats

- This route is the category index; category detail is rendered by `templates/categoria.liquid`.
- Category trees come from the public service and may include nested `children`, but the current page renders only the top-level items it receives.
