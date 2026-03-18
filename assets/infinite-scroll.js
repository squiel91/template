// @ts-nocheck

const LOADER_SVG =
	'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>'

export const createInfiniteScroll = ({
	container,
	onLoadMore,
	rootMargin = '360px',
	loadingText = 'Cargando más productos...'
}) => {
	if (!(container instanceof HTMLElement)) {
		return {
			start: () => {},
			stop: () => {},
			setDone: () => {}
		}
	}

	let isLoading = false
	let isDone = false

	const sentinel = document.createElement('div')
	sentinel.className = 'infinite-scroll-sentinel'
	sentinel.setAttribute('aria-hidden', 'true')

	const status = document.createElement('div')
	status.className = 'infinite-scroll-status'
	status.setAttribute('aria-live', 'polite')
	status.hidden = true

	const setStatus = ({ loading = false, text = '' }) => {
		if (!loading && !text) {
			status.hidden = true
			status.innerHTML = ''
			return
		}

		status.hidden = false
		status.innerHTML = loading
			? `<span class="infinite-scroll-status__icon">${LOADER_SVG}</span><span>${text}</span>`
			: `<span>${text}</span>`
	}

	const loadMore = async () => {
		if (isLoading || isDone) return
		isLoading = true
		setStatus({ loading: true, text: loadingText })

		try {
			const hasMore = await onLoadMore()
			isDone = hasMore === false
			if (isDone) {
				setStatus({})
				observer.disconnect()
			}
		} catch {
			isDone = true
			setStatus({ text: 'No pudimos cargar más productos.' })
			observer.disconnect()
		} finally {
			isLoading = false
		}
	}

	const observer = new IntersectionObserver(
		entries => {
			if (entries.some(entry => entry.isIntersecting)) {
				void loadMore()
			}
		},
		{ root: null, rootMargin, threshold: 0 }
	)

	const start = () => {
		container.append(sentinel, status)
		observer.observe(sentinel)
	}

	const stop = () => {
		observer.disconnect()
		sentinel.remove()
		status.remove()
	}

	const setDone = done => {
		isDone = Boolean(done)
		if (isDone) {
			setStatus({})
			observer.disconnect()
		}
	}

	return { start, stop, setDone }
}
