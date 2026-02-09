// @ts-nocheck

export const PAGE_READY_EVENT = 'tiendu:page-ready'
const PAGE_READY_STATE_KEY = '__tienduPageReady__'

if (window[PAGE_READY_STATE_KEY] !== true) {
	window[PAGE_READY_STATE_KEY] = false
}

let hasMarkedReady = window[PAGE_READY_STATE_KEY] === true

export const isPageReady = () => window[PAGE_READY_STATE_KEY] === true

export const markPageReady = () => {
	if (hasMarkedReady) return
	hasMarkedReady = true
	window[PAGE_READY_STATE_KEY] = true
	window.dispatchEvent(new CustomEvent(PAGE_READY_EVENT))
}

export const withPageLoading = async task => {
	try {
		return await task()
	} finally {
		markPageReady()
	}
}
