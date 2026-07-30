import { describe, expect, test } from 'bun:test';
import {
	COLS,
	count,
	flag,
	MINES,
	neighbours,
	remaining,
	reveal,
	ROWS,
	start,
	type Game
} from './mines';

/**
 * The rules of the game, which is all of what `mines.ts` is. Four of these cover a bug the naive
 * version ships with: the neighbour that wraps around a row, the first click that can lose, the
 * flood that walks back into itself, and the flag that stops protecting anything.
 */

/** Deterministic placement. Always the first cell left in the pool, unless handed a sequence. */
function fixed(...values: number[]): () => number {
	let i = 0;
	return () => values[i++ % values.length] ?? 0;
}

/**
 * A deterministic spread, for the cases that need a board somebody could plausibly be dealt.
 * `fixed(0)` stacks all ten mines at the front of the pool, which on a 9x9 puts them in a wall
 * across the top two rows and makes the first click clear everything below it in one go. That is
 * exactly the draw the first-click rules want and exactly the wrong one for anything downstream.
 */
function seeded(seed: number): () => number {
	let s = seed;
	return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
}

const at = (x: number, y: number): number => y * COLS + x;
const mines = (game: Game): number[] =>
	game.cells.flatMap((c, i) => (c.mine ? [i] : ([] as number[])));
const revealed = (game: Game): number[] =>
	game.cells.flatMap((c, i) => (c.state === 'revealed' ? [i] : ([] as number[])));

describe('neighbours', () => {
	test('a middle cell has eight, an edge five, a corner three', () => {
		expect(neighbours(at(4, 4)).length).toBe(8);
		expect(neighbours(at(0, 4)).length).toBe(5);
		expect(neighbours(at(0, 0)).length).toBe(3);
		expect(neighbours(at(COLS - 1, ROWS - 1)).length).toBe(3);
	});

	/** The one that matters. Column 0 minus one is the last cell of the row above, not a neighbour. */
	test('the left column does not reach around to the row above', () => {
		expect(neighbours(at(0, 3))).not.toContain(at(COLS - 1, 2));
		expect(neighbours(at(COLS - 1, 3))).not.toContain(at(0, 4));
	});

	test('a count reads only the cells that touch it', () => {
		const game = start();
		const cells = [...game.cells];
		cells[at(COLS - 1, 2)] = { mine: true, state: 'hidden' };
		expect(count(cells, at(0, 3))).toBe(0);
		expect(count(cells, at(COLS - 1, 3))).toBe(1);
	});
});

describe('the first reveal', () => {
	test('places the mines and never puts one under the press', () => {
		// The worst draw there is: every mine taken from the front of the pool, which is cell 0 and up.
		const game = reveal(start(), 0, fixed(0));

		expect(game.placed).toBe(true);
		expect(mines(game).length).toBe(MINES);
		expect(game.over).toBe(false);
		expect(game.cells[0].mine).toBe(false);
	});

	test('never puts one beside it either, so the press always opens a region', () => {
		for (const first of [0, at(4, 4), at(COLS - 1, ROWS - 1), at(0, 5)]) {
			const game = reveal(start(), first, fixed(0));
			expect(game.over).toBe(false);
			expect(count(game.cells, first)).toBe(0);
			// A zero cell opens its neighbours, which is what a first click is supposed to buy.
			expect(revealed(game).length).toBeGreaterThan(neighbours(first).length);
		}
	});

	test('is not a mine even when the draw would land on every cell in turn', () => {
		// Ten draws walking the pool from the far end, then the same board pressed at the far end.
		const game = reveal(start(), at(8, 8), fixed(1 - Number.EPSILON));
		expect(game.over).toBe(false);
		expect(mines(game).length).toBe(MINES);
	});
});

describe('the flood', () => {
	test('stops at cells that have a count and does not reveal past them', () => {
		const game = reveal(start(), 0, seeded(7));
		const open = revealed(game);

		// Every revealed cell is either empty, or a count that was reached from an empty neighbour.
		for (const i of open) {
			if (count(game.cells, i) === 0) {
				expect(neighbours(i).every((n) => open.includes(n) || game.cells[n].mine)).toBe(true);
			}
		}
		expect(open.some((i) => count(game.cells, i) > 0)).toBe(true);
		expect(open.length).toBeLessThan(ROWS * COLS - MINES);
	});

	test('does not cross a flag', () => {
		const opened = reveal(start(), 0, seeded(7));
		const edge = revealed(opened).find((i) => count(opened.cells, i) === 0 && i !== 0);

		// Same board, one flag dropped on a cell the open field would otherwise have walked into.
		const fresh = {
			...start(),
			cells: opened.cells.map((c) => ({ ...c, state: 'hidden' as const }))
		};
		const blocked = reveal(flag(fresh, edge as number), 0, seeded(7));

		expect(blocked.cells[edge as number].state).toBe('flagged');
		expect(revealed(blocked).length).toBeLessThan(revealed(opened).length);
	});

	test('terminates on a board with no mines at all, which is the whole grid at once', () => {
		// `scatter` is skipped by pre-placing nothing and marking the board placed.
		const empty: Game = { ...start(), placed: true };
		const game = reveal(empty, at(4, 4));

		expect(revealed(game).length).toBe(ROWS * COLS);
		expect(game.won).toBe(true);
	});
});

describe('flags', () => {
	test('go on and come off a hidden cell', () => {
		const one = flag(start(), 5);
		expect(one.cells[5].state).toBe('flagged');
		expect(remaining(one.cells)).toBe(MINES - 1);
		expect(flag(one, 5).cells[5].state).toBe('hidden');
	});

	test('a flagged cell cannot be revealed, which is the point of it', () => {
		const flagged = flag(start(), 5);
		expect(reveal(flagged, 5, fixed(0))).toBe(flagged);
	});

	test('a revealed cell cannot be flagged', () => {
		const game = reveal(start(), 0, fixed(0));
		const target = revealed(game)[0];
		expect(flag(game, target)).toBe(game);
	});

	test('the counter goes negative rather than refusing the eleventh flag', () => {
		let game = start();
		for (let i = 0; i <= MINES; i++) game = flag(game, i);
		expect(remaining(game.cells)).toBe(-1);
	});
});

describe('endings', () => {
	test('a mine ends it and every other mine comes up with it', () => {
		const opened = reveal(start(), 0, seeded(7));
		const mine = mines(opened)[0];
		const game = reveal(opened, mine, fixed(0));

		expect(game.over).toBe(true);
		expect(game.won).toBe(false);
		expect(mines(game).every((i) => game.cells[i].state === 'revealed')).toBe(true);
	});

	test('clearing every cell that is not a mine is the win, with no flag required', () => {
		let game = reveal(start(), at(4, 4), fixed(0));
		for (let i = 0; i < ROWS * COLS; i++) {
			if (!game.cells[i].mine) game = reveal(game, i, fixed(0));
		}

		expect(game.won).toBe(true);
		expect(game.over).toBe(false);
		expect(remaining(game.cells)).toBe(MINES);
	});

	test('a finished game takes no more presses', () => {
		const opened = reveal(start(), 0, seeded(7));
		const dead = reveal(opened, mines(opened)[0], fixed(0));

		expect(reveal(dead, at(4, 4), fixed(0))).toBe(dead);
		expect(flag(dead, at(4, 4))).toBe(dead);
	});
});
