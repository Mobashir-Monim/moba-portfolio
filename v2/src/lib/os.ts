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
