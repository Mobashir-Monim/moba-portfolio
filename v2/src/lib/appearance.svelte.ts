import { browser } from '$app/environment';

/**
 * The three display axes. Skin owns shape, theme owns colour, appearance owns ground polarity.
 *
 * These lists, the storage keys, and the defaults are duplicated by the pre-paint script in
 * `app.html`. That script cannot import, and it has to run before the first byte of CSS is
 * applied, so the duplication is the price of not flashing. Change one, change the other.
 */
export const SKINS = ['modern', 'retro', 'glass'] as const;
export const THEMES = ['ferrite', 'phosphor', 'halide', 'selenium'] as const;
export const APPEARANCES = ['light', 'dark', 'auto'] as const;

/**
 * Whether a desktop icon opens on one click or two. Persisted like the rest, but absent from
 * the pre-paint script above, because nothing about it is visible before the first paint.
 */
export const CLICK_MODES = ['single', 'double'] as const;

export type Skin = (typeof SKINS)[number];
export type Theme = (typeof THEMES)[number];
export type Appearance = (typeof APPEARANCES)[number];
export type ClickMode = (typeof CLICK_MODES)[number];

export type Settings = {
	skin: Skin;
	theme: Theme;
	appearance: Appearance;
	clickMode: ClickMode;
};

const KEY = {
	skin: 'mnemos.skin',
	theme: 'mnemos.theme',
	appearance: 'mnemos.appearance',
	clickMode: 'mnemos.click-mode'
};
const DEFAULT: Settings = {
	skin: 'modern',
	theme: 'ferrite',
	appearance: 'auto',
	clickMode: 'double'
};

function pick<T extends string>(
	value: string | null | undefined,
	allowed: readonly T[],
	fallback: T
): T {
	return allowed.includes(value as T) ? (value as T) : fallback;
}

/** localStorage throws outright in some privacy modes, so every touch is guarded. */
function read(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function write(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		/* Storage unavailable. The choice still applies for this page view. */
	}
}

/**
 * Seeded from the DOM rather than from storage: the pre-paint script has already resolved
 * skin and theme onto <html>, so reading them back keeps one source of truth. Appearance is
 * not recoverable from the DOM, because `auto` and `dark` both produce the same class.
 */
function initial(): Settings {
	if (!browser) return DEFAULT;
	const el = document.documentElement;
	return {
		skin: pick(el.dataset.skin, SKINS, DEFAULT.skin),
		theme: pick(el.dataset.theme, THEMES, DEFAULT.theme),
		appearance: pick(read(KEY.appearance), APPEARANCES, DEFAULT.appearance),
		clickMode: pick(read(KEY.clickMode), CLICK_MODES, DEFAULT.clickMode)
	};
}

export const settings = $state<Settings>(initial());

function prefersDark(): boolean {
	return browser && matchMedia('(prefers-color-scheme: dark)').matches;
}

export function isDark(appearance: Appearance = settings.appearance): boolean {
	return appearance === 'auto' ? prefersDark() : appearance === 'dark';
}

/**
 * Apply a change to any subset of the axes: state, then <html>, then storage.
 *
 * ponytail: does not follow a live OS colour-scheme change while on `auto`. That needs a
 * matchMedia listener with teardown, which belongs in the root layout's `$effect` in task 2.8.
 */
export function update(patch: Partial<Settings>): void {
	Object.assign(settings, patch);
	if (!browser) return;

	const el = document.documentElement;
	el.dataset.skin = settings.skin;
	el.dataset.theme = settings.theme;
	el.classList.toggle('dark', isDark());

	for (const key of Object.keys(patch) as (keyof Settings)[]) write(KEY[key], settings[key]);
}
