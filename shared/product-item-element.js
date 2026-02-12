// @ts-nocheck

import { getListingProductState } from '/shared/product-pricing.js'
import { withOriginQuery } from '/shared/navigation-origin.js'
import { urlSafe } from '/shared/url-safe.js'

export const createProductItemElement = (product, options = {}) => {
	const item = document.createElement('product-item')
	const listingState = getListingProductState(product)
	const defaultUrl = `/productos/${product.id}/${urlSafe(product.title || 'producto')}`
	const targetUrl = typeof options.url === 'string' ? options.url : defaultUrl
	const linkWithOrigin = withOriginQuery(targetUrl, options.origin)

	item.setAttribute('product-id', String(product.id))
	item.setAttribute('title', product.title)
	item.setAttribute('price', listingState.priceLabel)
	item.setAttribute('average-rating', String(Number(product.averageRating) || 0))
	item.setAttribute('reviews-quantity', String(Number(product.reviewsQuantity) || 0))

	if (listingState.compareLabel) {
		item.setAttribute('compare-price', listingState.compareLabel)
	}

	item.setAttribute('url', linkWithOrigin)

	if (product.coverImage?.url) {
		item.setAttribute('image-url', product.coverImage.url)
		item.setAttribute('image-alt', product.coverImage.alt || product.title)
	}

	if (listingState.quickAddVariantId) {
		item.setAttribute('has-single-variant', 'true')
		item.setAttribute('variant-id', String(listingState.quickAddVariantId))
	} else if (listingState.hasMultipleVariants) {
		item.setAttribute('has-multiple-variants', 'true')
	}

	if (listingState.isOutOfStock) {
		item.setAttribute('out-of-stock', 'true')
	}

	return item
}
