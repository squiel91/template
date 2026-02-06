// @ts-nocheck

// @ts-ignore - served at runtime from storefront root
import { Tiendu } from '/tiendu-sdk.js'
import { storefrontConfig } from '/shared/storefront-config.js'

export const tiendu = Tiendu({
	storeId: storefrontConfig.storeId,
	baseUrl: storefrontConfig.baseUrl
})
