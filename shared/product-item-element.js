// @ts-nocheck

import { withOriginQuery } from '/shared/navigation-origin.js'
import { urlSafe } from '/shared/url-safe.js'
import { getProductVariantByPriceStrategy } from '/shared/aggregate-product-info.js'

export const createProductItemElement = (product, options = {}) => {
	const item = document.createElement('product-item')
	const priceStrategy = options.priceStrategy === 'cheapest' ? 'cheapest' : 'most-expensive'
	const defaultUrl = `/perfumes/${product.id}/${urlSafe(product.title || 'producto')}`
	const targetUrl = typeof options.url === 'string' ? options.url : defaultUrl
	const target = new URL(targetUrl, window.location.origin)
	const selectedVariant = getProductVariantByPriceStrategy(product?.variants, priceStrategy)
	if (Number.isFinite(Number(selectedVariant?.id))) {
		target.searchParams.set('variantId', String(selectedVariant.id))
	}

	const withVariantParam = `${target.pathname}${target.search}${target.hash}`
	const linkWithOrigin = withOriginQuery(withVariantParam, options.origin)

	item.product = product
	item.priceStrategy = priceStrategy

	item.setAttribute('url', linkWithOrigin)

	return item
}
