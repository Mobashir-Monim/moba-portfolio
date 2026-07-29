/**
 * The operating system this site is dressed as.
 *
 * It surfaces in the boot sequence, the Terminal prompt and hostname, System Info, the
 * file-type labels, and the 404 voice. Those must never drift apart, so it lives here and
 * never as a string literal in a component.
 *
 * Mnemos is Greek, memory. A portfolio is a record of work, so the name means what the site
 * is, and it earns the `M` that `MDir` and `MDoc` already lean on.
 */
export const OS_NAME = 'Mnemos';
export const OS_VERSION = '2.0';

/** The two things the filesystem holds. Everything with a route is one or the other. */
export type Kind = 'folder' | 'document';

/**
 * Settings is a window like every other window, not a modal over a hidden desktop: it changes how
 * the desktop looks, so covering the desktop while you change it is the wrong shape.
 *
 * It has no node in the tree, because it is an app and not content, and the `app:` prefix cannot
 * occur in a content slug. That is what keeps the id out of the tree's namespace without a
 * runtime check. Phase 4 turns this into a roster; one app does not need one yet.
 */
export const SETTINGS_ID = 'app:settings';
export const SETTINGS_NAME = 'Settings';

/**
 * The invented type names the info sidebar shows. They lean on the `M` of Mnemos, which is why
 * they live beside the name rather than inside the sidebar component: renaming the OS has to
 * rename these in the same edit or the world stops being one world.
 */
export const FILE_TYPE: Record<Kind, string> = {
	folder: 'MDir Folder',
	document: 'MDoc File'
};

/**
 * How a folder window draws what it holds. The same four a Finder window offers, and the same
 * order, because that is the order the segmented control has been in for twenty years.
 *
 * `column` and `gallery` are genuinely different browsers rather than restyled grids, which is
 * why this is a per-window setting and not a class on the grid.
 */
export const VIEWS = ['icon', 'list', 'column', 'gallery'] as const;
export type View = (typeof VIEWS)[number];

/** Names the switcher announces, and the labels the styleguide prints beside each view. */
export const VIEW_LABEL: Record<View, string> = {
	icon: 'Icons',
	list: 'List',
	column: 'Columns',
	gallery: 'Gallery'
};

/** Every item claims the same permissions. It is a portfolio, nothing here is writable. */
export const PERMISSIONS = '644';

/**
 * The owner every item reports. A handle rather than a display name, because `644` and
 * `Mobashir Monim` in the same table are two different jokes; `644` and `mobashir` are one.
 */
export const OWNER = 'mobashir';

/**
 * What the info sidebar shows for a node whose content carries no date of its own, as `YYYY-MM`.
 *
 * ponytail: a constant, bumped by hand. The honest version reads the build timestamp, but that
 * has to be injected at build time to avoid a server and a client disagreeing about `now` and
 * failing hydration. Task 4.5, System Info, needs exactly that injection, so this becomes its
 * caller rather than growing its own.
 */
export const SITE_MODIFIED = '2026-07';

/**
 * The POST sequence. Lives here with the name it opens on, so the boot screen, the styleguide,
 * and System Info cannot drift into describing three different machines.
 */
export const BOOT_LINES = [
	`${OS_NAME} ${OS_VERSION} (c) Mobashir Monim`,
	'Checking memory ......... 640K OK',
	'Detecting storage devices ... OK',
	'Mounting /projects ...... OK',
	'Mounting /experience .... OK',
	'Starting window server .. OK'
];

/** How long each POST line waits before the next, in milliseconds. */
export const BOOT_STEP_MS = 260;
