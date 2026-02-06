// @ts-nocheck

export const refreshIcons = () => {
	if (window.lucide && typeof window.lucide.createIcons === 'function') {
		window.lucide.createIcons()
	}
}
