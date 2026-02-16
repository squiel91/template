// @ts-nocheck

import { withOriginQuery } from '/shared/navigation-origin.js'
import { urlSafe } from '/shared/url-safe.js'

export const createProductItemElement = (product, options = {}) => {
	const item = document.createElement('product-item')
	const defaultUrl = `/perfumes/${product.id}/${urlSafe(product.title || 'producto')}`
	const targetUrl = typeof options.url === 'string' ? options.url : defaultUrl
	const linkWithOrigin = withOriginQuery(targetUrl, options.origin)

	item.product = product

	item.setAttribute('url', linkWithOrigin)

	return item
}
