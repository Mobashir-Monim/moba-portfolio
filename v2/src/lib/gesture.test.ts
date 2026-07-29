import { describe, expect, test } from 'bun:test';
import { clampSize, clampToDesktop, gesture, type Track } from './gesture';

/**
 * The window layer clips its overflow and a window has no other way to be moved or resized, so
 * every case here is the difference between a window you can get back and one you have lost.
 */

const BOUNDS = { w: 1000, h: 700 };
const WIDTH = 400;

const at = (x: number, y: number) => clampToDesktop(x, y, WIDTH, BOUNDS);

describe('clampToDesktop', () => {
	test('leaves a window inside the desktop where it is', () => {
		expect(at(120, 80)).toEqual({ x: 120, y: 80 });
	});

	test('keeps a margin on screen past the right edge', () => {
		expect(at(2000, 80).x).toBe(936);
	});

	test('keeps a margin on screen past the left edge', () => {
		// Most of the window hangs off, the last 64px of it does not.
		expect(at(-2000, 80).x).toBe(-336);
	});

	test('never lets the title bar leave the top', () => {
		expect(at(120, -400).y).toBe(0);
	});

	test('keeps a margin on screen past the bottom edge', () => {
		expect(at(120, 2000).y).toBe(636);
	});

	test('pins to the near edge on a desktop smaller than the window', () => {
		// The window is wider and taller than the whole desktop, so both axes pin rather than
		// clamp into a range that does not exist. Vertically the range inverts outright, and the
		// low bound has to win or the clamp reads back a position outside itself.
		expect(clampToDesktop(500, 500, WIDTH, { w: 40, h: 40 })).toEqual({ x: -24, y: 0 });
	});
});

describe('clampSize', () => {
	test('leaves a reasonable size alone', () => {
		expect(clampSize(600, 400, BOUNDS)).toEqual({ w: 600, h: 400 });
	});

	test('holds the floor, so a window cannot be shrunk out of reach', () => {
		expect(clampSize(10, 10, BOUNDS)).toEqual({ w: 320, h: 200 });
		expect(clampSize(-9000, -9000, BOUNDS)).toEqual({ w: 320, h: 200 });
	});

	test('holds the ceiling at the desktop', () => {
		expect(clampSize(9000, 9000, BOUNDS)).toEqual({ w: 1000, h: 700 });
	});

	test('floor beats ceiling on a desktop smaller than the floor', () => {
		expect(clampSize(50, 50, { w: 100, h: 100 })).toEqual({ w: 320, h: 200 });
	});
});

/** Enough of a `PointerEvent` for the handle, which reads five fields and captures. */
function pointer(id: number, x: number, y: number, button = 0): PointerEvent {
	return {
		button,
		pointerId: id,
		clientX: x,
		clientY: y,
		currentTarget: { setPointerCapture() {} }
	} as unknown as PointerEvent;
}

function tracker() {
	const state = { moves: [] as [number, number][], commits: 0, cancels: 0 };
	const track: Track = {
		move: (dx, dy) => void state.moves.push([dx, dy]),
		commit: () => void state.commits++,
		cancel: () => void state.cancels++
	};
	return { state, begin: () => track };
}

describe('gesture', () => {
	test('reports the delta from where the pointer went down, and commits once', () => {
		const t = tracker();
		const h = gesture(t.begin);

		h.onpointerdown(pointer(1, 100, 100));
		h.onpointermove(pointer(1, 130, 90));
		h.onpointermove(pointer(1, 150, 80));
		h.onpointerup(pointer(1, 150, 80));

		expect(t.state.moves).toEqual([
			[30, -10],
			[50, -20]
		]);
		expect(t.state.commits).toBe(1);
	});

	test('ignores a second pointer while one is already down', () => {
		const t = tracker();
		const h = gesture(t.begin);

		h.onpointerdown(pointer(1, 100, 100));
		h.onpointerdown(pointer(2, 500, 500));
		h.onpointermove(pointer(2, 600, 600));
		h.onpointerup(pointer(2, 600, 600));

		expect(t.state.moves).toEqual([]);
		expect(t.state.commits).toBe(0);
	});

	test('declining the gesture means no gesture', () => {
		// This is a press on one of the title bar's controls: the surface says no, and the
		// pointer that follows belongs to the button rather than to a drag.
		const t = tracker();
		const h = gesture(() => undefined);

		h.onpointerdown(pointer(1, 100, 100));
		h.onpointermove(pointer(1, 200, 200));
		h.onpointerup(pointer(1, 200, 200));

		expect(t.state.moves).toEqual([]);
		expect(t.state.commits).toBe(0);
	});

	test('a non-primary button starts nothing', () => {
		const t = tracker();
		const h = gesture(t.begin);

		h.onpointerdown(pointer(1, 100, 100, 2));
		h.onpointermove(pointer(1, 200, 200));

		expect(t.state.moves).toEqual([]);
	});

	test('cancel abandons the gesture instead of committing it', () => {
		const t = tracker();
		const h = gesture(t.begin);

		h.onpointerdown(pointer(1, 100, 100));
		h.onpointermove(pointer(1, 140, 100));
		h.onpointercancel(pointer(1, 140, 100));
		h.onpointerup(pointer(1, 140, 100));

		expect(t.state.cancels).toBe(1);
		expect(t.state.commits).toBe(0);
	});

	test('a stray move or up with nothing down does nothing', () => {
		const t = tracker();
		const h = gesture(t.begin);

		h.onpointermove(pointer(1, 200, 200));
		h.onpointerup(pointer(1, 200, 200));

		expect(t.state.moves).toEqual([]);
		expect(t.state.commits).toBe(0);
	});
});
