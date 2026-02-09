// @ts-nocheck

import { getListingPriceData } from '/shared/product-pricing.js'
import { withOriginQuery } from '/shared/navigation-origin.js'
import { urlSafe } from '/shared/url-safe.js'

export const createProductItemElement = (product, options = {}) => {
	const item = document.createElement('product-item')
	const priceData = getListingPriceData(product)
	const validVariants = (product.variants || []).filter(v => typeof v?.priceInCents === 'number')
	const defaultUrl = `/productos/${product.id}/${urlSafe(product.title || 'producto')}`
	const targetUrl = typeof options.url === 'string' ? options.url : defaultUrl
	const linkWithOrigin = withOriginQuery(targetUrl, options.origin)

	item.setAttribute('product-id', String(product.id))
	item.setAttribute('title', product.title)
	item.setAttribute('price', priceData.label)
	item.setAttribute('average-rating', String(Number(product.averageRating) || 0))
	item.setAttribute('reviews-quantity', String(Number(product.reviewsQuantity) || 0))

	if (priceData.compareLabel) {
		item.setAttribute('compare-price', priceData.compareLabel)
	}

	item.setAttribute('url', linkWithOrigin)

	if (product.coverImage?.url) {
		item.setAttribute('image-url', product.coverImage.url)
		item.setAttribute('image-alt', product.coverImage.alt || product.title)
	}

	if (validVariants.length === 1) {
		item.setAttribute('has-single-variant', 'true')
		item.setAttribute('variant-id', String(validVariants[0].id))
	} else if (validVariants.length > 1) {
		item.setAttribute('has-multiple-variants', 'true')
	}

	return item
}
