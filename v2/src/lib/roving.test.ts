import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { nextIndex } from './roving';

/**
 * Seven icons in three columns: two full rows and a short one. The short row is where every
 * off-by-one in a grid walker shows up, because down from it has nowhere to go.
 *
 *   0 1 2
 *   3 4 5
 *   6
 */
const grid = (key: string, index: number) => nextIndex(key, index, 7, 3);

/** The desktop, which is a grid one column wide. */
const list = (key: string, index: number) => nextIndex(key, index, 4, 1);

describe('nextIndex', () => {
	test('the horizontal arrows step one', () => {
		expect(grid('ArrowRight', 3)).toBe(4);
		expect(grid('ArrowLeft', 3)).toBe(2);
	});

	test('the vertical arrows step a row', () => {
		expect(grid('ArrowDown', 1)).toBe(4);
		expect(grid('ArrowUp', 4)).toBe(1);
	});

	test('stays put at every edge rather than wrapping or sliding along', () => {
		expect(grid('ArrowLeft', 0)).toBe(0);
		expect(grid('ArrowRight', 6)).toBe(6);
		// Up from the top row is the case a clamp gets wrong: it would land on item 0, which is a
		// sideways move in answer to a vertical key.
		expect(grid('ArrowUp', 2)).toBe(2);
		// Down from the last full row would land in the short row's empty second column.
		expect(grid('ArrowDown', 4)).toBe(4);
		expect(grid('ArrowDown', 6)).toBe(6);
	});

	test('a one-column list moves on the vertical arrows', () => {
		expect(list('ArrowDown', 0)).toBe(1);
		expect(list('ArrowUp', 3)).toBe(2);
		expect(list('ArrowDown', 3)).toBe(3);
	});

	test('Home and End take the ends', () => {
		expect(grid('Home', 5)).toBe(0);
		expect(grid('End', 1)).toBe(6);
	});

	test('leaves every other key to the browser', () => {
		// Enter opens the link, Tab leaves the grid, and neither is ours to claim.
		expect(grid('Enter', 2)).toBeUndefined();
		expect(grid('Tab', 2)).toBeUndefined();
		expect(grid('Escape', 2)).toBeUndefined();
		expect(grid('a', 2)).toBeUndefined();
	});

	test('does nothing when the key came from outside the set', () => {
		expect(grid('ArrowDown', -1)).toBeUndefined();
		expect(nextIndex('ArrowDown', 0, 0, 1)).toBeUndefined();
	});
});

/**
 * The half of this that `nextIndex` cannot fail at, and the half that was actually broken.
 *
 * 7.4: `move` read `link.parentElement`, which is the right element in the icon grid and in
 * nothing else. The list wraps each link in a `th`, the columns and the gallery strip in an `li`,
 * so the lookup found a parent holding one link and the arrows moved nowhere in three of the four
 * views. Every case above passed throughout, because the walker was never the part that was wrong.
 *
 * So this asserts the wiring instead, at the source level, the way `tokens.test.ts` asserts
 * app.html against app.css. A handler with no container to walk is the defect that shipped; a
 * container with no handler on its links is the same defect from the other end.
 */
describe('every view that moves on the arrows marks its own set', () => {
	const dir = new URL('./components/', import.meta.url);

	/** Every component under `components/`, nested ones included. */
	const files = readdirSync(dir, { recursive: true, encoding: 'utf8' })
		.filter((name) => name.endsWith('.svelte'))
		.sort();

	const wiring = new Map(
		files.map((name) => {
			const source = readFileSync(new URL(name, dir), 'utf8');
			return [
				name,
				{ handler: source.includes('onkeydown={move}'), container: source.includes('data-roving') }
			];
		})
	);

	/**
	 * The icon view is the one place the two halves live in different files: the container is the
	 * shared grid and the link is `DesktopIcon`, which the desktop also uses on its own. Everywhere
	 * else a view is one file and owes both.
	 */
	const SPLIT = ['IconGrid.svelte', 'DesktopIcon.svelte'];

	test('a handler and a container always ship together', () => {
		const half = files.filter(
			(name) => !SPLIT.includes(name) && wiring.get(name)!.handler !== wiring.get(name)!.container
		);
		expect(half).toEqual([]);
	});

	test('all four folder views reach the walker', () => {
		const reached = files.filter((name) => name.startsWith('views/') && wiring.get(name)!.handler);
		// `IconView` is the fourth, through the two files in `SPLIT`, and `FolderView` is the
		// switch that picks between them rather than a view of its own.
		expect(reached).toEqual([
			'views/ColumnView.svelte',
			'views/GalleryView.svelte',
			'views/ListView.svelte'
		]);
		expect(SPLIT.map((name) => wiring.get(name))).toEqual([
			{ handler: false, container: true },
			{ handler: true, container: false }
		]);
	});
});
