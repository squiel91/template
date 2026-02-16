// @ts-nocheck

import { toSafeCssColor } from '/shared/css-color.js'

const buildWarningContext = product =>
	Number.isFinite(Number(product?.id))
		? `[product:${Number(product.id)}]`
		: '[product:unknown]'

const warnInvalidMetadata = (warningContext, message, payload) => {
	if (typeof console?.warn !== 'function') return
	console.warn(`${warningContext} ${message}`, payload)
}

const parseMetadataObject = (product, warningContext) => {
	if (
		product?.metadata &&
		typeof product.metadata === 'object' &&
		!Array.isArray(product.metadata)
	) {
		return product.metadata
	}

	if (typeof product?.metadata === 'string') {
		try {
			const parsedMetadata = JSON.parse(product.metadata)
			if (
				parsedMetadata &&
				typeof parsedMetadata === 'object' &&
				!Array.isArray(parsedMetadata)
			) {
				return parsedMetadata
			}

			warnInvalidMetadata(
				warningContext,
				'`metadata` should be an object.',
				parsedMetadata
			)
		} catch {
			warnInvalidMetadata(
				warningContext,
				'`metadata` string is not valid JSON.',
				product.metadata
			)
		}
		return null
	}

	if (product?.metadata != null) {
		warnInvalidMetadata(
			warningContext,
			'`metadata` has an unsupported type.',
			product.metadata
		)
	}

	return null
}

export const getNormalizedMetadataColors = (product, options = {}) => {
	const warningContext =
		typeof options.warningContext === 'string' && options.warningContext.length > 0
			? options.warningContext
			: buildWarningContext(product)
	const metadata = parseMetadataObject(product, warningContext)
	const rawColors = metadata?.colors

	if (rawColors == null) return []
	if (!Array.isArray(rawColors)) {
		warnInvalidMetadata(
			warningContext,
			'`metadata.colors` should be an array.',
			rawColors
		)
		return []
	}

	return rawColors.reduce((result, item, index) => {
		if (!item || typeof item !== 'object' || Array.isArray(item)) {
			warnInvalidMetadata(
				warningContext,
				'Invalid color item. Expected object.',
				{ index, item }
			)
			return result
		}

		const name = typeof item.name === 'string' ? item.name.trim() : ''
		const value = typeof item.value === 'string' ? item.value.trim() : ''
		const safeColor = toSafeCssColor(value)

		if (!name || !value || !safeColor) {
			warnInvalidMetadata(
				warningContext,
				'Invalid color item. Expected non-empty `name` and valid css `value`.',
				{ index, item }
			)
			return result
		}

		result.push({ name, value: safeColor })
		return result
	}, [])
}

export const getMetadataBrand = (product, options = {}) => {
	const warningContext =
		typeof options.warningContext === 'string' && options.warningContext.length > 0
			? options.warningContext
			: buildWarningContext(product)
	const metadata = parseMetadataObject(product, warningContext)
	const rawBrand = metadata?.brand

	if (rawBrand == null) return ''
	if (typeof rawBrand !== 'string') {
		warnInvalidMetadata(warningContext, '`metadata.brand` should be a string.', rawBrand)
		return ''
	}

	const normalizedBrand = rawBrand.trim()
	return normalizedBrand.length > 0 ? normalizedBrand : ''
}
