import { describe, expect, test } from 'bun:test';
import { DIRS, GOAL, move, SIZE, start, stuck, type Dir, type Game, type Move } from './tiles';

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
	return { cells: grid.flat(), score: 0, won: false, over: false, moves: 0, last: null };
}

/** Any per-cell array cut into rows, so a move record can be read in the shape of the board it is about. */
const linesOf = <T>(cells: readonly T[]): T[][] =>
	Array.from({ length: SIZE }, (_, y) => [...cells.slice(y * SIZE, y * SIZE + SIZE)]);

const rowsOf = (game: Game): number[][] => linesOf(game.cells);

/** The move record. Absent only on a board nothing has been pressed on yet, which no case below is. */
function record(game: Game): Move {
	if (game.last === null) throw new Error('the move recorded nothing');
	return game.last;
}

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

/**
 * What the move did, which is the half of the state two boards a press apart cannot supply. Nothing
 * in the game reads it, so it is only ever as right as these cases: a wrong distance draws a tile
 * arriving from somewhere it never was, and the board it lands on is correct either way.
 */
describe('the move record', () => {
	test('a tile records how far it travelled to where it now is', () => {
		const game = press(board([2, 0, 0, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');

		expect(rowsOf(game)[0]).toEqual([2, 4, 0, 0]);
		// The 2 was already home. The 4 crossed two cells to sit beside it.
		expect(linesOf(record(game).from)[0]).toEqual([0, 2, 0, 0]);
	});

	/** A distance is a magnitude along whichever axis `dir` names, so the two presses agree on 3. */
	test('the distance is the same number whichever direction produced it', () => {
		const left = press(board([0, 0, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
		const right = press(board([2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'right');

		expect(record(left).dir).toBe('left');
		expect(record(left).from[0]).toBe(3);
		expect(record(right).dir).toBe('right');
		expect(record(right).from[SIZE - 1]).toBe(3);
	});

	test('a merge marks the cell it landed in', () => {
		const game = press(board([2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');

		expect(linesOf(record(game).merged)[0]).toEqual([true, false, false, false]);
		// Measured against the leading half, which was already there.
		expect(record(game).from[0]).toBe(0);
	});

	/**
	 * The case the ghost exists for. Both 2s end up in cell 0, and only one of them has a cell of its
	 * own to be drawn in: without the record of the other, a tile at the far edge vanishes on the spot
	 * while nothing anywhere moves.
	 */
	test('the consumed half of a merge is recorded with the distance it had to cover', () => {
		const game = press(board([2, 0, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');

		expect(rowsOf(game)[0][0]).toBe(4);
		expect(record(game).ghosts).toEqual([{ at: 0, from: 3 }]);
	});

	test('a move that merges nothing leaves no ghost', () => {
		const game = press(board([2, 0, 0, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
		expect(record(game).ghosts).toEqual([]);
	});

	/**
	 * The record rides through the same transposes the values do, so a vertical press has to land its
	 * distances in the same cells as its tiles. A record built against the flat array puts them in the
	 * right row and the wrong column, which draws every tile on the board sliding sideways.
	 */
	test('a vertical move puts the record in the same cell as the tile', () => {
		const game = press(board([0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 2, 0]), 'up');

		expect(rowsOf(game)[0]).toEqual([0, 0, 2, 0]);
		expect(linesOf(record(game).from)[0]).toEqual([0, 0, 3, 0]);
	});

	test('a vertical merge lands its mark and its ghost in the same column too', () => {
		const game = press(board([0, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 2, 0, 0]), 'up');

		expect(rowsOf(game)[0]).toEqual([0, 4, 0, 0]);
		expect(record(game).merged[1]).toBe(true);
		expect(record(game).ghosts).toEqual([{ at: 1, from: 3 }]);
	});

	/** The new tile arrived from nowhere, so it is drawn differently and must not read as a traveller. */
	test('the spawn is recorded where it landed, and it neither travelled nor merged', () => {
		const game = press(board([2, 0, 0, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
		const { spawn, from, merged } = record(game);

		expect([2, 4]).toContain(game.cells[spawn]);
		expect(from[spawn]).toBe(0);
		expect(merged[spawn]).toBe(false);
	});

	test('moves counts moves, which is what replays the drawing', () => {
		const before = board([2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);

		expect(start(fixed(0)).moves).toBe(0);
		expect(press(before, 'right').moves).toBe(1);
		expect(press(press(before, 'right'), 'down').moves).toBe(2);
		// The press that does nothing is not one of them, or the board redraws itself over a wall.
		expect(move(before, 'left').moves).toBe(0);
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

			// The record cannot point at an empty cell: nothing travels into one and nothing merges in
			// one, so this is the one way the board and the drawing of it can disagree over a whole game
			// rather than over a fixture. A ghost belongs to a merge or it belongs to nothing.
			const last = record(game);
			expect(last.from.every((d, i) => d === 0 || game.cells[i] !== 0)).toBe(true);
			expect(last.merged.every((m, i) => !m || game.cells[i] !== 0)).toBe(true);
			expect(last.ghosts.every((g) => g.from > 0 && last.merged[g.at])).toBe(true);
		}

		expect(game.over).toBe(true);
	});
});
