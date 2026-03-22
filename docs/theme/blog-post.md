# Blog post

Template: `templates/article.liquid`

## Direct route context

- `blogPost`

Fields used:

- `blogPost.id`
- `blogPost.title`
- `blogPost.excerpt`
- `blogPost.coverImage`
- `blogPost.publicUrl`
- `blogPost.createdAt`
- `blogPost.updatedAt`
- `blogPost.manager`
- `blogPost.content`

## Content rendering

Supported block types currently handled:

- `heading`
- `paragraph`
- `image`
- `html`

## Caveats

- Like pages, blog posts are rendered directly in Liquid.
- SEO metadata for blog posts is generated centrally in `snippets/seo-head.liquid` from `blogPost`.

## Alternate templates

- This route supports alternate templates via `article.{suffix}.liquid`.
- Saved `template_suffix` and `?view=` both follow the normal template selection rules.
