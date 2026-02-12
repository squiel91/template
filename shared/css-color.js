// @ts-nocheck

export const toSafeCssColor = value => {
	const color = String(value || '').trim()
	if (!color) return null
	if (/^#([0-9a-fA-F]{3,8})$/.test(color)) return color
	if (/^[a-zA-Z]+$/.test(color)) return color
	return null
}
