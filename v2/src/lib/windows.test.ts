import { describe, expect, test } from 'bun:test';
import { canBack, canForward, createWindows, current, WRAP } from './windows.svelte';

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

	test('claims no position, so the stylesheet centres it', () => {
		const w = createWindows();
		w.open('a', 'folder');
		expect([w.all[0].x, w.all[0].y]).toEqual([undefined, undefined]);
	});

	// The cascade moved into CSS with the centring, and `seq` is what carries it. Two windows
	// opened back to back have to sit on different steps or they land on each other.
	test('consecutive windows take different cascade steps', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.open('b', 'folder');
		const [a, b] = w.all;
		expect(a.seq % WRAP).not.toBe(b.seq % WRAP);
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

/**
 * 2.13: the layer renders in `seq` order and spends `z-index` on the stack, because a keyed each
 * that reorders moves DOM nodes, and a node that moves between a press and its release eats the
 * click. That only holds while `seq` is independent of everything that reorders the array.
 */
describe('seq', () => {
	test('is open order, and nothing that reorders the stack touches it', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.open('b', 'folder');
		w.open('c', 'document');
		const opened = () => [...w.all].sort((x, y) => x.seq - y.seq).map((r) => r.id);

		w.focus('a');
		w.minimize('b');
		w.restore('b');
		w.restoreKind('document');

		expect(ids(w)).toEqual(['a', 'b', 'c']);
		expect(opened()).toEqual(['a', 'b', 'c']);
	});

	test('a reopened window takes a later place, never its old one', () => {
		const w = createWindows();
		w.open('a', 'folder');
		w.open('b', 'folder');
		const first = w.all[0].seq;
		w.close('a');
		w.open('a', 'folder');
		expect(w.all.find((r) => r.id === 'a')!.seq).toBeGreaterThan(first);
	});

	test('no two open windows share a place', () => {
		const w = createWindows();
		for (const id of ['a', 'b', 'c', 'd']) w.open(id, 'folder');
		expect(new Set(w.all.map((r) => r.seq)).size).toBe(4);
	});
});

describe('counts', () => {
	test('groups by kind and includes minimized windows', () => {
		const w = createWindows();
		w.open('doc1', 'document');
		w.open('doc2', 'document');
		w.open('dir1', 'folder');
		w.minimize('doc2');
		w.open('app:settings', 'app');
		expect(w.counts).toEqual({ folder: 1, document: 2, app: 1 });
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
