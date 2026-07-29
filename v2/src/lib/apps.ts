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
};

/**
 * Settings is a window like every other window, not a modal over a hidden desktop: it changes how
 * the desktop looks, so covering the desktop while you change it is the wrong shape.
 */
export const SETTINGS_ID = 'app:settings';

export const SYSINFO_ID = 'app:sysinfo';

/** Declaration order is menu order. */
export const APPS: readonly App[] = [
	{ id: SETTINGS_ID, name: 'Settings' },
	{ id: SYSINFO_ID, name: 'System Info' }
];

/**
 * Apps open as documents, because the dock groups windows by `Kind` and an app is much closer to
 * a document than to a folder: it is a thing you look at, not a place you go. Giving `Kind` a
 * third member would ripple through the tree, the file-type labels, and the info sidebar to buy
 * one more heading in the dock.
 */
export const APP_KIND: Kind = 'document';

export function app(id: string): App | undefined {
	return APPS.find((a) => a.id === id);
}
