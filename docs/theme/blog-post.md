# Blog post

Template: `templates/blog-post.liquid`

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
