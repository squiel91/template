// @ts-nocheck

import {
	PUBLIC_TIENDU_API_BASE_URL,
	PUBLIC_TIENDU_STORE_ID,
	PUBLIC_TIENDU_HOME_CATEGORY_IDS,
	PUBLIC_TIENDU_HOME_LIST_CATEGORY_IDS,
	PUBLIC_TIENDU_HOME_HERO_METADATA_KEY
} from '/tiendu.config.js'

const homeCategoryIds = Array.isArray(PUBLIC_TIENDU_HOME_CATEGORY_IDS)
	? PUBLIC_TIENDU_HOME_CATEGORY_IDS
			.map(value => Number(value))
			.filter(value => Number.isFinite(value) && value > 0)
	: []

const homeListCategoryIds = Array.isArray(PUBLIC_TIENDU_HOME_LIST_CATEGORY_IDS)
	? PUBLIC_TIENDU_HOME_LIST_CATEGORY_IDS
			.map(value => Number(value))
			.filter(value => Number.isFinite(value) && value > 0)
	: []

export const storefrontConfig = {
	storeName: 'Santu Market',
	tagline: 'Cada compra sostiene una vida rescatada.',
	storeId: PUBLIC_TIENDU_STORE_ID,
	baseUrl: PUBLIC_TIENDU_API_BASE_URL,
	homeCategoryIds,
	homeListCategoryIds,
	homeHeroMetadataKey:
		typeof PUBLIC_TIENDU_HOME_HERO_METADATA_KEY === 'string' &&
		PUBLIC_TIENDU_HOME_HERO_METADATA_KEY.trim()
			? PUBLIC_TIENDU_HOME_HERO_METADATA_KEY.trim()
			: 'home-hero-carousel'
}
