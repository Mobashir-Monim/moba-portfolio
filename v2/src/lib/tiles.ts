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

/**
 * What the last move did, which is the one thing the board's own contents cannot say: two boards a
 * press apart do not record which tile came from where, and that is exactly what has to be drawn
 * for the move to read as a move rather than as a cut.
 *
 * Distances rather than source indices, because the mover only ever travels toward index 0 of its
 * own line and the component knows the axis from `dir`. A distance survives the transposes below
 * unchanged; an index would have to be remapped by each one.
 */
export type Move = {
	/** The direction pressed, which is the axis and the sign the distances below are along. */
	dir: Dir;
	/** Cells travelled by the tile now at each index. Zero where nothing arrived and where nothing moved. */
	from: readonly number[];
	/** Where two tiles became one. */
	merged: readonly boolean[];
	/**
	 * The half of each merge that was consumed: where it ended up and how far it came. A merge has
	 * two sources and one destination, so one of them has no cell of its own to be drawn in, and
	 * without this it vanishes on the spot while the other slides.
	 */
	ghosts: readonly { at: number; from: number }[];
	/** Where the new tile landed. `-1` on the opening board, which spawns two and moves nothing. */
	spawn: number;
};

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
	/**
	 * Successful moves so far, and the only reason it is here: a CSS animation plays when its
	 * element is created, so the component keys its cells by this to replay one per move. A blocked
	 * press is not a move and does not increment it, which is what keeps the board still.
	 */
	moves: number;
	/** `null` before the first move. */
	last: Move | null;
};

/** One line, slid toward index 0: what it holds now, what it scored, and where each of those came from. */
type Slid = {
	line: number[];
	gained: number;
	from: number[];
	merged: boolean[];
	/** Aligned to `line`, so it transposes with everything else. `0` where the tile did not merge. */
	ghost: number[];
};

/**
 * The rule a naive version gets wrong: a tile that has just merged is spent for the rest of the
 * move. So `2 2 4` gives `4 4` and not `8`, and `2 2 2 2` gives `4 4` and not `8`. Pairing from the
 * leading edge and skipping past the partner is the whole of it.
 *
 * Tiles carry the index they came from, which the value-only version threw away.
 */
function slide(line: readonly number[]): Slid {
	const tiles: { value: number; at: number }[] = [];
	line.forEach((value, at) => {
		if (value !== 0) tiles.push({ value, at });
	});

	const out: number[] = [];
	const from: number[] = [];
	const merged: boolean[] = [];
	const ghost: number[] = [];
	let gained = 0;

	for (let i = 0; i < tiles.length; i++) {
		const dest = out.length;
		const pair = i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value;

		out.push(pair ? tiles[i].value * 2 : tiles[i].value);
		// Measured against the leading half, because that is the one whose journey ends where the
		// surviving tile ends. The trailing half is the ghost.
		from.push(tiles[i].at - dest);
		merged.push(pair);
		ghost.push(pair ? tiles[i + 1].at - dest : 0);

		if (pair) {
			gained += tiles[i].value * 2;
			i++;
		}
	}

	while (out.length < line.length) {
		out.push(0);
		from.push(0);
		merged.push(false);
		ghost.push(0);
	}

	return { line: out, gained, from, merged, ghost };
}

const rows = <T>(cells: readonly T[]): T[][] =>
	Array.from({ length: SIZE }, (_, y) => cells.slice(y * SIZE, y * SIZE + SIZE));

const transpose = <T>(grid: T[][]): T[][] => grid[0].map((_, x) => grid.map((r) => r[x]));

const flip = <T>(grid: T[][]): T[][] => grid.map((r) => [...r].reverse());

type Shifted = Omit<Slid, 'line'> & { cells: number[] };

/**
 * Every direction is "toward index 0 of a line", so one `slide` covers all four: the vertical pair
 * transposes, the far pair reverses, and the same two operations undo it afterwards. Four hand-
 * written index walks is the other way, and three of them would be the one with the sign flipped.
 *
 * The three animation grids ride along through the same two operations, which is the whole reason
 * `rows`, `transpose` and `flip` are generic now: a per-cell scalar reorients exactly like a value
 * does, so there is no second mapping to keep in step with this one.
 */
function shift(cells: readonly number[], dir: Dir): Shifted {
	const vertical = dir === 'up' || dir === 'down';
	const far = dir === 'right' || dir === 'down';

	const orient = <T>(grid: T[][]): T[][] => {
		let g = grid;
		if (vertical) g = transpose(g);
		if (far) g = flip(g);
		return g;
	};

	// Both operations are their own inverse, so undoing them is applying them in the other order.
	const restore = <T>(grid: T[][]): T[][] => {
		let g = grid;
		if (far) g = flip(g);
		if (vertical) g = transpose(g);
		return g;
	};

	const out: number[][] = [];
	const from: number[][] = [];
	const merged: boolean[][] = [];
	const ghost: number[][] = [];
	let gained = 0;

	for (const line of orient(rows(cells))) {
		const slid = slide(line);
		gained += slid.gained;
		out.push(slid.line);
		from.push(slid.from);
		merged.push(slid.merged);
		ghost.push(slid.ghost);
	}

	return {
		cells: restore(out).flat(),
		gained,
		from: restore(from).flat(),
		merged: restore(merged).flat(),
		ghost: restore(ghost).flat()
	};
}

const same = (a: readonly number[], b: readonly number[]): boolean => a.every((n, i) => n === b[i]);

/**
 * A tile in a free cell, 2 nine times out of ten, which is the ratio the original ships with.
 * Returns where it landed, or `-1` on a board with nowhere to put one, because the component draws
 * a new tile differently from one that arrived under its own steam.
 */
function place(cells: number[], random: Random): number {
	const free: number[] = [];
	cells.forEach((n, i) => {
		if (n === 0) free.push(i);
	});
	if (free.length === 0) return -1;

	const at = free[Math.floor(random() * free.length)];
	cells[at] = random() < 0.9 ? 2 : 4;
	return at;
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
	return { cells, score: 0, won: false, over: false, moves: 0, last: null };
}

export function move(game: Game, dir: Dir, random: Random = Math.random): Game {
	if (game.over) return game;

	const shifted = shift(game.cells, dir);

	// A press that moves nothing is not a move, so it neither scores nor spawns. Spawning on a
	// blocked press is how a board fills up while the player is holding a key against a wall.
	if (same(shifted.cells, game.cells)) return game;

	const next = [...shifted.cells];
	const spawn = place(next, random);

	return {
		cells: next,
		score: game.score + shifted.gained,
		// Read off the slid board, before the spawn, which can only ever add a 2 or a 4.
		won: game.won || shifted.cells.includes(GOAL),
		over: stuck(next),
		moves: game.moves + 1,
		last: {
			dir,
			from: shifted.from,
			merged: shifted.merged,
			// A ghost's own distance is at least one cell further than the tile it merged into, so a
			// zero here is the absence of a merge rather than a merge that went nowhere.
			ghosts: shifted.ghost.flatMap((d, at) => (d > 0 ? [{ at, from: d }] : [])),
			spawn
		}
	};
}
