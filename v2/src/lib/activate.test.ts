import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { activators, pickers } from './activate';
import { DEFAULT, settings, update } from './appearance.svelte';

/**
 * The one branch every folder view shares. Ledger #10 was the old site racing a `setTimeout`
 * against a re-read of the same setting, so the cases below are the race written down.
 */

/** Enough of a `MouseEvent` for the handlers, which read the modifiers, the button, and detail. */
function click(overrides: Partial<MouseEvent> = {}): MouseEvent & { defaultPrevented: boolean } {
	const event = {
		detail: 1,
		button: 0,
		metaKey: false,
		ctrlKey: false,
		shiftKey: false,
		altKey: false,
		defaultPrevented: false,
		preventDefault() {
			event.defaultPrevented = true;
		},
		...overrides
	};
	return event as unknown as MouseEvent & { defaultPrevented: boolean };
}

function counters() {
	const seen = { opened: 0, selected: 0 };
	return {
		seen,
		...activators(
			() => seen.opened++,
			() => seen.selected++
		)
	};
}

afterEach(() => update({ clickMode: DEFAULT.clickMode }));

/**
 * Pinned, because it is one word in a defaults object and it is the difference between a visitor
 * finding the site and a visitor reporting that clicking does nothing.
 */
test('a first-time visitor gets single-click', () => {
	expect(DEFAULT.clickMode).toBe('single');
});

describe('double-click mode', () => {
	beforeEach(() => update({ clickMode: 'double' }));

	test('one click selects, two open', () => {
		const a = counters();
		a.onclick(click());
		expect(a.seen).toEqual({ opened: 0, selected: 1 });

		a.ondblclick(click({ detail: 2 }));
		expect(a.seen).toEqual({ opened: 1, selected: 1 });
	});

	test('Enter opens, because a keyboard click carries no pointer', () => {
		// `detail` is 0 for a click synthesised by the platform from a key press. Without this
		// case, the keyboard can only ever select and the item is unreachable.
		const a = counters();
		a.onclick(click({ detail: 0 }));
		expect(a.seen).toEqual({ opened: 1, selected: 0 });
	});
});

describe('single-click mode', () => {
	test('one click opens', () => {
		update({ clickMode: 'single' });
		expect(settings.clickMode).toBe('single');

		const a = counters();
		a.onclick(click());
		expect(a.seen).toEqual({ opened: 1, selected: 0 });
	});
});

/**
 * A finger, which is the third way an item opens and the one 6.4 found missing entirely. On a
 * phone the only route into anything was a double-tap, which is also the browser's zoom gesture,
 * so the platform won it and a single tap opened nothing at all.
 *
 * `matchMedia` is absent under `bun test`, which is the "not coarse" path every other case here
 * already runs on, so these two stub it and put it back.
 */
describe('a coarse pointer', () => {
	function withPointer<T>(kind: 'coarse' | 'fine', body: () => T): T {
		const real = globalThis.matchMedia;
		globalThis.matchMedia = ((q: string) => ({ matches: q.includes(kind) })) as typeof matchMedia;
		try {
			return body();
		} finally {
			globalThis.matchMedia = real;
		}
	}

	test('one tap opens, whatever the click-mode setting says', () => {
		update({ clickMode: 'double' });
		withPointer('coarse', () => {
			const a = counters();
			a.onclick(click());
			expect(a.seen).toEqual({ opened: 1, selected: 0 });
		});
	});

	test('a fine pointer still honours the setting, so the override is the finger and not the fix', () => {
		update({ clickMode: 'double' });
		withPointer('fine', () => {
			const a = counters();
			a.onclick(click());
			expect(a.seen).toEqual({ opened: 0, selected: 1 });
		});
	});
});

describe('the platform keeps its own clicks', () => {
	test('a modified click is left to the browser in either mode', () => {
		for (const mode of ['single', 'double'] as const) {
			update({ clickMode: mode });
			for (const key of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const) {
				const a = counters();
				const event = click({ [key]: true });
				a.onclick(event);
				expect([mode, key, a.seen.opened + a.seen.selected]).toEqual([mode, key, 0]);
				expect(event.defaultPrevented).toBe(false);
			}
		}
	});

	test('a middle click is a new tab, not an open', () => {
		update({ clickMode: 'single' });
		const a = counters();
		const event = click({ button: 1 });
		a.onclick(event);
		expect(a.seen.opened).toBe(0);
		expect(event.defaultPrevented).toBe(false);
	});
});

describe('pickers, for the views you browse by picking', () => {
	function picking() {
		const seen = { opened: 0, picked: 0 };
		return {
			seen,
			...pickers(
				() => seen.opened++,
				() => seen.picked++
			)
		};
	}

	test('a click picks and a double-click opens, in either click mode', () => {
		for (const mode of ['single', 'double'] as const) {
			update({ clickMode: mode });
			const a = picking();
			a.onclick(click());
			a.ondblclick(click({ detail: 2 }));
			// Without this, single-click mode would open on the first click and a column could
			// never be walked: every pick would leave the view that was doing the picking.
			expect([mode, a.seen]).toEqual([mode, { opened: 1, picked: 1 }]);
		}
	});

	test('Enter opens rather than picks', () => {
		const a = picking();
		a.onclick(click({ detail: 0 }));
		expect(a.seen).toEqual({ opened: 1, picked: 0 });
	});

	test('a modified click is still the browser’s', () => {
		const a = picking();
		const event = click({ metaKey: true });
		a.onclick(event);
		expect(a.seen).toEqual({ opened: 0, picked: 0 });
		expect(event.defaultPrevented).toBe(false);
	});
});

describe('no handlers', () => {
	test('a link with nothing wired stays a link', () => {
		const a = activators();
		const event = click();
		a.onclick(event);
		a.ondblclick(event);
		expect(event.defaultPrevented).toBe(false);
	});
});
