// @ts-nocheck

const ORIGIN_URL_PARAM = 'url-origen'
const ORIGIN_TITLE_PARAM = 'titulo-origen'

const isValidOriginUrl = value => {
	if (typeof value !== 'string') return false
	if (!value.startsWith('/')) return false
	return !/^\/\//.test(value)
}

export const getCurrentRelativeUrlWithoutOrigin = () => {
	const current = new URL(window.location.href)
	current.searchParams.delete(ORIGIN_URL_PARAM)
	current.searchParams.delete(ORIGIN_TITLE_PARAM)
	const search = current.searchParams.toString()
	return `${current.pathname}${search ? `?${search}` : ''}`
}

export const withOriginQuery = (targetUrl, origin) => {
	if (!origin || !isValidOriginUrl(origin.url) || !origin.title) return targetUrl

	const url = new URL(targetUrl, window.location.origin)
	url.searchParams.delete(ORIGIN_URL_PARAM)
	url.searchParams.delete(ORIGIN_TITLE_PARAM)
	url.searchParams.set(ORIGIN_URL_PARAM, origin.url)
	url.searchParams.set(ORIGIN_TITLE_PARAM, origin.title)

	const search = url.searchParams.toString()
	return `${url.pathname}${search ? `?${search}` : ''}`
}

export const getOriginFromCurrentUrl = () => {
	const current = new URL(window.location.href)
	const originUrl = current.searchParams.get(ORIGIN_URL_PARAM)
	const originTitle = current.searchParams.get(ORIGIN_TITLE_PARAM)

	if (!isValidOriginUrl(originUrl) || !originTitle) return null

	return {
		url: originUrl,
		title: originTitle
	}
}
