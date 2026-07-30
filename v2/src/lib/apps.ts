import type { ChromeName } from './icons';
import type { Kind } from './os';

/**
 * The app roster.
 *
 * An app is a window with no node behind it: no route, no sitemap entry, no structured data, no
 * info sidebar. That is the line 4.1 drew when it made the résumé a content node instead of an
 * app, and it is why the two things on this list are the two that are genuinely not content.
 *
 * Ids carry an `app:` prefix, which cannot occur in a content slug. That keeps them out of the
 * tree's namespace without a runtime check, and it is what lets one window store address both.
 */

export type App = {
	id: string;
	name: string;
	/** Its own mark, never the document glyph. The launcher is a wall of these, so they carry it. */
	icon: ChromeName;
};

/**
 * Settings is a window like every other window, not a modal over a hidden desktop: it changes how
 * the desktop looks, so covering the desktop while you change it is the wrong shape.
 */
export const SETTINGS_ID = 'app:settings';

export const SYSINFO_ID = 'app:sysinfo';

export const TERMINAL_ID = 'app:terminal';

/** Declaration order is launcher order. */
export const APPS: readonly App[] = [
	{ id: SETTINGS_ID, name: 'Settings', icon: 'settings' },
	{ id: TERMINAL_ID, name: 'Terminal', icon: 'terminal' },
	{ id: SYSINFO_ID, name: 'System Info', icon: 'sysinfo' }
];

/**
 * An app is its own kind of window. It used to open as a document so the dock had somewhere to
 * count it, which meant Settings claimed a document glyph and a `MDoc File` type it is not; the
 * third `Kind` member costs the tree nothing, because the tree is typed on `NodeKind` and cannot
 * hold one.
 */
export const APP_KIND: Kind = 'app';

export function app(id: string): App | undefined {
	return APPS.find((a) => a.id === id);
}
