import { afterEach, expect, test } from 'bun:test';
import { followSystemAppearance, isDark, settings, update } from './appearance.svelte';

/**
 * A flippable MediaQueryList plus the one `<html>` classList the module writes to. Neither
 * exists under `bun test`, and both are the whole of what task 2.8 touches.
 */
function stub() {
	const listeners = new Set<() => void>();
	const mq = {
		matches: false,
		addEventListener: (_: string, fn: () => void) => void listeners.add(fn),
		removeEventListener: (_: string, fn: () => void) => void listeners.delete(fn)
	};
	const classes = new Set<string>();

	globalThis.matchMedia = (() => mq) as unknown as typeof matchMedia;
	globalThis.document = {
		documentElement: {
			classList: {
				toggle: (name: string, on: boolean) => (on ? classes.add(name) : classes.delete(name))
			}
		}
	} as unknown as Document;

	return {
		classes,
		get listenerCount() {
			return listeners.size;
		},
		flip(to: boolean) {
			mq.matches = to;
			for (const fn of listeners) fn();
		}
	};
}

afterEach(() => {
	Reflect.deleteProperty(globalThis, 'document');
	Reflect.deleteProperty(globalThis, 'matchMedia');
});

test('auto follows a live system change, in both directions', () => {
	update({ appearance: 'auto' });
	const os = stub();
	const stop = followSystemAppearance();

	os.flip(true);
	expect(isDark()).toBe(true);
	expect(os.classes.has('dark')).toBe(true);

	os.flip(false);
	expect(isDark()).toBe(false);
	expect(os.classes.has('dark')).toBe(false);

	stop();
});

test('a chosen appearance is not overwritten by the system', () => {
	update({ appearance: 'light' });
	const os = stub();
	const stop = followSystemAppearance();

	os.flip(true);
	expect(isDark()).toBe(false);
	expect(os.classes.has('dark')).toBe(false);
	// The preference is still tracked, so switching back to `auto` is correct immediately.
	expect(isDark('auto')).toBe(true);

	stop();
});

test('teardown removes the listener', () => {
	update({ appearance: 'auto' });
	const os = stub();

	followSystemAppearance()();
	expect(os.listenerCount).toBe(0);

	os.flip(true);
	expect(os.classes.has('dark')).toBe(false);
	expect(settings.appearance).toBe('auto');
});
