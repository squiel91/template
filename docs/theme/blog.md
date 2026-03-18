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
- `publicUrl`
- `createdAt`
- `updatedAt`

## Current rendering pattern

- first item renders as featured
- remaining items render in the regular blog-list layout

## Caveats

- The template currently builds post links manually with `/blog/{{ id }}/{{ title | url_safe }}` even though `publicUrl` also exists.
- If you want stricter consistency with other routes, switching to `publicUrl` is a possible future cleanup.
