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

/**
 * Whether the pointer driving this event is a finger.
 *
 * The spec asks for tap-opens-directly with no single/double distinction on mobile, and this
 * is the whole of it. Double-tap is the browser's own zoom gesture, so double-click mode on a
 * phone competes with the platform for the same gesture and loses: 6.4 found a single tap opening
 * nothing at all on a 390px viewport.
 *
 * Read live inside the handler rather than held as state behind an `$effect`, which is what the
 * media-query note in the spec is about and what `followSystemAppearance` does for the colour
 * scheme. Nothing renders differently for a coarse pointer, so there is nothing to invalidate:
 * the only question is what kind of pointer just arrived, and asking at that moment is both
 * always current and free of a listener to unregister. A visitor who picks up a stylus mid-visit
 * gets the right answer on the next tap.
 *
 * Optional rather than assumed, because `matchMedia` is absent in two places that matter: the
 * prerender, where `activators` is called but nothing calls what it returns, and `bun test`,
 * where the handlers are invoked directly. Absent means not coarse, which is the direction that
 * leaves the setting in charge.
 */
const coarse = () => globalThis.matchMedia?.('(pointer: coarse)').matches ?? false;

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
			//
			// A finger is the third way in, and it overrides the setting rather than reading it:
			// the setting is a preference about a mouse, and there is no second click to wait for
			// when the gesture that would produce one is the browser's zoom.
			if (settings.clickMode === 'single' || event.detail === 0 || coarse()) {
				return activate(event);
			}
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
 *
 * A coarse pointer gets no exception here, unlike `activators` above, and the reason is the same
 * sentence: the argument for picking on one click is about what the view is, not about what is
 * doing the pointing. Both views stay walkable by tap; what a finger cannot reach in them is the
 * open, which needs the double. Worth revisiting with a real phone in hand, which is 6.4's other
 * half and the user's: these two views are cramped at 390px regardless, and the fix might well be
 * that a narrow window offers icon and list only.
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
