# Page detail

Template: `templates/page.liquid`

## Direct route context

- `page`

Fields used:

- `page.id`
- `page.title`
- `page.coverImage`
- `page.url` (relative path)
- `page.publicUrl` (absolute URL)
- `page.content`

## Content rendering

Supported block types currently handled in the template:

- `heading`
- `paragraph`
- `image`
- `html`

## Caveats

- The page template renders content directly in Liquid; there is no client-side page-specific hydration today.
- If new content block types are added upstream, this template may need to be updated to support them.
