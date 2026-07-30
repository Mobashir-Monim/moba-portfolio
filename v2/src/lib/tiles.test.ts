import { describe, expect, test } from 'bun:test';
import { DIRS, GOAL, move, SIZE, start, stuck, type Dir, type Game } from './tiles';

/**
 * The rules of the game, which is all of what `tiles.ts` is. Four of these cover a bug the naive
 * version ships with: the tile that merges twice in one move, the blocked press that spawns anyway,
 * the full board called over while it is still playable, and a direction whose transpose is wrong.
 */

/** Deterministic randomness. Always the first free cell and always a 2, unless handed a sequence. */
function fixed(...values: number[]): () => number {
	let i = 0;
	return () => values[i++ % values.length] ?? 0;
}

/** A board written out as rows, so a rule can be read in the test that asserts it. */
function board(...grid: number[][]): Game {
	return { cells: grid.flat(), score: 0, won: false, over: false };
}

const rowsOf = (game: Game): number[][] =>
	Array.from({ length: SIZE }, (_, y) => [...game.cells.slice(y * SIZE, y * SIZE + SIZE)]);

/**
 * A move whose spawn is parked in the last free cell of the board, which on these fixtures is the
 * bottom-right corner. Every slide below asserts a row near the top, so the tile that arrives after
 * the slide cannot be mistaken for one the slide put there.
 */
const press = (game: Game, dir: Dir): Game => move(game, dir, fixed(1 - Number.EPSILON));

describe('start', () => {
	test('two tiles and nothing else', () => {
		const game = start(fixed(0));
		expect(game.cells.filter((n) => n !== 0).length).toBe(2);
		expect(game.cells.length).toBe(SIZE * SIZE);
		expect(game.score).toBe(0);
		expect(game.over).toBe(false);
	});

	test('a spawn is a 2 nine times out of ten and a 4 the tenth', () => {
		// Cell draw then value draw, twice. 0.95 is past the 0.9 line, so that tile is the 4.
		const game = start(fixed(0, 0.5, 0, 0.95));
		expect([...game.cells].sort((a, b) => b - a).slice(0, 2)).toEqual([4, 2]);
	});
});

describe('sliding', () => {
	test('a row closes up without merging unequal tiles', () => {
		const game = press(board([2, 0, 0, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
		expect(rowsOf(game)[0]).toEqual([2, 4, 0, 0]);
	});

	/** The one that matters. A tile that has merged is spent, so `2 2 4` is two tiles, not one. */
	test('a merged tile does not merge again in the same move', () => {
		const game = press(board([2, 2, 4, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
		expect(rowsOf(game)[0]).toEqual([4, 4, 0, 0]);
	});

	test('four of a kind is two pairs, not one tower', () => {
		const game = press(board([2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
		expect(rowsOf(game)[0]).toEqual([4, 4, 0, 0]);
		expect(game.score).toBe(8);
	});

	test('pairing runs from the leading edge, so the odd tile out is the trailing one', () => {
		const game = press(board([2, 2, 2, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
		expect(rowsOf(game)[0]).toEqual([4, 2, 0, 0]);
	});

	test('a merge scores what it made', () => {
		const game = press(board([4, 4, 0, 0], [8, 8, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
		expect(game.score).toBe(8 + 16);
	});

	test('every direction moves along its own axis', () => {
		const before = board([2, 0, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);

		expect(rowsOf(press(before, 'up'))[0][0]).toBe(4);
		expect(rowsOf(press(before, 'down'))[SIZE - 1][0]).toBe(4);
		// A vertical pair is not a horizontal one, so the sideways presses find nothing to merge.
		expect(press(before, 'left')).toBe(before);
		expect(rowsOf(press(before, 'right'))[0][SIZE - 1]).toBe(2);
	});

	/**
	 * A shift written against the flat array instead of against rows merges the end of one row into
	 * the start of the next. Nothing about the board says which it did until this case runs.
	 */
	test('a row does not merge into the row above it', () => {
		const game = press(board([0, 0, 0, 2], [2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
		expect(rowsOf(game)[0]).toEqual([2, 0, 0, 0]);
		expect(rowsOf(game)[1]).toEqual([2, 0, 0, 0]);
		expect(game.score).toBe(0);
	});
});

describe('a press that changes nothing', () => {
	test('is not a move, so it does not spawn', () => {
		const before = board([2, 4, 8, 16], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);
		expect(move(before, 'left')).toBe(before);
	});

	test('holds even when the board is otherwise full', () => {
		const full = board([2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]);
		expect(move(full, 'left')).toBe(full);
	});
});

describe('endings', () => {
	test('a full board with a pair in it is still playable', () => {
		const cells = board([2, 2, 4, 8], [4, 8, 16, 32], [2, 4, 8, 16], [4, 8, 16, 32]).cells;
		expect(stuck(cells)).toBe(false);
	});

	test('a full board with no pair anywhere is over', () => {
		const cells = board([2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]).cells;
		expect(stuck(cells)).toBe(true);
	});

	test('the move that fills the last cell is what ends it', () => {
		// Four values shifted a place per row, so no two neighbours are ever equal in either axis.
		// One cell short of full, and the press that closes it slides the top row and merges nothing.
		const before = board([4, 8, 16, 0], [4, 8, 16, 2], [8, 16, 2, 4], [16, 2, 4, 8]);
		const game = move(before, 'right', fixed(0, 0.5));

		expect(rowsOf(game)[0]).toEqual([2, 4, 8, 16]);
		expect(game.score).toBe(0);
		expect(game.over).toBe(true);
		expect(move(game, 'left', fixed(0))).toBe(game);
	});

	test('reaching the goal is a flag, not an ending', () => {
		const game = move(
			board([GOAL / 2, GOAL / 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]),
			'left',
			fixed(0, 0.5)
		);

		expect(game.cells.includes(GOAL)).toBe(true);
		expect(game.won).toBe(true);
		expect(game.over).toBe(false);
	});

	/**
	 * Played out rather than placed: every tile stays a power of two, the board stays its own size,
	 * and the run finishes. Reaching the end of the loop with no legal direction left and `over`
	 * still false would mean a board that `stuck` calls finished and `move` never marked, which is
	 * the one disagreement the two of them can have.
	 */
	test('a game played to the end stays a legal board and knows when it is finished', () => {
		let game = start(fixed(0, 0.5));

		for (let i = 0; i < 2000 && !game.over; i++) {
			const dir = DIRS.find((d) => move(game, d, fixed(0, 0.5)) !== game);
			if (dir === undefined) break;

			game = move(game, dir, fixed(0, 0.5));
			expect(game.cells.length).toBe(SIZE * SIZE);
			expect(game.cells.every((n) => n === 0 || Number.isInteger(Math.log2(n)))).toBe(true);
		}

		expect(game.over).toBe(true);
	});
});
