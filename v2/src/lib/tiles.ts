/**
 * 2048, as pure state. Same split `$lib/snake` and `$lib/calc` use: functions from a game to the
 * next game, so every rule is a plain input-to-output assertion and the component is left holding
 * a keyboard and a grid of spans.
 *
 * Randomness is a parameter rather than a call to `Math.random`, which is the whole of what makes
 * a spawn testable. A move draws twice, once for the cell and once for the value, so a test hands
 * in a sequence.
 */

export type Dir = 'up' | 'down' | 'left' | 'right';
export type Random = () => number;

/** Cells per side. Four, which is the board the game is balanced on. */
export const SIZE = 4;

/** The tile the game is named for. */
export const GOAL = 2048;

export const DIRS: readonly Dir[] = ['up', 'down', 'left', 'right'];

export type Game = {
	/** Row-major, `SIZE * SIZE` long. A zero is an empty cell, so there is no tile record to key. */
	cells: readonly number[];
	score: number;
	/**
	 * A `GOAL` tile has appeared. Play continues past it, because stopping the game at the moment
	 * it is won is not the game: the flag is a readout, not an ending.
	 */
	won: boolean;
	/** No direction changes anything. */
	over: boolean;
};

/**
 * One line, slid toward index 0, and what it scored.
 *
 * The rule a naive version gets wrong: a tile that has just merged is spent for the rest of the
 * move. So `2 2 4` gives `4 4` and not `8`, and `2 2 2 2` gives `4 4` and not `8`. Pairing from the
 * leading edge and skipping past the partner is the whole of it.
 */
function slide(line: readonly number[]): { line: number[]; gained: number } {
	const tiles = line.filter((n) => n !== 0);
	const out: number[] = [];
	let gained = 0;

	for (let i = 0; i < tiles.length; i++) {
		if (tiles[i] === tiles[i + 1]) {
			const merged = tiles[i] * 2;
			out.push(merged);
			gained += merged;
			i++;
		} else {
			out.push(tiles[i]);
		}
	}

	while (out.length < line.length) out.push(0);
	return { line: out, gained };
}

const rows = (cells: readonly number[]): number[][] =>
	Array.from({ length: SIZE }, (_, y) => cells.slice(y * SIZE, y * SIZE + SIZE));

const transpose = (grid: number[][]): number[][] => grid[0].map((_, x) => grid.map((r) => r[x]));

const flip = (grid: number[][]): number[][] => grid.map((r) => [...r].reverse());

/**
 * Every direction is "toward index 0 of a line", so one `slide` covers all four: the vertical pair
 * transposes, the far pair reverses, and the same two operations undo it afterwards. Four hand-
 * written index walks is the other way, and three of them would be the one with the sign flipped.
 */
function shift(cells: readonly number[], dir: Dir): { cells: number[]; gained: number } {
	const vertical = dir === 'up' || dir === 'down';
	const far = dir === 'right' || dir === 'down';

	let grid = rows(cells);
	if (vertical) grid = transpose(grid);
	if (far) grid = flip(grid);

	let gained = 0;
	grid = grid.map((row) => {
		const slid = slide(row);
		gained += slid.gained;
		return slid.line;
	});

	if (far) grid = flip(grid);
	if (vertical) grid = transpose(grid);

	return { cells: grid.flat(), gained };
}

const same = (a: readonly number[], b: readonly number[]): boolean => a.every((n, i) => n === b[i]);

/** A tile in a free cell, 2 nine times out of ten, which is the ratio the original ships with. */
function place(cells: number[], random: Random): void {
	const free: number[] = [];
	cells.forEach((n, i) => {
		if (n === 0) free.push(i);
	});
	if (free.length === 0) return;

	cells[free[Math.floor(random() * free.length)]] = random() < 0.9 ? 2 : 4;
}

/**
 * No move left, which is not the same thing as a full board: a full board with two equal
 * neighbours is still playable, and calling that game over is the classic version of this bug.
 * Asking `shift` rather than scanning for pairs means the answer cannot disagree with the move.
 */
export function stuck(cells: readonly number[]): boolean {
	return DIRS.every((dir) => same(shift(cells, dir).cells, cells));
}

export function start(random: Random = Math.random): Game {
	const cells = new Array<number>(SIZE * SIZE).fill(0);
	place(cells, random);
	place(cells, random);
	return { cells, score: 0, won: false, over: false };
}

export function move(game: Game, dir: Dir, random: Random = Math.random): Game {
	if (game.over) return game;

	const { cells, gained } = shift(game.cells, dir);

	// A press that moves nothing is not a move, so it neither scores nor spawns. Spawning on a
	// blocked press is how a board fills up while the player is holding a key against a wall.
	if (same(cells, game.cells)) return game;

	const next = [...cells];
	place(next, random);

	return {
		cells: next,
		score: game.score + gained,
		// Read off the slid board, before the spawn, which can only ever add a 2 or a 4.
		won: game.won || cells.includes(GOAL),
		over: stuck(next)
	};
}
