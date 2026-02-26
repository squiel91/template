// @ts-nocheck

export const formatCurrency = value => {
	if (typeof value !== 'number') return ''
	return new Intl.NumberFormat('es-UY', {
		style: 'currency',
		currency: 'UYU',
		maximumFractionDigits: 0
	}).format(value / 100)
}

const getValidVariantPrices = variants => {
	if (!Array.isArray(variants)) return []
	return variants
		.map(variant => variant?.priceInCents)
		.filter(price => typeof price === 'number')
}

const getValidVariants = variants => {
	if (!Array.isArray(variants)) return []
	return variants.filter(variant => typeof variant?.priceInCents === 'number')
}

const toFiniteStock = value => {
	if (typeof value !== 'number' || !Number.isFinite(value)) return null
	return Math.max(0, Math.floor(value))
}

const getCompareLabelForVariants = variants => {
	if (!Array.isArray(variants) || variants.length === 0) return null

	const compareValues = []
	for (const variant of variants) {
		const price = variant?.priceInCents
		const compare = variant?.compareAtPriceInCents
		if (typeof price !== 'number' || typeof compare !== 'number' || compare <= price) {
			return null
		}
		compareValues.push(compare)
	}

	if (compareValues.length === 0) return null
	const minCompare = Math.min(...compareValues)
	const maxCompare = Math.max(...compareValues)
	return minCompare === maxCompare
		? formatCurrency(minCompare)
		: `Desde ${formatCurrency(minCompare)}`
}

export const getVariantSetPriceData = ({ product, variants }) => {
	const validVariants = getValidVariants(variants)

	if (validVariants.length === 0) {
		const basePrice = product?.basePriceInCents
		const baseCompare = product?.baseCompareAtPriceInCents
		return {
			label: formatCurrency(basePrice),
			compareLabel:
				typeof basePrice === 'number' &&
				typeof baseCompare === 'number' &&
				baseCompare > basePrice
					? formatCurrency(baseCompare)
					: null
		}
	}

	const prices = getValidVariantPrices(validVariants)
	const minPrice = Math.min(...prices)
	const maxPrice = Math.max(...prices)
	const label = minPrice !== maxPrice ? `Desde ${formatCurrency(minPrice)}` : formatCurrency(minPrice)

	return {
		label,
		compareLabel: getCompareLabelForVariants(validVariants)
	}
}

export const getListingPriceData = product => {
	return getVariantSetPriceData({ product, variants: product?.variants })
}

export const getProductStockOverview = product => {
	const variants = Array.isArray(product?.variants) ? product.variants : []
	if (variants.length === 0) {
		const stock = toFiniteStock(product?.stock)
		return {
			allVariantsOutOfStock: stock === 0,
			allVariantsUntracked: stock == null,
			sharedVariantStock: stock
		}
	}

	const stocks = variants.map(variant => toFiniteStock(variant?.stock))
	const allTracked = stocks.every(stock => stock != null)
	const allUntracked = stocks.every(stock => stock == null)
	const sharedVariantStock =
		allTracked && stocks.length > 0 && stocks.every(stock => stock === stocks[0]) ? stocks[0] : null

	return {
		allVariantsOutOfStock: allTracked && stocks.every(stock => stock === 0),
		allVariantsUntracked: allUntracked,
		sharedVariantStock
	}
}

export const getListingProductState = product => {
	const priceData = getListingPriceData(product)
	const validVariants = getValidVariants(product?.variants)
	const stockOverview = getProductStockOverview(product)
	const isOutOfStock = stockOverview.allVariantsOutOfStock
	const quickAddVariant = validVariants.length === 1 && !isOutOfStock ? validVariants[0] : null

	return {
		priceLabel: priceData.label,
		compareLabel: priceData.compareLabel,
		hasMultipleVariants: validVariants.length > 1,
		quickAddVariantId: quickAddVariant?.id ?? null,
		isOutOfStock
	}
}

export const getVariantSetStockData = variants => {
	if (!Array.isArray(variants) || variants.length === 0) {
		return { mode: 'unknown' }
	}

	const stocks = variants.map(variant => toFiniteStock(variant?.stock))
	const trackedStocks = stocks.filter(stock => stock != null)

	if (trackedStocks.length === 0) {
		return { mode: 'untracked' }
	}

	const min = Math.min(...trackedStocks)
	const max = Math.max(...trackedStocks)
	const hasUntracked = trackedStocks.length !== stocks.length

	if (min === max && !hasUntracked) {
		return { mode: 'exact', value: min }
	}

	return { mode: 'variable' }
}

export const getSharedVariantCoverImageId = variants => {
	if (!Array.isArray(variants) || variants.length === 0) return null

	let sharedImageUrl = null
	let sharedImageId = null
	for (const variant of variants) {
		const imageUrl = typeof variant?.coverImage?.url === 'string'
			? variant.coverImage.url.trim()
			: ''
		if (!imageUrl) {
			return null
		}
		if (sharedImageUrl == null) {
			sharedImageUrl = imageUrl
		} else if (sharedImageUrl !== imageUrl) {
			return null
		}

		const imageId = Number(variant?.coverImage?.id)
		if (Number.isFinite(imageId) && sharedImageId == null) {
			sharedImageId = imageId
		}
	}

	return sharedImageId
}

export const getListingPriceLabel = product => {
	return getListingPriceData(product).label
}

export const getPriceDataForVariant = (product, variant) => {
	const priceInCents =
		typeof variant?.priceInCents === 'number'
			? variant.priceInCents
			: product.basePriceInCents
	const compareInCents =
		typeof variant?.compareAtPriceInCents === 'number'
			? variant.compareAtPriceInCents
			: null

	return {
		priceInCents,
		label: formatCurrency(priceInCents),
		compareLabel:
			typeof compareInCents === 'number' &&
			typeof priceInCents === 'number' &&
			compareInCents > priceInCents
				? formatCurrency(compareInCents)
				: null
	}
}
