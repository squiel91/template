// @ts-nocheck

const runtimeStoreId = Number(globalThis.__TIENDU_STORE_ID__)
const runtimeBaseUrl =
	typeof globalThis.__TIENDU_BASE_URL__ === 'string'
		? globalThis.__TIENDU_BASE_URL__.trim()
		: ''

if (!Number.isFinite(runtimeStoreId) || runtimeStoreId <= 0) {
	throw new Error('[storefront] Missing valid window.__TIENDU_STORE_ID__ runtime config.')
}

if (!runtimeBaseUrl) {
	throw new Error('[storefront] Missing valid window.__TIENDU_BASE_URL__ runtime config.')
}

export const storefrontConfig = {
	storeName: 'Tienda Genérica',
	tagline: 'Vendemos todo lo que necesites. Todo, literal.',
	storeId: Math.floor(runtimeStoreId),
	baseUrl: runtimeBaseUrl.replace(/\/$/, ''),
	homeCategoryIds: [],
	homeListCategoryIds: []
}
