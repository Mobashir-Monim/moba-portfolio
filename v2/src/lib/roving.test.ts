import { describe, expect, test } from 'bun:test';
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
