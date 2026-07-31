import { afterEach, expect, test } from 'bun:test';
import { markWelcomed, needsWelcome } from './welcome';

/**
 * Three states, and the third is the one that has bitten this codebase before: storage that
 * throws rather than storage that is empty. `appearance.svelte.ts` guards every touch for the
 * same reason, and here an unguarded read would open a window on every visit in the privacy
 * modes that refuse `localStorage` outright.
 */

function storage(impl: Partial<Storage>): void {
	globalThis.localStorage = impl as Storage;
}

afterEach(() => Reflect.deleteProperty(globalThis, 'localStorage'));

test('a first visit is one with nothing recorded', () => {
	const store = new Map<string, string>();
	storage({
		getItem: (key) => store.get(key) ?? null,
		setItem: (key, value) => void store.set(key, value)
	});

	expect(needsWelcome()).toBe(true);
	markWelcomed();
	expect(needsWelcome()).toBe(false);
});

test('storage that throws is a visit that gets no window, not one that throws', () => {
	storage({
		getItem: () => {
			throw new Error('denied');
		},
		setItem: () => {
			throw new Error('denied');
		}
	});

	expect(needsWelcome()).toBe(false);
	expect(() => markWelcomed()).not.toThrow();
});
