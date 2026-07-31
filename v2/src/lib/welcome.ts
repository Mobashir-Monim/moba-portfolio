/**
 * Whether this browser has been shown the Read Me yet.
 *
 * A flag rather than a setting, so it is not in `appearance.svelte.ts`: nothing chooses it and
 * nothing in Settings shows it. It shares the `mobos.` namespace because it is still this site's
 * key in somebody else's storage.
 *
 * `localStorage` rather than the `sessionStorage` the boot screen uses, and the two are asking
 * different questions. The boot sequence is a flourish and playing it once per tab is the point.
 * This is an explanation, and someone who has read it does not need it again next week.
 */
const KEY = 'mobos.welcomed';

/**
 * Marked on open rather than on the button, which is the choice worth writing down.
 *
 * Dismissal-driven would mean a visitor who read the window and closed it with Escape or the
 * title bar control gets it again on the next visit, because those are the two ways to close a
 * window that this site spent the whole build making work. A window that keeps coming back until
 * it is dismissed the one correct way is the shape of a cookie banner.
 *
 * The cost is that a reload during the first few seconds loses it, and that cost is covered: it
 * is on the launcher, permanently, as an app.
 */
export function needsWelcome(): boolean {
	try {
		return localStorage.getItem(KEY) === null;
	} catch {
		// Storage unavailable, so there is nowhere to record having shown it and it would open on
		// every single visit. Not opening is the harmless direction, which is the call `Boot` makes
		// about the same privacy modes.
		return false;
	}
}

export function markWelcomed(): void {
	try {
		localStorage.setItem(KEY, '1');
	} catch {
		/* Then it is shown again next visit, which `needsWelcome` has already refused to allow. */
	}
}
