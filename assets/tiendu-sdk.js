// @ts-nocheck
import {
	trackAddToCartEvent,
	trackBeginCheckoutEvent,
	trackPurchaseEvent,
	trackSearchEvent,
	trackViewContentEvent
} from '/assets/tracking.js'

// The shopper session is managed via HttpOnly cookies (same-origin).
// No localStorage token or custom headers needed.

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
	* @typedef {Object} ProductReview
	* @property {number} id
	* @property {string} authorName
	* @property {number} rating
	* @property {boolean} isVerifiedPurchase
	* @property {string} content
	* @property {Array<PublicImage>} images
	*/

/**
	* @typedef {Object} StoreReview
	* @property {number} id
	* @property {number} productId
	* @property {string} authorName
	* @property {number} rating
	* @property {boolean} isVerifiedPurchase
	* @property {string} content
	* @property {Array<PublicImage>} images
	* @property {string} updatedAt
	* @property {string} createdAt
	*/

/**
	* @typedef {StoreReview & { product: ProductListing | null }} HydratedStoreReview
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
	* @property {string} url
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
	* @property {Array<ProductReview>} reviews
	* @property {number} reviewsQuantity
	* @property {number | null} averageRating
	* @property {Array<ProductAttribute>} attributes
	* @property {Array<ProductVariant>} variants
	* @property {string} url
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
	* @property {string} url
	* @property {string} publicUrl
	* @property {Array<Category>} children
	*/

/**
	* @typedef {Object} PageListing
	* @property {number} id
	* @property {string | null} title
	* @property {PublicImage | null} coverImage
	* @property {string} url
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
	* @property {string} url
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
	* @property {string} url
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
	* @property {string} url
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
	* @property {{ search?: string; categoryId?: number; includeProductsFromSubcategories?: boolean; ids?: number[] }} filters
	* @property {Array<ProductListing>} data
	* @property {{ total: number; page: number; size: number }} pagination
	* @property {{ criteria?: 'name' | 'created' | 'updated' | 'sales' | 'price'; order?: 'asc' | 'desc' }} sort
	*/

/**
	* @typedef {Object} PaginatedReviewsResponse
	* @property {{ productId?: number }} filters
	* @property {Array<HydratedStoreReview>} data
	* @property {{ total: number; page: number; size: number }} pagination
	* @property {{ criteria?: 'rating' | 'createdAt' | 'updatedAt'; order?: 'asc' | 'desc' }} sort
	*/

let activeCartOverlayCleanup = null

const up = baseFetch => {
	const buildUrl = (url, queryParams) => {
		if (!queryParams) return url
		const resolved = new URL(url, window.location.origin)
		Object.entries(queryParams).forEach(([key, value]) => {
			if (value === undefined || value === null) return
			if (Array.isArray(value)) {
				for (const item of value) {
					if (item === undefined || item === null) continue
					resolved.searchParams.append(key, String(item))
				}
				return
			}
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

export const Tiendu = () => {
	const upFetch = up(fetch)
	const baseApiUrl = `/api`

	const methods = {
		products: {
			/**
			 * @param {{
			 *   search?: string | null
			 *   ids?: number[]
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
						...(Array.isArray(options.ids) && options.ids.length > 0
							? { id: options.ids }
							: {}),
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
		reviews: {
			/**
			 * @param {{
			 *   productId?: number
			 *   page?: number
			 *   size?: number
			 *   criteria?: 'rating' | 'createdAt' | 'updatedAt'
			 *   order?: 'asc' | 'desc'
			 * }=} options
			 * @returns {Promise<PaginatedReviewsResponse>}
			 */
			list: async (options = {}) => {
				const validCriteria = ['rating', 'createdAt', 'updatedAt']
				const validOrder = ['asc', 'desc']
				const criteria = validCriteria.includes(options.criteria)
					? options.criteria
					: null
				const order = validOrder.includes(options.order) ? options.order : null

				const response = await upFetch.get(`${baseApiUrl}/reviews`, {
					queryParams: {
						...(options.productId
							? { productId: options.productId.toString() }
							: {}),
						...(criteria ? { criteria } : {}),
						...(order ? { order } : {}),
						...(options.page ? { page: options.page.toString() } : { page: '1' }),
						...(options.size ? { size: options.size.toString() } : { size: '100' })
					}
				})

				const productIds = [
					...new Set(
						(response?.data ?? [])
							.map(review => review?.productId)
							.filter(productId => Number.isInteger(productId) && productId > 0)
					)
				]

				if (productIds.length === 0) {
					return {
						...response,
						data: (response?.data ?? []).map(review => ({
							...review,
							product: null
						}))
					}
				}

				const productsResponse = await methods.products.list({
					ids: productIds,
					page: 1,
					size: productIds.length
				})
				const productsById = new Map(
					(productsResponse?.data ?? []).map(product => [product.id, product])
				)

				return {
					...response,
					data: (response?.data ?? []).map(review => ({
						...review,
						product: productsById.get(review.productId) ?? null
					}))
				}
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
					query,
					source,
					resultsCount
				})
			},
			trackViewContent: ({ productId, productTitle, productVariantId, priceInCents, currency } = {}) => {
				trackViewContentEvent({
					productId,
					productTitle,
					productVariantId,
					priceInCents,
					currency
				})
			}
		},
		cart: {
			addProductVariant: async (productVariant, quantity, onClose) => {
				await upFetch.post(
					`/api/cart/products/variants/${productVariant.id}`,
					{ quantity }
				)
				methods.cart.open(onClose)

				trackAddToCartEvent({
					productVariantId: productVariant?.id,
					quantity,
					priceInCents: productVariant?.priceInCents
				})
			},
			getQuantity: async () => {
				const response = await upFetch.get(`/api/cart/quantity`)

				return {
					quantity: response?.data?.quantity ?? response?.quantity ?? 0
				}
			},
			open: async onClose => {
				let hasTrackedBeginCheckout = false

				if (typeof activeCartOverlayCleanup === 'function') {
					activeCartOverlayCleanup()
					activeCartOverlayCleanup = null
				}

				const iframe = document.createElement('iframe')
				iframe.src = `/checkout`
				iframe.id = 'left-iframe'
				let isClosed = false

				const isTrustedIframeMessage = event => {
					if (event.origin !== window.location.origin) return false
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

				const handleIframeMessage = event => {
					if (!isTrustedIframeMessage(event)) return

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
							totalPriceInCents,
							items,
							currency: normalizedCurrencyCode
						})
					}

					if (event.data.step === 'success') {
						trackPurchaseEvent({
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

				document.body.appendChild(iframe)

				return iframe
			}
		}
	}

	return methods
}
