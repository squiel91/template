# Blog index

Template: `templates/blog.liquid`

## Direct route context

- no extra top-level route object beyond `store` and `request`

## Liquid tags used

- `{% blog_posts as: 'all_posts' %}`
  - injects `all_posts`
  - posts are already sorted newest-first by the Liquid tag implementation

Useful post fields:

- `id`
- `title`
- `excerpt`
- `coverImage`
- `manager`
- `url` (relative path)
- `publicUrl` (absolute URL)
- `createdAt`
- `updatedAt`

## Current rendering pattern

- first item renders as featured
- remaining items render in the regular blog-list layout

## Caveats

- Use `post.url` for blog post links. Prefer `url` (relative) over `publicUrl` (absolute) in templates.
