// @ts-nocheck
import {
	trackAddToCartEvent,
	trackBeginCheckoutEvent,
	trackPurchaseEvent,
	trackSearchEvent
} from '/shared/tracking.js'

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
	* @typedef {Object} PublicUser
	* @property {string} name
	*/

/**
	* @typedef {Object} BlogPostListing
	* @property {number} id
	* @property {string} title
	* @property {string | null} excerpt
	* @property {PublicImage | null} coverImage
	* @property {PublicUser} manager
	* @property {string} publicUrl
	* @property {string} createdAt
	* @property {string} updatedAt
	*/

/**
	* @typedef {Object} BlogPost
	* @property {number} id
	* @property {string} title
	* @property {string | null} excerpt
	* @property {PublicImage | null} coverImage
	* @property {PublicUser} manager
	* @property {string} publicUrl
	* @property {string} createdAt
	* @property {string} updatedAt
	* @property {Array<{
	*   type: 'heading',
	*   level: 1 | 2 | 3,
	*   text: string
	* } | {
	*   type: 'paragraph',
	*   text: string
	* } | {
	*   type: 'image',
	*   image: PublicImage,
	*   size: 'small' | 'medium' | 'large' | 'full',
	*   align: 'left' | 'center' | 'right'
	* } | {
	*   type: 'html',
	*   code: string
	* }>} content
	*/

/**
	* @typedef {{ success: true } | {
	*   success: false,
	*   errorCode: 'INVALID_EMAIL' | 'EXISTING_SUBSCRIBER' | 'INTERNAL_ERROR'
	* }} SubscriberAddResult
	*/

/**
	* @typedef {Object} PaginatedProductsResponse
	* @property {{ includeProductsFromSubcategories: boolean }} filters
	* @property {Array<ProductListing>} data
	* @property {{ total: number; page: number; size: number }} pagination
	* @property {{ criteria?: 'name' | 'created' | 'updated' | 'sales' | 'price'; order?: 'asc' | 'desc' }} sort
	*/

