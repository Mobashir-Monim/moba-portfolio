import { browser } from '$app/environment';

/**
 * The three display axes. Skin owns shape, theme owns colour, appearance owns ground polarity.
 *
 * These lists, the storage keys, and the defaults are duplicated by the pre-paint script in
 * `app.html`. That script cannot import, and it has to run before the first byte of CSS is
 * applied, so the duplication is the price of not flashing. Change one, change the other.
 */
export const SKINS = ['modern', 'retro', 'glass'] as const;
/** One theme per usable hue cluster in sRGB. The hues and the names are argued in gen-palette.ts. */
export const THEMES = ['ferrite', 'phosphor', 'cyanotype', 'anthotype'] as const;
export const APPEARANCES = ['light', 'dark', 'auto'] as const;
/**
 * The scene behind the desktop. A fourth axis rather than a skin or theme value, because it is
 * neither shape nor colour: every wallpaper renders in all 24 combinations, and every skin
 * dresses the same masks its own way. `none` falls back to the skin's plain `--desktop-bg`.
 *
 * Adding one means a `[data-wallpaper='...']` block in app.css and the name here. Nothing else.
 * The block answers the `--wall-show-<name>` its bands offer and declares the scene's ink ramp;
 * the bands themselves are a folder under `lib/wallpapers/` that `Wallpaper.svelte` finds without
 * being told.
 */
export const WALLPAPERS = ['grove', 'night-scene', 'circuit-bottom', 'hive', 'none'] as const;

/**
 * Whether a desktop icon opens on one click or two. Persisted like the rest, but absent from
 * the pre-paint script above, because nothing about it is visible before the first paint.
 */
export const CLICK_MODES = ['single', 'double'] as const;

export type Skin = (typeof SKINS)[number];
export type Theme = (typeof THEMES)[number];
export type Appearance = (typeof APPEARANCES)[number];
export type Wallpaper = (typeof WALLPAPERS)[number];
export type ClickMode = (typeof CLICK_MODES)[number];

export type Settings = {
	skin: Skin;
	theme: Theme;
	appearance: Appearance;
	wallpaper: Wallpaper;
	clickMode: ClickMode;
};

/**
 * Namespaced by the OS name, lowercased, the way the shell prompt and the 404 voice are.
 * Written out rather than derived from `OS_NAME`, because the pre-paint script in `app.html`
 * cannot import and would hold a literal either way; one source with a copy beside it is a
 * smaller lie than two derivations that only look related.
 *
 * Renaming the namespace discards every saved choice, which is deliberate here: the defaults
 * moved in the same change, and a returning visitor should see the site's new dress rather
 * than a preference they never knowingly set.
 */
const KEY = {
	skin: 'mobos.skin',
	theme: 'mobos.theme',
	appearance: 'mobos.appearance',
	wallpaper: 'mobos.wallpaper',
	clickMode: 'mobos.click-mode'
};
const DEFAULT: Settings = {
	skin: 'glass',
	theme: 'anthotype',
	appearance: 'auto',
	wallpaper: 'night-scene',
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
		wallpaper: pick(el.dataset.wallpaper, WALLPAPERS, DEFAULT.wallpaper),
		clickMode: pick(read(KEY.clickMode), CLICK_MODES, DEFAULT.clickMode)
	};
}

export const settings = $state<Settings>(initial());

const SCHEME = '(prefers-color-scheme: dark)';

/**
 * The OS preference, held as state rather than read from `matchMedia` on demand, so that
 * `auto` is reactive: a readout of `isDark()` has to follow the system flipping under it, and
 * `settings.appearance` does not change when that happens.
 */
let systemDark = $state(browser && matchMedia(SCHEME).matches);

export function isDark(appearance: Appearance = settings.appearance): boolean {
	return appearance === 'auto' ? systemDark : appearance === 'dark';
}

/**
 * Follow a live OS colour-scheme change while appearance is `auto`. Returns its own teardown,
 * so the only caller is one `$effect` in the root layout.
 *
 * The class is toggled here rather than in an effect over `isDark()`, because `update()`
 * already owns that line and a second writer means two of them to keep in step.
 */
export function followSystemAppearance(): () => void {
	const mq = matchMedia(SCHEME);
	const sync = () => {
		systemDark = mq.matches;
		if (settings.appearance === 'auto') {
			document.documentElement.classList.toggle('dark', systemDark);
		}
	};
	mq.addEventListener('change', sync);
	return () => mq.removeEventListener('change', sync);
}

/** Apply a change to any subset of the axes: state, then <html>, then storage. */
export function update(patch: Partial<Settings>): void {
	Object.assign(settings, patch);
	if (!browser) return;

	const el = document.documentElement;
	el.dataset.skin = settings.skin;
	el.dataset.theme = settings.theme;
	el.dataset.wallpaper = settings.wallpaper;
	el.classList.toggle('dark', isDark());

	for (const key of Object.keys(patch) as (keyof Settings)[]) write(KEY[key], settings[key]);
}
