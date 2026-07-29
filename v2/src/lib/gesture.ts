/**
 * Pointer gestures for the window layer.
 *
 * Dragging a window and resizing one are the same gesture: capture the pointer on the way down,
 * feed the delta while it moves, write to the store once when it comes back up. The old site
 * registered a global `mousemove` per open window and wrote to shared state on every frame
 * (ledger #25), and it handled the mouse only (ledger #26).
 */

export type Bounds = { w: number; h: number };

/**
 * What a frame hands to a surface, spread onto the element that takes the capture. The surface
 * listens on itself once capture is set, never on `window`.
 */
export type Handle = {
	onpointerdown: (event: PointerEvent) => void;
	onpointermove: (event: PointerEvent) => void;
	onpointerup: (event: PointerEvent) => void;
	onpointercancel: (event: PointerEvent) => void;
};

/** One gesture in progress. `move` is given the delta from where the pointer went down. */
export type Track = {
	move: (dx: number, dy: number) => void;
	commit: () => void;
	cancel: () => void;
};

/**
 * `begin` measures whatever this gesture is about to change and returns how to change it, or
 * returns nothing to decline. Declining is how a press on a title bar control avoids starting a
 * drag, and it is the only place a gesture gets to say no.
 */
export function gesture(begin: (event: PointerEvent) => Track | undefined): Handle {
	let active: { id: number; px: number; py: number; track: Track } | null = null;

	return {
		onpointerdown(event) {
			// Primary button only, and never a second pointer landing mid-gesture.
			if (event.button !== 0 || active) return;

			const track = begin(event);
			if (!track) return;

			// One code path for mouse, touch, and pen. Capture is what buys that, and it is also
			// what lets every later event be handled here rather than on `window`.
			(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
			active = { id: event.pointerId, px: event.clientX, py: event.clientY, track };
		},

		onpointermove(event) {
			if (active?.id !== event.pointerId) return;
			active.track.move(event.clientX - active.px, event.clientY - active.py);
		},

		onpointerup(event) {
			if (active?.id !== event.pointerId) return;
			active.track.commit();
			active = null;
		},

		// The browser took the pointer away, so the gesture never happened.
		onpointercancel(event) {
			if (active?.id !== event.pointerId) return;
			active.track.cancel();
			active = null;
		}
	};
}

/**
 * How much of the window has to stay on the desktop. The window layer clips its overflow, so a
 * window dragged past an edge is simply gone: there is no scrollbar to bring it back. This is the
 * margin that keeps the title bar grabbable.
 */
const KEEP = 64;

/**
 * The floor a window can be resized to. Small enough to tile two on a laptop, large enough that
 * the title bar still holds its controls and the window is still something you can get back out
 * of. Without a floor, one drag past the top-left corner leaves a window that cannot be grabbed,
 * read, or closed by pointer.
 */
const MIN = { w: 320, h: 200 };

/** `lo` wins when the range inverts, which is a desktop smaller than the bound being applied. */
const clamp = (v: number, lo: number, hi: number): number =>
	Math.min(Math.max(v, lo), Math.max(lo, hi));

export function clampToDesktop(
	x: number,
	y: number,
	width: number,
	bounds: Bounds
): { x: number; y: number } {
	return {
		x: clamp(x, KEEP - width, bounds.w - KEEP),
		// Never above the top edge: a title bar dragged off the top is unreachable in a way an
		// off-side one is not, because there is nothing left to grab.
		y: clamp(y, 0, bounds.h - KEEP)
	};
}

/** Ceiling as well as floor: nothing is gained by a window larger than the desktop holding it. */
export function clampSize(w: number, h: number, bounds: Bounds): Bounds {
	return {
		w: clamp(w, MIN.w, bounds.w),
		h: clamp(h, MIN.h, bounds.h)
	};
}
