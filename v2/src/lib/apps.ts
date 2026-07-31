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
 * The window that explains the desktop, and the one thing on this list that opens itself.
 *
 * An app rather than a content node, which was a real fork. A `README` sitting on the desktop is
 * good metaphor and it would prerender, but it is chrome and not portfolio: it has nothing to say
 * to a search engine, no place in the sitemap, and no business in `Person` or `CreativeWork`. It
 * is also the only thing here whose copy changes with a setting.
 *
 * An app rather than a modal for a plainer reason: it is a window explaining windows. A visitor
 * who reads it has already dragged one, closed one with Escape, and found it again on the
 * launcher, which is more than the paragraph inside it can teach.
 */
export const WELCOME_ID = 'app:welcome';

/**
 * Settings is a window like every other window, not a modal over a hidden desktop: it changes how
 * the desktop looks, so covering the desktop while you change it is the wrong shape.
 */
export const SETTINGS_ID = 'app:settings';

export const SYSINFO_ID = 'app:sysinfo';

export const TERMINAL_ID = 'app:terminal';

export const SNAKE_ID = 'app:snake';

/**
 * 2048, whose id is `tiles` because an id is also a JavaScript identifier here: `apps.test.ts`
 * turns it into the constant name that `AppContent.svelte` has to branch on, and no identifier
 * starts with a digit. The name is what the app is called and the id is what the code calls it,
 * which `sysinfo` and System Info already do.
 */
export const TILES_ID = 'app:tiles';

export const MINES_ID = 'app:mines';

export const CALCULATOR_ID = 'app:calculator';

/**
 * Declaration order is launcher order: the tools first, then the toys. Read Me leads, because a
 * launcher is also where somebody goes when they cannot work out what they are looking at.
 *
 * Its glyph is `document` rather than a mark of its own. It is a read me, and every OS that ever
 * shipped one gave it the file icon: a new glyph would need three skin variants drawn to say
 * something the document icon already says.
 */
export const APPS: readonly App[] = [
	{ id: WELCOME_ID, name: 'Read Me', icon: 'document' },
	{ id: SETTINGS_ID, name: 'Settings', icon: 'settings' },
	{ id: TERMINAL_ID, name: 'Terminal', icon: 'terminal' },
	{ id: SYSINFO_ID, name: 'System Info', icon: 'sysinfo' },
	{ id: CALCULATOR_ID, name: 'Calculator', icon: 'calculator' },
	{ id: SNAKE_ID, name: 'Snake', icon: 'snake' },
	{ id: TILES_ID, name: '2048', icon: 'tiles' },
	{ id: MINES_ID, name: 'Minesweeper', icon: 'mines' }
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
