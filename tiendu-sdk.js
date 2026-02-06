// @ts-nocheck
const SHOPPER_SESSION_TOKEN_LOCAL_STORAGE_KEY = 'shopper_session_token'
const SHOPPER_SESSION_TOKEN_HEADER = 'X-shopper-session-token'

/**
	* @typedef {Object} PublicImage
	* @property {number} id
	* @property {string} url
	* @property {string | null} alt
 * @property {boolean} hasTransparency
 * @property {number} height
 * @property {number} width
 * @property {number} storeId
 * @property {number} userId
 * @property {string} updatedAt
	* @property {string} createdAt
	*/

/**
	* @typedef {Object} AttributeValue
	* @property {number} id
	* @property {number} attributeId
	* @property {string} value
	* @property {number} position
	* @property {PublicImage | null} image
	* @property {string | null} color
	* @property {string | null} note
	* @property {string} updatedAt
	* @property {string} createdAt
	*/

/**
	* @typedef {Object} ProductAttribute
	* @property {number} id
	* @property {number} storeId
	* @property {string} name
	* @property {'radio' | 'dropdown'} displayType
	* @property {Array<AttributeValue>} values
	* @property {string | null} metaBusinessFieldMapping
	* @property {string} updatedAt
	* @property {string} createdAt
	*/

/**
	* @typedef {Object} ProductVariant
	* @property {number} id
	* @property {number} productId
	* @property {number | null} priceInCents
 * @property {number | null} weightInGrams
 * @property {number | null} compareAtPriceInCents
 * @property {number | null} stock
 * @property {string | null} sku
 * @property {boolean} isListed
	* @property {PublicImage | null} coverImage
	* @property {Array<ProductAttribute>} attributes
	*/

/**
	* @typedef {Object} ProductListing
	* @property {number} id
	* @property {string} title
	* @property {number | null} basePriceInCents
	* @property {PublicImage | null} coverImage
	* @property {boolean} isPhysical
	* @property {number} reviewsQuantity
	* @property {number | null} averageRating
	* @property {Array<{ name: string; value: string }> | null} specifications
	* @property {string | null} videoUrl
	* @property {Array<ProductAttribute>} attributes
	* @property {number} unitsSold
	* @property {Array<ProductVariant>} variants
	* @property {string} publicUrl
	* @property {string} updatedAt
	*/

/**
	* @typedef {Object} Product
 * @property {number} id
 * @property {string} title
 * @property {number | null} basePriceInCents
	* @property {Array<PublicImage> | null} images
	* @property {string | null} description
	* @property {Array<{ name: string; value: string }> | null} specifications
	* @property {string | null} videoUrl
	* @property {boolean} isPhysical
	* @property {Array<unknown>} reviews
	* @property {number} reviewsQuantity
	* @property {number | null} averageRating
	* @property {Array<ProductAttribute>} attributes
	* @property {Array<ProductVariant>} variants
	* @property {string} publicUrl
	* @property {number} unitsSold
	* @property {string} updatedAt
 */

/**
 * @typedef {Object} Category
	* @property {number} id
	* @property {string} name
	* @property {string | null} description
	* @property {number} productCount
	* @property {PublicImage | null} coverImage
	* @property {string} publicUrl
	* @property {Array<Category>} children
	*/

/**
	* @typedef {Object} PageListing
	* @property {number} id
	* @property {string | null} title
	* @property {PublicImage | null} coverImage
	* @property {string} publicUrl
	*/

/**
	* @typedef {Object} PageBlock
	* @property {'heading' | 'paragraph' | 'image' | 'html'} type
	* @property {number=} level
	* @property {string=} text
	* @property {'small' | 'medium' | 'large' | 'full'}= size
	* @property {'left' | 'center' | 'right'}= align
	* @property {PublicImage=} image
	* @property {string=} code
	*/

