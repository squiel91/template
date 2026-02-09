// @ts-nocheck

import {
	PUBLIC_TIENDU_API_BASE_URL,
	PUBLIC_TIENDU_STORE_ID,
	PUBLIC_TIENDU_HOME_CATEGORY_IDS
} from '/tiendu.config.js'

const homeCategoryIds = Array.isArray(PUBLIC_TIENDU_HOME_CATEGORY_IDS)
	? PUBLIC_TIENDU_HOME_CATEGORY_IDS
			.map(value => Number(value))
			.filter(value => Number.isFinite(value) && value > 0)
	: []

export const storefrontConfig = {
	storeName: 'Tienda Genérica',
	tagline: 'Vendemos todo lo que necesites. Todo, literal.',
	storeId: PUBLIC_TIENDU_STORE_ID,
	baseUrl: PUBLIC_TIENDU_API_BASE_URL,
	homeCategoryIds
}
