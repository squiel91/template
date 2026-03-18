# Icon usage

## Liquid usage

Basic:

```liquid
{% render 'icon-search' %}
```

Common options:

```liquid
{% render 'icon-search', size: 18 %}
{% render 'icon-search', class: 'custom-class' %}
{% render 'icon-search', stroke_width: 1.5 %}
```

## Runtime icon toggling

If JS needs to swap icons, use multiple pre-rendered snippets:

```liquid
<span class="button__icon" aria-hidden="true">
  <span data-button-icon="shopping-cart">{% render 'icon-shopping-cart', size: 18 %}</span>
  <span data-button-icon="loader-2" hidden>{% render 'icon-loader-2', size: 18 %}</span>
</span>
```

Then toggle `hidden` in JS.

## Rules

- Prefer CSS sizing or the `size:` arg.
- Keep icon markup in Liquid, not inline SVG pasted into templates, unless there is a strong reason.
- Reuse existing `icon-*` snippets before generating new ones.
