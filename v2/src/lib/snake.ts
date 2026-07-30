/**
 * Snake, as pure state.
 *
 * Same split `$lib/terminal` uses and for the same reason: everything here is a function from a
 * game to the next game, so every rule of the game is a plain input-to-output assertion and the
 * component is left holding a clock, a keyboard, and a grid of divs.
 *
 * Randomness is a parameter rather than a call to `Math.random`, which is the whole of what makes
 * food placement testable. The component passes nothing and gets the real thing.
 */

export type Point = { x: number; y: number };
export type Dir = 'up' | 'down' | 'left' | 'right';
export type Random = () => number;

/** Cells per side. Odd, so the snake starts on the middle cell rather than beside it. */
export const SIZE = 17;

/** Milliseconds per tick. Fixed: a snake that speeds up is a difficulty curve nobody asked for. */
export const TICK = 110;

export type Game = {
	/** Head first, one entry per occupied cell. */
	snake: Point[];
	/**
	 * The direction the last tick actually moved in. A reversal is measured against this and never
	 * against `next`, or two turns inside one tick fold the snake into its own neck: pressing up
	 * then left while moving right is legal twice over and still kills you.
	 */
	dir: Dir;
	/** What the next tick will move in. */
	next: Dir;
	food: Point;
	score: number;
	over: boolean;
	/** The board filled, which is the only way this ends well. */
	won: boolean;
};

const STEP: Record<Dir, Point> = {
	up: { x: 0, y: -1 },
	down: { x: 0, y: 1 },
	left: { x: -1, y: 0 },
	right: { x: 1, y: 0 }
};

const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

const same = (a: Point, b: Point): boolean => a.x === b.x && a.y === b.y;

/** Every cell the snake is not on, so food never spawns underneath it. */
function free(snake: readonly Point[]): Point[] {
	const taken = new Set(snake.map((p) => `${p.x},${p.y}`));
	const cells: Point[] = [];
	for (let y = 0; y < SIZE; y++) {
		for (let x = 0; x < SIZE; x++) if (!taken.has(`${x},${y}`)) cells.push({ x, y });
	}
	return cells;
}

function pick(cells: readonly Point[], random: Random): Point {
	return cells[Math.floor(random() * cells.length)];
}

export function start(random: Random = Math.random): Game {
	const mid = (SIZE - 1) / 2;
	const snake = [
		{ x: mid, y: mid },
		{ x: mid - 1, y: mid },
		{ x: mid - 2, y: mid }
	];

	return {
		snake,
		dir: 'right',
		next: 'right',
		food: pick(free(snake), random),
		score: 0,
		over: false,
		won: false
	};
}

/** A turn into the direction already travelled, or straight back down the body, is not a turn. */
export function turn(game: Game, dir: Dir): Game {
	if (game.over || dir === game.dir || dir === OPPOSITE[game.dir]) return game;
	return { ...game, next: dir };
}

export function step(game: Game, random: Random = Math.random): Game {
	if (game.over) return game;

	const dir = game.next;
	const head = { x: game.snake[0].x + STEP[dir].x, y: game.snake[0].y + STEP[dir].y };

	if (head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE) {
		return { ...game, dir, over: true };
	}

	// The tail cell empties on this same tick unless the snake is growing into it, so chasing your
	// own tail is legal and biting anything else is not.
	const eating = same(head, game.food);
	const body = eating ? game.snake : game.snake.slice(0, -1);
	if (body.some((p) => same(p, head))) return { ...game, dir, over: true };

	const snake = [head, ...body];
	if (!eating) return { ...game, dir, snake };

	// Nowhere left to put the next one means the board is full, which is the win and the one ending
	// that is not a death.
	const cells = free(snake);
	const score = game.score + 1;
	return cells.length === 0
		? { ...game, dir, snake, score, over: true, won: true }
		: { ...game, dir, snake, score, food: pick(cells, random) };
}
