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

const getListingVariant = product => {
	const variants = getValidVariants(product?.variants)
	if (variants.length === 0) return null
	let selected = variants[0]
	for (const variant of variants) {
		if ((variant.priceInCents ?? Number.MAX_SAFE_INTEGER) < (selected.priceInCents ?? Number.MAX_SAFE_INTEGER)) {
			selected = variant
		}
	}
	return selected
}

export const getListingPriceData = product => {
	const prices = getValidVariantPrices(product?.variants)
	const listingVariant = getListingVariant(product)

	if (prices.length === 0) {
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

	const minPrice = Math.min(...prices)
	const maxPrice = Math.max(...prices)
	const label = minPrice !== maxPrice ? `Desde ${formatCurrency(minPrice)}` : formatCurrency(minPrice)

	const comparePrice = listingVariant?.compareAtPriceInCents
	const compareLabel =
		typeof comparePrice === 'number' &&
		typeof listingVariant?.priceInCents === 'number' &&
		comparePrice > listingVariant.priceInCents
			? formatCurrency(comparePrice)
			: null

	return { label, compareLabel }
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