let activeCartOverlayCleanup = null

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
		console.log('[SDK] Request:', finalUrl)
		try {
			const response = await baseFetch(finalUrl, fetchOptions)
			if (!response.ok) {
				console.error('[SDK] Request failed:', response.status, finalUrl)
				throw new Error(`Request failed: ${response.status}`)
			}
			const data = await response.json()
			console.log('[SDK] Response:', finalUrl, data)
			return data
		} catch (err) {
			console.error('[SDK] Request error:', finalUrl, err)
			throw err
		}
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
			 *   criteria?: 'name' | 'created' | 'updated' | 'sales' | 'price'
			 *   order?: 'asc' | 'desc'
			 * }=} options
			 * @returns {Promise<PaginatedProductsResponse>}
			 */
			list: async (options = {}) => {
				const validCriteria = ['name', 'created', 'updated', 'sales', 'price']
				const validOrder = ['asc', 'desc']
				const criteria = validCriteria.includes(options.criteria) ? options.criteria : null
				const order = validOrder.includes(options.order) ? options.order : null

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
						...(criteria ? { criteria } : {}),
						...(order ? { order } : {}),
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
		subscribers: {
			/** @param {string} email @returns {Promise<SubscriberAddResult>} */
			add: async email => {
				const response = await upFetch.post(`${baseApiUrl}/subscribers`, { email })
				return response?.data ?? response
			}
		},
		images: {
			/** @param {number} imageId @returns {Promise<PublicImage>} */
			get: async imageId => {
				const response = await upFetch.get(`${baseApiUrl}/images/${imageId}`)
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
		blogPosts: {
			/** @returns {Promise<Array<BlogPostListing>>} */
			list: async () => {
				const response = await upFetch.get(`${baseApiUrl}/blog-posts`)
				return response?.data ?? response
			},
			/** @param {number} blogPostId @returns {Promise<BlogPost>} */
			get: async blogPostId => {
				const response = await upFetch.get(`${baseApiUrl}/blog-posts/${blogPostId}`)
				return response?.data ?? response
			}
		},
		analytics: {
			trackSearch: ({ query, source, resultsCount } = {}) => {
				trackSearchEvent({
					storeId,
					baseUrl,
					query,
					source,
					resultsCount
				})
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

				trackAddToCartEvent({
					storeId,
					baseUrl,
					productVariantId: productVariant?.id,
					quantity,
					priceInCents: productVariant?.priceInCents
				})
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
				const checkoutOrigin = new URL(baseUrl, window.location.href).origin
				let hasTrackedBeginCheckout = false

				if (typeof activeCartOverlayCleanup === 'function') {
					activeCartOverlayCleanup()
					activeCartOverlayCleanup = null
				}

				const iframe = document.createElement('iframe')
				iframe.src = `${baseUrl}/stores/${storeId}/embedded-checkout`
				iframe.id = 'left-iframe'
				let hasSentToken = false
				let isIframeReady = false
				let isClosed = false

				const isTrustedIframeMessage = event => {
					if (event.origin !== checkoutOrigin) return false
					return iframe.contentWindow && event.source === iframe.contentWindow
				}

				const cleanup = () => {
					if (isClosed) return
					isClosed = true
					window.removeEventListener('message', handleIframeMessage)
					iframe.onload = null
					if (iframe.parentNode) {
						iframe.parentNode.removeChild(iframe)
					}
					if (activeCartOverlayCleanup === cleanup) {
						activeCartOverlayCleanup = null
					}
				}

				activeCartOverlayCleanup = cleanup

				const sendTokenToIframe = () => {
					if (isClosed) return
					if (hasSentToken) return
					if (!iframe.contentWindow) {
						return
					}
					iframe.contentWindow.postMessage(
						{
							type: 'SHOPPER_SESSION_TOKEN',
							token: shopperSessionToken || null
						},
						checkoutOrigin
					)
					hasSentToken = true
				}

				const handleIframeMessage = event => {
					if (!isTrustedIframeMessage(event)) return
					if (event.data?.type === 'IFRAME_READY') {
						isIframeReady = true
						sendTokenToIframe()
						return
					}

					if (event.data?.type === 'close') {
						if (onClose && typeof event.data.updatedCartItemsQuantity === 'number') {
							onClose({
								updatedCartItemsQuantity: event.data.updatedCartItemsQuantity
							})
						}
						cleanup()
						return
					}

					if (event.data?.type !== 'step-changed') return
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
					const normalizedCurrencyCode =
						typeof event.data.currencyCode === 'string' &&
						event.data.currencyCode.trim() !== ''
							? event.data.currencyCode.trim().toUpperCase()
							: 'UYU'

					const checkoutStartedSteps = new Set([
						'delivery',
						'contact',
						'summary',
						'payment-options',
						'payment'
					])

					if (!hasTrackedBeginCheckout && checkoutStartedSteps.has(event.data.step)) {
						hasTrackedBeginCheckout = true
						trackBeginCheckoutEvent({
							storeId,
							baseUrl,
							totalPriceInCents,
							items,
							currency: normalizedCurrencyCode
						})
					}

					if (event.data.step === 'success') {
						trackPurchaseEvent({
							storeId,
							baseUrl,
							totalPriceInCents,
							items,
							currency: normalizedCurrencyCode,
							orderId: event.data.orderId,
							paymentExternalReference: event.data.paymentExternalReference
						})
					}
				}

				window.addEventListener('message', handleIframeMessage)

				iframe.style.position = 'fixed'
				iframe.style.top = '0'
				iframe.style.left = '0'
				iframe.style.width = '100%'
				iframe.style.height = '100%'
				iframe.style.zIndex = '9999'
				iframe.style.border = 'none'

				iframe.onload = () => {
					if (isClosed) return
					if (isIframeReady) {
						sendTokenToIframe()
					}
				}

				document.body.appendChild(iframe)

				return iframe
			}
		}
	}

	return methods
}
