// @ts-nocheck

const getMetaContent = (name, fallback = '') => {
	const node = document.querySelector(`meta[name="${name}"]`)
	const value = node?.getAttribute('content')
	if (!value) return fallback
	return value
}

const resolveApiBaseUrl = () => {
	const configured = getMetaContent('tiendu-api-base-url', '')
	if (configured) return configured

	const { protocol, hostname, port } = window.location
	if (hostname.endsWith('.localhost')) {
		const normalizedPort = port ? `:${port}` : ''
		return `${protocol}//localhost${normalizedPort}`
	}

	return window.location.origin
}

const parsedStoreId = Number(getMetaContent('tiendu-store-id', '4'))

export const storefrontConfig = {
	storeName: 'Tienda Genérica',
	tagline: 'Vendemos todo lo que necesites. Todo, literal.',
	storeId: Number.isFinite(parsedStoreId) && parsedStoreId > 0 ? parsedStoreId : 4,
	baseUrl: resolveApiBaseUrl()
}
