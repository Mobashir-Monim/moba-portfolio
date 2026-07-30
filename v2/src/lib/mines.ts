/**
 * Minesweeper, as pure state. Same split `$lib/tiles` and `$lib/snake` use: functions from a game
 * to the next game, so the component holds a grid of buttons and a cursor and nothing else.
 *
 * Randomness is a parameter, which here buys more than a testable spawn: the mines are placed by it,
 * so the rule that the first click is never a mine is checkable by handing in the worst draw there
 * is rather than by playing until it happens.
 */

export type Random = () => number;

export const COLS = 9;
export const ROWS = 9;

/** Ten in eighty-one, which is the density the 9x9 board has always been played at. */
export const MINES = 10;

export type State = 'hidden' | 'flagged' | 'revealed';
export type Cell = { mine: boolean; state: State };

export type Game = {
	/** Row-major, `ROWS * COLS` long. */
	cells: readonly Cell[];
	/** Whether the mines exist yet. They do not until the first reveal. */
	placed: boolean;
	/** A mine was revealed. */
	over: boolean;
	/** Every cell that is not a mine was revealed, which is the win however many flags are out. */
	won: boolean;
};

/**
 * The eight cells around `i`, and the reason this is a function rather than `i ± 1` and `i ± COLS`
 * written inline: one to the left of column 0 is the last cell of the row above. That wrap is
 * invisible until a count beside an edge reads one too high, and then it is invisible in a way that
 * looks like bad luck.
 */
export function neighbours(i: number): number[] {
	const x = i % COLS;
	const y = Math.floor(i / COLS);
	const out: number[] = [];

	for (let dy = -1; dy <= 1; dy++) {
		for (let dx = -1; dx <= 1; dx++) {
			if (dx === 0 && dy === 0) continue;
			const nx = x + dx;
			const ny = y + dy;
			if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) out.push(ny * COLS + nx);
		}
	}

	return out;
}

/** Mines beside `i`. Derived rather than stored, so it cannot disagree with where the mines are. */
export function count(cells: readonly Cell[], i: number): number {
	return neighbours(i).filter((n) => cells[n].mine).length;
}

export const flags = (cells: readonly Cell[]): number =>
	cells.filter((c) => c.state === 'flagged').length;

/** What the counter over the board reads. Goes negative, the way every version of this does. */
export const remaining = (cells: readonly Cell[]): number => MINES - flags(cells);

const cleared = (cells: readonly Cell[]): boolean =>
	cells.every((c) => c.mine || c.state === 'revealed');

export function start(): Game {
	return {
		cells: Array.from({ length: ROWS * COLS }, () => ({ mine: false, state: 'hidden' as State })),
		placed: false,
		over: false,
		won: false
	};
}

/**
 * Mines, placed after the first reveal and never under it or beside it. Excluding the neighbours as
 * well as the cell itself is what makes the first click open a region instead of a lone number,
 * which is the difference between a game and a guess.
 */
function scatter(cells: Cell[], first: number, random: Random): void {
	const safe = new Set([first, ...neighbours(first)]);
	const pool = cells.map((_, i) => i).filter((i) => !safe.has(i));

	for (let n = 0; n < MINES && pool.length > 0; n++) {
		const [i] = pool.splice(Math.floor(random() * pool.length), 1);
		cells[i] = { ...cells[i], mine: true };
	}
}

/**
 * Reveal, and keep going outward while a cell has no mine beside it.
 *
 * A stack rather than recursion, and a cell is marked as it is pushed rather than as it is popped:
 * marked on pop, an open field is walked into from every one of its neighbours in turn, which is
 * both slow and, on a board large enough, a blown stack.
 *
 * A flag stops the fill, because `hidden` is the only state it expands into. That is the flag doing
 * its job: it is a note that says do not open this.
 */
function flood(cells: Cell[], from: number): void {
	const stack = [from];
	cells[from] = { ...cells[from], state: 'revealed' };

	for (let i = stack.pop(); i !== undefined; i = stack.pop()) {
		if (count(cells, i) !== 0) continue;

		for (const n of neighbours(i)) {
			if (cells[n].state !== 'hidden' || cells[n].mine) continue;
			cells[n] = { ...cells[n], state: 'revealed' };
			stack.push(n);
		}
	}
}

export function reveal(game: Game, i: number, random: Random = Math.random): Game {
	if (game.over || game.won) return game;
	if (game.cells[i].state !== 'hidden') return game;

	const cells = [...game.cells];
	if (!game.placed) scatter(cells, i, random);

	// Losing shows every mine, or the player is told they lost and not what by.
	if (cells[i].mine) {
		return {
			cells: cells.map((c) => (c.mine ? { ...c, state: 'revealed' } : c)),
			placed: true,
			over: true,
			won: false
		};
	}

	flood(cells, i);
	return { cells, placed: true, over: false, won: cleared(cells) };
}

/** A flag goes on and comes off a hidden cell. A revealed one has nothing left to mark. */
export function flag(game: Game, i: number): Game {
	if (game.over || game.won) return game;

	const cell = game.cells[i];
	if (cell.state === 'revealed') return game;

	const cells = [...game.cells];
	cells[i] = { ...cell, state: cell.state === 'flagged' ? 'hidden' : 'flagged' };
	return { ...game, cells };
}
