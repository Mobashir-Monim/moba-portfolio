import { describe, expect, test } from 'bun:test';
import { canBack, canForward, createWindows, current } from './windows.svelte';

/**
 * Every exported mutator gets a case here. Ledger #1 was a `===` typo in exactly this kind of
 * code, and it shipped because the old repo had no tests at all (ledger #35).
 */

function ids(w: ReturnType<typeof createWindows>): string[] {
	return w.all.map((r) => r.id);
}

describe('open', () => {
	test('appends to the top of the stack', () => {
		const w = createWindows();
		w.open('about', 'document');
		w.open('projects', 'folder');
		expect(ids(w)).toEqual(['about', 'projects']);
		expect(w.focused?.id).toBe('projects');
	});

	test('cascades position so windows do not land on each other', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.open('b', 'folder');
		const [a, b] = w.all;
		expect([b.x - a.x, b.y - a.y]).toEqual([28, 28]);
	});

	test('starts history at the node it opened from', () => {
		const w = createWindows();
		w.open('projects', 'folder');
		expect(w.all[0].history).toEqual(['projects']);
		expect(current(w.all[0])).toBe('projects');
	});

	test('reopening focuses and unminimizes rather than duplicating', () => {
		const w = createWindows();
		w.open('about', 'document');
		w.open('projects', 'folder');
		w.minimize('about');
		w.open('about', 'document');
		expect(ids(w)).toEqual(['projects', 'about']);
		expect(w.all[1].minimized).toBe(false);
	});
});

describe('close', () => {
	test('removes only the named window', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.open('b', 'folder');
		w.open('c', 'folder');
		w.close('a');
		expect(ids(w)).toEqual(['b', 'c']);
	});

	// Ledger #1: the old store closed the wrong window when it could not find the right one.
	test('an unknown id closes nothing', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.open('b', 'folder');
		w.close('nope');
		expect(ids(w)).toEqual(['a', 'b']);
	});
});

describe('focus', () => {
	test('moves the record to the end', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.open('b', 'folder');
		w.focus('a');
		expect(ids(w)).toEqual(['b', 'a']);
		expect(w.isFocused('a')).toBe(true);
	});

	test('an unknown id leaves the stack alone', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.focus('nope');
		expect(ids(w)).toEqual(['a']);
	});
});

describe('minimize and restore', () => {
	test('focus falls through to the window behind', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.open('b', 'folder');
		w.minimize('b');
		expect(w.focused?.id).toBe('a');
		expect(ids(w)).toEqual(['a', 'b']);
	});

	test('restore unminimizes and raises', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.open('b', 'folder');
		w.minimize('a');
		w.restore('a');
		expect(ids(w)).toEqual(['b', 'a']);
		expect(w.focused?.id).toBe('a');
	});

	test('every window minimized means nothing is focused', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.minimize('a');
		expect(w.focused).toBeUndefined();
	});

	test('restoreKind unminimizes one kind and brings it forward in order', () => {
		const w = createWindows();
		w.open('doc1', 'document');
		w.open('dir1', 'folder');
		w.open('doc2', 'document');
		w.minimize('doc1');
		w.minimize('doc2');
		w.restoreKind('document');
		expect(ids(w)).toEqual(['dir1', 'doc1', 'doc2']);
		expect(w.all.every((r) => !r.minimized)).toBe(true);
	});
});

describe('counts', () => {
	test('groups by kind and includes minimized windows', () => {
		const w = createWindows();
		w.open('doc1', 'document');
		w.open('doc2', 'document');
		w.open('dir1', 'folder');
		w.minimize('doc2');
		expect(w.counts).toEqual({ folder: 1, document: 2 });
	});
});

describe('moveTo', () => {
	test('writes the committed position', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.moveTo('a', 120, 200);
		expect([w.all[0].x, w.all[0].y]).toEqual([120, 200]);
	});
});

describe('resizeTo', () => {
	test('a new window claims no size, so the stylesheet keeps deciding', () => {
		const w = createWindows();
		w.open('a', 'folder');
		expect([w.all[0].w, w.all[0].h]).toEqual([undefined, undefined]);
	});

	test('writes the committed size', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.resizeTo('a', 640, 480);
		expect([w.all[0].w, w.all[0].h]).toEqual([640, 480]);
	});
});

describe('setView', () => {
	test('a new window opens in the icon view', () => {
		const w = createWindows();
		w.open('a', 'folder');
		expect(w.all[0].view).toBe('icon');
	});

	test('writes the view and keeps it across navigation', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.setView('a', 'column');
		w.navigate('a', 'b');
		expect(w.all[0].view).toBe('column');
	});
});

describe('navigate', () => {
	test('pushes onto history and moves the cursor', () => {
		const w = createWindows();
		w.open('root', 'folder');
		w.navigate('root', 'work');
		expect(w.all[0].history).toEqual(['root', 'work']);
		expect(current(w.all[0])).toBe('work');
	});

	test('navigating to the current node is a no-op', () => {
		const w = createWindows();
		w.open('root', 'folder');
		w.navigate('root', 'root');
		expect(w.all[0].history).toEqual(['root']);
	});

	test('discards the forward stack', () => {
		const w = createWindows();
		w.open('root', 'folder');
		w.navigate('root', 'work');
		w.navigate('root', 'acme');
		w.back('root');
		w.back('root');
		w.navigate('root', 'play');
		expect(w.all[0].history).toEqual(['root', 'play']);
		expect(canForward(w.all[0])).toBe(false);
	});

	// Ledger #9: the old store wrote whole window objects into each other's history.
	test('history holds strings, never records', () => {
		const w = createWindows();
		w.open('root', 'folder');
		w.navigate('root', 'work');
		expect(w.all[0].history.every((h) => typeof h === 'string')).toBe(true);
	});
});

describe('back and forward', () => {
	test('walk the cursor without touching history', () => {
		const w = createWindows();
		w.open('root', 'folder');
		w.navigate('root', 'work');
		w.back('root');
		expect(current(w.all[0])).toBe('root');
		w.forward('root');
		expect(current(w.all[0])).toBe('work');
		expect(w.all[0].history).toEqual(['root', 'work']);
	});

	test('stop at both ends', () => {
		const w = createWindows();
		w.open('root', 'folder');
		expect(canBack(w.all[0])).toBe(false);
		expect(canForward(w.all[0])).toBe(false);
		w.back('root');
		w.forward('root');
		expect(w.all[0].index).toBe(0);
	});
});

// Ledger #8: the old store mutated a shared array in place and then set the same reference.
describe('immutability at the boundary', () => {
	test('a mutation produces a new array and a new record', () => {
		const w = createWindows();
		w.open('a', 'folder');
		const before = w.all;
		const record = before[0];
		w.moveTo('a', 10, 10);
		expect(w.all).not.toBe(before);
		expect(w.all[0]).not.toBe(record);
	});
});