/**
 * @typedef {Object} Page
	* @property {number} id
	* @property {string | null} title
	* @property {Array<PageBlock>} content
	* @property {PublicImage | null} coverImage
	* @property {string} publicUrl
	*/

/**
	* @typedef {Object} PaginatedProductsResponse
	* @property {{ includeProductsFromSubcategories: boolean }} filters
	* @property {Array<ProductListing>} data
	* @property {{ total: number; page: number; size: number }} pagination
	* @property {{ criteria?: string; order?: string }} sort
	*/

const trackMetaAddToCart = () => {}
const trackMetaInitiateCheckout = () => {}
const trackMetaPurchase = () => {}

	const up = baseFetch => {
	const buildUrl = (url, queryParams) => {
		if (!queryParams) return url
		const resolved = new URL(url, window.location.origin)
		Object.entries(queryParams).forEach(([key, value]) => {
			if (value === undefined || value === null) return
			resolved.searchParams.set(key, String(value))
		})
		return resolved.toString()
	}
	const request = async (url, options = {}) => {
		const { queryParams, ...fetchOptions } = options
		const finalUrl = buildUrl(url, queryParams)
		const response = await baseFetch(finalUrl, fetchOptions)
		if (!response.ok) {
			throw new Error(`Request failed: ${response.status}`)
		}
		return response.json()
	}

	return {
		get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
		post: (url, body, options = {}) =>
			request(url, {
				...options,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(options.headers || {})
				},
				body: JSON.stringify(body)
			})
	}
}

