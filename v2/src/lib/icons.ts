import type { Skin } from './appearance.svelte';

/**
 * The icon set, as path data. Two maps, because the two kinds of icon answer to different
 * owners.
 *
 * CHROME glyphs belong to the OS, so they are skin-owned: one path per skin, drawn on a
 * 24-unit grid, stroked in `currentColor` with the width, cap, and join coming from the skin's
 * `--icon-*` tokens. Nothing here is filled. A skin that wants a solid shape closes the path
 * and lives with an outline, which is cheaper than teaching every glyph a paint mode.
 *
 * BRAND marks belong to somebody else, so they get exactly one variant and keep the grid they
 * were drawn on. They are filled, because a logo stroked at 1px stops being the logo.
 *
 * Both maps are consumed only by `components/Icon.svelte`. The old site had a 31-line Svelte
 * component per icon and no variants at all.
 */

/** Every chrome glyph defines every skin. A missing variant is a type error, not a fallback. */
export const CHROME = {
	folder: {
		modern:
			'M3 17.5V6.5A1.5 1.5 0 0 1 4.5 5h4.1a1.5 1.5 0 0 1 1.2.6L11 7.5h8.5A1.5 1.5 0 0 1 21 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z',
		retro: 'M2.5 19.5V5.5h6l2 2h11v12zM2.5 7.5h8',
		glass:
			'M2.5 8.5a3 3 0 0 1 3-3h3.2a3 3 0 0 1 2.5 1.4l.8 1.1h6.5a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-13a3 3 0 0 1-3-3Z'
	},
	'folder-open': {
		modern:
			'M3 17.5V6.5A1.5 1.5 0 0 1 4.5 5h4.1a1.5 1.5 0 0 1 1.2.6L11 7.5h8.5A1.5 1.5 0 0 1 21 9v1.5M3 17.5 5.6 11.4A1.5 1.5 0 0 1 7 10.5h13.5a1.5 1.5 0 0 1 1.4 2l-1.7 5a2 2 0 0 1-1.9 1.5H4.5A1.5 1.5 0 0 1 3 17.5Z',
		retro: 'M2.5 19.5V5.5h6l2 2h11v3M2.5 19.5 5.5 10.5h16l-3 9z',
		glass:
			'M2.5 17V8.5a3 3 0 0 1 3-3h3.2a3 3 0 0 1 2.5 1.4l.8 1.1h6.5a3 3 0 0 1 3 3v1.5M2.5 17.5 5.3 11.9A2.5 2.5 0 0 1 7.5 10.5h12.4a2.5 2.5 0 0 1 2.3 3.4l-1.6 4.4a3 3 0 0 1-2.8 2H5.5a3 3 0 0 1-3-3Z'
	},
	document: {
		modern:
			'M13.5 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8.5L13.5 3ZM13.5 3v4A1.5 1.5 0 0 0 15 8.5h4M8.5 12.5h7M8.5 16h4.5',
		retro: 'M5.5 20.5V3.5h8l5 5v12zM13.5 3.5v5h5M8.5 12.5h7M8.5 15.5h4',
		glass:
			'M13.5 2.5H7A2.5 2.5 0 0 0 4.5 5v14A2.5 2.5 0 0 0 7 21.5h10a2.5 2.5 0 0 0 2.5-2.5V8.5l-6-6ZM13.5 2.5V6A2.5 2.5 0 0 0 16 8.5h3.5M8.5 13h7M8.5 16.5h4.5'
	},
	'document-open': {
		modern:
			'M12 6.6C10.4 5.3 8.3 4.5 6 4.5H3.8A1.3 1.3 0 0 0 2.5 5.8v10.9a1.3 1.3 0 0 0 1.3 1.3H6c2.3 0 4.4.8 6 2.1 1.6-1.3 3.7-2.1 6-2.1h2.2a1.3 1.3 0 0 0 1.3-1.3V5.8a1.3 1.3 0 0 0-1.3-1.3H18c-2.3 0-4.4.8-6 2.1ZM12 6.6v13.5',
		retro: 'M2.5 4.5h4l5.5 2 5.5-2h4v13h-4l-5.5 2-5.5-2h-4zM12 6.5v13',
		glass:
			'M12 7c-1.7-1.5-4-2.3-6.4-2.3H4a1.5 1.5 0 0 0-1.5 1.5v10.3A1.5 1.5 0 0 0 4 18h1.6c2.4 0 4.7.8 6.4 2.3 1.7-1.5 4-2.3 6.4-2.3H20a1.5 1.5 0 0 0 1.5-1.5V6.2A1.5 1.5 0 0 0 20 4.7h-1.6c-2.4 0-4.7.8-6.4 2.3ZM12 7v13.3'
	},
	// System 7's close box was a plain square and its collapse box was a square with a bar. That
	// is authentic and, more usefully, it is the pair that stays distinguishable at 12px.
	close: {
		modern: 'M6 6 18 18M18 6 6 18',
		retro: 'M4.5 4.5h15v15h-15z',
		glass: 'M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5'
	},
	minimize: {
		modern: 'M5 12h14',
		retro: 'M4.5 4.5h15v15h-15zM4.5 9.5h15',
		glass: 'M6.5 12h11'
	},
	// Points right. Rotate with a transform at the call site; four glyphs for four angles is how
	// an icon set gets to 24 entries.
	chevron: {
		modern: 'M9 5.5 15.5 12 9 18.5',
		retro: 'M9.5 5.5 16.5 12l-7 6.5z',
		glass: 'M9.5 5.5 16 12l-6.5 6.5'
	},
	apps: {
		modern: 'M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z',
		retro:
			'M4.5 4.5h4v4h-4zM10 4.5h4v4h-4zM15.5 4.5h4v4h-4zM4.5 10h4v4h-4zM10 10h4v4h-4zM15.5 10h4v4h-4zM4.5 15.5h4v4h-4zM10 15.5h4v4h-4zM15.5 15.5h4v4h-4z',
		glass:
			'M7.5 4.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM16.5 4.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM7.5 13.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM16.5 13.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'
	},
	// The four folder views, drawn as the thing each one produces rather than as an abstraction:
	// a field of tiles, stacked rows, side-by-side panes, one large pane over a filmstrip. That
	// is what makes them readable at 16px with no label, which is how Finder gets away with it.
	'view-icon': {
		modern: 'M5.5 5.5h5v5h-5zM13.5 5.5h5v5h-5zM5.5 13.5h5v5h-5zM13.5 13.5h5v5h-5z',
		retro: 'M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z',
		glass:
			'M7 5.5h2a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5h-2a1.5 1.5 0 0 1-1.5-1.5v-2a1.5 1.5 0 0 1 1.5-1.5zM15 5.5h2a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5h-2a1.5 1.5 0 0 1-1.5-1.5v-2a1.5 1.5 0 0 1 1.5-1.5zM7 13.5h2a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5h-2a1.5 1.5 0 0 1-1.5-1.5v-2a1.5 1.5 0 0 1 1.5-1.5zM15 13.5h2a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5h-2a1.5 1.5 0 0 1-1.5-1.5v-2a1.5 1.5 0 0 1 1.5-1.5z'
	},
	'view-list': {
		modern: 'M4.5 7.5h1.5M9 7.5h10.5M4.5 12h1.5M9 12h10.5M4.5 16.5h1.5M9 16.5h10.5',
		retro: 'M4.5 6.5h2v2h-2zM8.5 7.5h11M4.5 11h2v2h-2zM8.5 12h11M4.5 15.5h2v2h-2zM8.5 16.5h11',
		glass: 'M5 7.5h2M10 7.5h9M5 12h2M10 12h9M5 16.5h2M10 16.5h9'
	},
	'view-column': {
		modern: 'M4.5 5.5h15v13h-15zM9.5 5.5v13M14.5 5.5v13',
		retro: 'M3.5 4.5h17v15h-17zM9 4.5v15M15 4.5v15',
		glass:
			'M6 5.5h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2zM9.5 6v12M14.5 6v12'
	},
	'view-gallery': {
		modern: 'M4.5 4.5h15v10h-15zM4.5 17.5h4v3h-4zM10 17.5h4v3h-4zM15.5 17.5h4v3h-4z',
		retro: 'M3.5 3.5h17v11h-17zM3.5 16.5h5v4h-5zM9.5 16.5h5v4h-5zM15.5 16.5h5v4h-5z',
		glass:
			'M6.5 4.5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM5.5 17.5h4v3h-4zM10 17.5h4v3h-4zM14.5 17.5h4v3h-4z'
	},
	// Named for what it opens, not for what it draws: retro shows the System 7 control panel's
	// sliders rather than a cog, because a cog is not a thing that shipped in 1991.
	settings: {
		modern:
			'M12 6.8a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4ZM12 9.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8ZM12 6.8V4.6M12 17.2v2.2M6.8 12H4.6M17.2 12h2.2M15.68 8.32 17.24 6.76M8.32 8.32 6.76 6.76M15.68 15.68 17.24 17.24M8.32 15.68 6.76 17.24',
		retro: 'M3.5 8.5h17M3.5 15.5h17M7.5 6.5h3v4h-3zM14.5 13.5h3v4h-3z',
		glass:
			'M12 6.6a5.4 5.4 0 1 0 0 10.8 5.4 5.4 0 0 0 0-10.8ZM12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2ZM12 6.6V4.6M12 17.4v2.4M16.68 9.3 18.41 8.3M7.32 9.3 5.59 8.3M7.32 14.7 5.59 15.7M16.68 14.7 18.41 15.7'
	}
} satisfies Record<string, Record<Skin, string>>;

