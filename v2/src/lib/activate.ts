import { settings } from './appearance.svelte';

/**
 * Turning a link into a shell affordance, in one place.
 *
 * Four folder views draw the same item four different ways, and every one of them owes the same
 * three things: the click-mode setting, the modified clicks the browser already has a better
 * answer for, and Enter. Ledger #10 was the old site solving one of those with a 100ms
 * `setTimeout` racing a re-read of the mode.
 */

/** New tab, new window, middle click. The platform wins these, so the shell never claims them. */
export function claimed(event: MouseEvent): boolean {
	return !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0);
}

export type Activators = {
	onclick: (event: MouseEvent) => void;
	ondblclick: (event: MouseEvent) => void;
};

/**
 * Handlers for an `<a>` that should open in the shell. Pass neither callback and the element
 * stays exactly what the markup says it is, a link, which is the plain route and the
 * JavaScript-off case.
 */
export function activators(onopen?: () => void, onselect?: () => void): Activators {
	function activate(event: MouseEvent): void {
		if (!onopen || !claimed(event)) return;
		event.preventDefault();
		onopen();
	}

	return {
		onclick(event) {
			// Enter on a link fires a click with no pointer behind it. That is an activation in
			// either mode, so double-click mode must not swallow it into a selection.
			if (settings.clickMode === 'single' || event.detail === 0) return activate(event);
			if (!onselect || !claimed(event)) return;
			event.preventDefault();
			onselect();
		},
		ondblclick: activate
	};
}

/**
 * The other half of the same idea, for the two views you browse by picking rather than by
 * opening. A click always picks, a double-click or Enter opens, and the click-mode setting does
 * not get a say: in a column or a filmstrip, picking is the navigation, so honouring
 * single-click-opens there would leave those two views with no way to walk them at all.
 */
export function pickers(onopen?: () => void, onpick?: () => void): Activators {
	return {
		onclick(event) {
			if (!claimed(event)) return;
			event.preventDefault();
			// Enter, again: a click with no pointer behind it is an activation, not a pick.
			if (event.detail === 0) return onopen?.();
			onpick?.();
		},
		ondblclick(event) {
			if (!claimed(event)) return;
			event.preventDefault();
			onopen?.();
		}
	};
}
