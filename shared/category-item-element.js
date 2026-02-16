// @ts-nocheck

import { withOriginQuery } from '/shared/navigation-origin.js'
import { urlSafe } from '/shared/url-safe.js'

export const createCategoryItemElement = (category, options = {}) => {
	const item = document.createElement('category-item')
	const defaultUrl = `/colecciones/${category.id}/${urlSafe(category.name || 'coleccion')}`
	const targetUrl = typeof options.url === 'string' ? options.url : defaultUrl
	const linkWithOrigin = withOriginQuery(targetUrl, options.origin)

	item.setAttribute('category-id', String(category.id))
	item.setAttribute('title', String(category.name || 'Categoría'))
	item.setAttribute('count', String(Number(category.productCount || 0)))
	item.setAttribute('url', linkWithOrigin)

	if (category.coverImage?.url) {
		item.setAttribute('image-url', String(category.coverImage.url))
		item.setAttribute('image-alt', String(category.coverImage.alt || category.name || ''))
	}

	return item
}