/**
 * Brand and social marks. One variant, filled, on the grid each was drawn on: rescaling a logo
 * by hand is how a logo stops being recognisable, and `viewBox` is free.
 */
export const BRAND = {
	github: {
		box: '0 0 48 48',
		d: 'M44,24c0,8.96-5.88,16.54-14,19.08V38c0-1.71-0.72-3.24-1.86-4.34c5.24-0.95,7.86-4,7.86-9.66c0-2.45-0.5-4.39-1.48-5.9 c0.44-1.71,0.7-4.14-0.52-6.1c-2.36,0-4.01,1.39-4.98,2.53C27.57,14.18,25.9,14,24,14c-1.8,0-3.46,0.2-4.94,0.61 C18.1,13.46,16.42,12,14,12c-1.42,2.28-0.84,4.74-0.3,6.12C12.62,19.63,12,21.57,12,24c0,5.66,2.62,8.71,7.86,9.66 c-0.67,0.65-1.19,1.44-1.51,2.34H16c-1.44,0-2-0.64-2.77-1.68c-0.77-1.04-1.6-1.74-2.59-2.03c-0.53-0.06-0.89,0.37-0.42,0.75 c1.57,1.13,1.68,2.98,2.31,4.19C13.1,38.32,14.28,39,15.61,39H18v4.08C9.88,40.54,4,32.96,4,24C4,12.95,12.95,4,24,4 S44,12.95,44,24z'
	},
	linkedin: {
		box: '0 0 50 50',
		d: 'M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M17,20v19h-6V20H17z M11,14.47c0-1.4,1.2-2.47,3-2.47s2.93,1.07,3,2.47c0,1.4-1.12,2.53-3,2.53C12.2,17,11,15.87,11,14.47z M39,39h-6c0,0,0-9.26,0-10 c0-2-1-4-3.5-4.04h-0.08C27,24.96,26,27.02,26,29c0,0.91,0,10,0,10h-6V20h6v2.56c0,0,1.93-2.56,5.81-2.56 c3.97,0,7.19,2.73,7.19,8.26V39z'
	},
	twitter: {
		box: '0 0 64 64',
		d: 'M61.932,15.439c-2.099,0.93-4.356,1.55-6.737,1.843c2.421-1.437,4.283-3.729,5.157-6.437 c-2.265,1.328-4.774,2.303-7.444,2.817C50.776,11.402,47.735,10,44.366,10c-6.472,0-11.717,5.2-11.717,11.611 c0,0.907,0.106,1.791,0.306,2.649c-9.736-0.489-18.371-5.117-24.148-12.141c-1.015,1.716-1.586,3.726-1.586,5.847 c0,4.031,2.064,7.579,5.211,9.67c-1.921-0.059-3.729-0.593-5.312-1.45c0,0.035,0,0.087,0,0.136c0,5.633,4.04,10.323,9.395,11.391 c-0.979,0.268-2.013,0.417-3.079,0.417c-0.757,0-1.494-0.086-2.208-0.214c1.491,4.603,5.817,7.968,10.942,8.067 c-4.01,3.109-9.06,4.971-14.552,4.971c-0.949,0-1.876-0.054-2.793-0.165C10.012,54.074,16.173,56,22.786,56 c21.549,0,33.337-17.696,33.337-33.047c0-0.503-0.016-1.004-0.04-1.499C58.384,19.83,60.366,17.78,61.932,15.439'
	},
	facebook: {
		box: '0 0 50 50',
		d: 'M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M37,19h-2c-2.14,0-3,0.5-3,2 v3h5l-1,5h-4v15h-5V29h-4v-5h4v-3c0-4,2-7,6-7c2.9,0,4,1,4,1V19z'
	},
	email: {
		box: '0 -960 960 960',
		d: 'M140-160q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h680q24 0 42 18t18 42v520q0 24-18 42t-42 18H140Zm680-525L496-473q-4 2-7.5 3.5T480-468q-5 0-8.5-1.5T464-473L140-685v465h680v-465ZM480-522l336-218H145l335 218Z'
	},
	link: {
		box: '0 -960 960 960',
		d: 'M180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h279v60H180v600h600v-279h60v279q0 24-18 42t-42 18H180Zm202-219-42-43 398-398H519v-60h321v321h-60v-218L382-339Z'
	}
} satisfies Record<string, { box: string; d: string }>;

export type ChromeName = keyof typeof CHROME;
export type BrandName = keyof typeof BRAND;
export type IconName = ChromeName | BrandName;

export const CHROME_NAMES = Object.keys(CHROME) as ChromeName[];
export const BRAND_NAMES = Object.keys(BRAND) as BrandName[];

export function isChrome(name: IconName): name is ChromeName {
	return name in CHROME;
}
