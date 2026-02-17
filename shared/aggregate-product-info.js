// @ts-nocheck

export const formatCurrency = value => {
	if (typeof value !== 'number' || !Number.isFinite(value)) return ''
	return new Intl.NumberFormat('es-UY', {
		style: 'currency',
		currency: 'UYU',
		maximumFractionDigits: 0
	}).format(value / 100)
}

const toFiniteStock = value => {
	if (typeof value !== 'number' || !Number.isFinite(value)) return null
	return Math.max(0, Math.floor(value))
}

const getVariantsWithPrice = variants => {
	if (!Array.isArray(variants)) return []
	return variants.filter(variant => typeof variant?.priceInCents === 'number')
}

const resolvePriceStrategy = strategy =>
	strategy === 'cheapest' ? 'cheapest' : 'most-expensive'

export const getProductVariantByPriceStrategy = (variants, strategy = 'most-expensive') => {
	const variantsWithPrice = getVariantsWithPrice(variants)
	if (variantsWithPrice.length === 0) return null

	const normalizedStrategy = resolvePriceStrategy(strategy)
	let selectedVariant = variantsWithPrice[0]
	for (const variant of variantsWithPrice) {
		const variantPrice = variant.priceInCents ?? null
		const selectedPrice = selectedVariant.priceInCents ?? null
		if (typeof variantPrice !== 'number' || typeof selectedPrice !== 'number') continue

		if (
			(normalizedStrategy === 'cheapest' && variantPrice < selectedPrice) ||
			(normalizedStrategy === 'most-expensive' && variantPrice > selectedPrice)
		) {
			selectedVariant = variant
		}
	}

	return selectedVariant
}

export const getProductStockOverview = product => {
	const variants = Array.isArray(product?.variants) ? product.variants : []

	if (variants.length === 0) {
		const stock = toFiniteStock(product?.stock)
		return {
			stock,
			allVariantsOutOfStock: stock === 0,
			allVariantsUntracked: stock == null,
			sharedVariantStock: stock
		}
	}

	const stocks = variants.map(variant => toFiniteStock(variant?.stock))
	const allTracked = stocks.every(stock => stock != null)
	const allUntracked = stocks.every(stock => stock == null)

	const stock =
		allTracked
			? stocks.reduce((sum, current) => sum + (typeof current === 'number' ? current : 0), 0)
			: null

	const sharedVariantStock =
		allTracked && stocks.length > 0 && stocks.every(value => value === stocks[0]) ? stocks[0] : null

	return {
		stock,
		allVariantsOutOfStock: allTracked && stocks.every(value => value === 0),
		allVariantsUntracked: allUntracked,
		sharedVariantStock
	}
}

export const getAggregateProductInfo = (product, options = {}) => {
	const normalizedStrategy = resolvePriceStrategy(options?.strategy)
	const listingVariant = getProductVariantByPriceStrategy(
		product?.variants,
		normalizedStrategy
	)
	const priceInCents =
		typeof listingVariant?.priceInCents === 'number' ? listingVariant.priceInCents : null

	const compareAtPriceInCents =
		typeof listingVariant?.compareAtPriceInCents === 'number'
			? listingVariant.compareAtPriceInCents
			: null

	const hasDisplayPrice = typeof priceInCents === 'number' && Number.isFinite(priceInCents)
	const hasComparePrice =
		typeof compareAtPriceInCents === 'number' &&
		Number.isFinite(compareAtPriceInCents) &&
		hasDisplayPrice &&
		compareAtPriceInCents > priceInCents

	const discountPercentage = hasComparePrice
		? Math.round(((compareAtPriceInCents - priceInCents) / compareAtPriceInCents) * 100)
		: null

	const variants = Array.isArray(product?.variants) ? product.variants : []
	const isOutOfStock =
		variants.length > 0
			? variants.every(
				variant =>
					typeof variant?.stock === 'number' && Number.isFinite(variant.stock) && variant.stock <= 0
			)
			: typeof product?.stock === 'number' && Number.isFinite(product.stock)
				? product.stock <= 0
				: false

	return {
		priceInCents,
		compareAtPriceInCents: hasComparePrice ? compareAtPriceInCents : null,
		priceLabel: hasDisplayPrice ? formatCurrency(priceInCents) : '',
		compareLabel: hasComparePrice ? formatCurrency(compareAtPriceInCents) : '',
		discountPercentage,
		isOutOfStock,
		hasDisplayPrice
	}
}

export const getListingPriceLabel = product => {
	return getAggregateProductInfo(product).priceLabel
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