export const Tiendu = ({ storeId, baseUrl, fetch: customFetch }) => {
	const upFetch = up(customFetch || fetch)
	const baseApiUrl = `${baseUrl}/api/stores/${storeId}`

	const methods = {
		shoppers: {
			getToken: async () => {
				return localStorage.getItem(SHOPPER_SESSION_TOKEN_LOCAL_STORAGE_KEY)
			},
			setToken: token => {
				localStorage.setItem(SHOPPER_SESSION_TOKEN_LOCAL_STORAGE_KEY, token)
			},
			deleteToken: () => {
				localStorage.removeItem(SHOPPER_SESSION_TOKEN_LOCAL_STORAGE_KEY)
			}
		},
		products: {
			/**
			 * @param {{
			 *   search?: string | null
			 *   isFeatured?: boolean
			 *   page?: number
			 *   size?: number
			 *   categoryId?: number
			 *   includeProductsFromSubcategories?: boolean
			 * }=} options
			 * @returns {Promise<PaginatedProductsResponse>}
			 */
			list: async (options = {}) => {
				const response = await upFetch.get(`${baseApiUrl}/products`, {
					queryParams: {
						...(options.search ? { q: options.search } : {}),
						...(options.isFeatured ? { isFeatured: 'true' } : {}),
						...(options.categoryId
							? { categoryId: options.categoryId.toString() }
							: {}),
						...(options.includeProductsFromSubcategories
							? { includeProductsFromSubcategories: 'true' }
							: {}),
						...(options.page ? { page: options.page.toString() } : { page: '1' }),
						...(options.size ? { size: options.size.toString() } : { size: '100' })
					}
				})
				return response
			},
			/** @param {number} productId @returns {Promise<Product>} */
			get: async productId => {
				const response = await upFetch.get(`${baseApiUrl}/products/${productId}`)
				return response?.data ?? response
			},
			/** @param {number} productId @returns {Promise<Array<ProductListing>>} */
			getRelated: async productId => {
				const response = await upFetch.get(
					`${baseApiUrl}/products/${productId}/related`
				)
				return response?.data ?? response
			}
		},
		categories: {
			/** @returns {Promise<Array<Category>>} */
			list: async () => {
				const response = await upFetch.get(`${baseApiUrl}/categories`)
				return response?.data ?? response
			},
			/** @param {number} categoryId @returns {Promise<Category>} */
			get: async categoryId => {
				const response = await upFetch.get(`${baseApiUrl}/categories/${categoryId}`)
				return response?.data ?? response
			}
		},
		pages: {
			/** @returns {Promise<Array<PageListing>>} */
			list: async () => {
				const response = await upFetch.get(`${baseApiUrl}/pages`)
				return response?.data ?? response
			},
			/** @param {number} pageId @returns {Promise<Page>} */
			get: async pageId => {
				const response = await upFetch.get(`${baseApiUrl}/pages/${pageId}`)
				return response?.data ?? response
			}
		},
		cart: {
			addProductVariant: async (productVariant, quantity, onClose) => {
				const shopperSessionToken = await methods.shoppers.getToken()

				const response = await upFetch.post(
					`${baseApiUrl}/cart/products/variants/${productVariant.id}`,
					{ quantity },
					{
						headers: shopperSessionToken
							? { [SHOPPER_SESSION_TOKEN_HEADER]: shopperSessionToken }
							: undefined
					}
				)
				const token = response?.data?.token ?? response?.token
				if (token) methods.shoppers.setToken(token)
				methods.cart.open(onClose)

				trackMetaAddToCart(productVariant, quantity)
			},
			getQuantity: async () => {
				const shopperSessionToken = await methods.shoppers.getToken()
				if (!shopperSessionToken) {
					return { quantity: 0 }
				}
				const response = await upFetch.get(`${baseApiUrl}/cart/quantity`, {
					headers: { [SHOPPER_SESSION_TOKEN_HEADER]: shopperSessionToken }
				})

				return {
					quantity: response?.data?.quantity ?? response?.quantity ?? 0
				}
			},
			open: async onClose => {
				const shopperSessionToken = await methods.shoppers.getToken()

				const iframe = document.createElement('iframe')
				iframe.src = `${baseUrl}/stores/${storeId}/embedded-checkout`
				iframe.id = 'left-iframe'
				let hasSentToken = false
				let isIframeReady = false
				const sendTokenToIframe = () => {
					if (hasSentToken) return
					if (!iframe.contentWindow) {
						return
					}
					iframe.contentWindow.postMessage(
						{
							type: 'SHOPPER_SESSION_TOKEN',
							token: shopperSessionToken || null
						},
						baseUrl
					)
					hasSentToken = true
					window.removeEventListener('message', handleIframeReady)
				}
				const handleIframeReady = event => {
					if (event.data && event.data.type === 'IFRAME_READY') {
						isIframeReady = true
						sendTokenToIframe()
					}
				}

				window.addEventListener('message', handleIframeReady)

				iframe.style.position = 'fixed'
				iframe.style.top = '0'
				iframe.style.left = '0'
				iframe.style.width = '100%'
				iframe.style.height = '100%'
				iframe.style.zIndex = '9999'
				iframe.style.border = 'none'

				function closeIframe() {
					if (iframe.parentNode) {
						iframe.parentNode.removeChild(iframe)
					}
				}

				iframe.onload = () => {
					if (isIframeReady) {
						sendTokenToIframe()
					}
				}

				window.addEventListener('message', event => {
					if (event.data?.type === 'close') {
						if (onClose && typeof event.data.updatedCartItemsQuantity === 'number') {
							onClose({
								updatedCartItemsQuantity: event.data.updatedCartItemsQuantity
							})
						}
						closeIframe()
					} else if (event.data?.type === 'step-changed') {
						if (
							!(
								'totalPriceInCents' in event.data &&
								typeof event.data.totalPriceInCents === 'number'
							) ||
							!(
								'items' in event.data &&
								Array.isArray(event.data.items)
							)
						) {
							console.error('Invalid event data', event.data)
							return
						}
						const { totalPriceInCents, items } = event.data
						if (event.data.step === 'delivery') {
							trackMetaInitiateCheckout(totalPriceInCents, items)
						} else if (event.data.step === 'success') {
							trackMetaPurchase(totalPriceInCents, items)
						}
					}
				})

				document.body.appendChild(iframe)

				return iframe
			}
		}
	}

	return methods
}
