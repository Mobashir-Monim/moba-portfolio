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
 * The invented type names the info sidebar shows. They lean on the `M` of Mnemos, which is why
 * they live beside the name rather than inside the sidebar component: renaming the OS has to
 * rename these in the same edit or the world stops being one world.
 */
export const FILE_TYPE: Record<Kind, string> = {
	folder: 'MDir Folder',
	document: 'MDoc File'
};

/** Every item claims the same permissions. It is a portfolio, nothing here is writable. */
export const PERMISSIONS = '644';
