import { describe, expect, test } from 'bun:test';
import { SIZE, start, step, turn, type Dir, type Game, type Point } from './snake';

/**
 * The rules of the game, which is all of what `snake.ts` is. Three of these cover a bug the naive
 * version of this file ships with: the double turn that reverses into the neck, the tail cell that
 * is legal to move into, and food landing under the snake.
 */

/** Deterministic randomness. Always the first free cell, unless a sequence is handed in. */
function fixed(...values: number[]): () => number {
	let i = 0;
	return () => values[i++ % values.length] ?? 0;
}

/** A game placed by hand, so a rule can be tested without playing up to it. */
function board(snake: Point[], food: Point, dir: Dir = 'right'): Game {
	return { snake, dir, next: dir, food, score: 0, over: false, won: false };
}

const drive = (game: Game, ticks: number): Game => {
	let g = game;
	for (let i = 0; i < ticks; i++) g = step(g, fixed(0));
	return g;
};

describe('start', () => {
	test('three cells across the middle, heading right', () => {
		const game = start(fixed(0));
		expect(game.snake).toEqual([
			{ x: 8, y: 8 },
			{ x: 7, y: 8 },
			{ x: 6, y: 8 }
		]);
		expect(game.dir).toBe('right');
		expect(game.over).toBe(false);
		expect(game.score).toBe(0);
	});

	test('food is never under the snake', () => {
		// The middle row is occupied at x 6, 7 and 8, and cell 8*17+6 is the first of them. A
		// placement that counted every cell rather than the free ones would land on the body here.
		const target = (8 * SIZE + 6) / (SIZE * SIZE);
		const game = start(fixed(target));
		expect(game.snake.some((p) => p.x === game.food.x && p.y === game.food.y)).toBe(false);
	});
});

describe('turn', () => {
	test('a right angle takes', () => {
		expect(turn(start(fixed(0)), 'up').next).toBe('up');
	});

	test('straight back down the body does not', () => {
		expect(turn(start(fixed(0)), 'left').next).toBe('right');
	});

	test('the direction already travelled does not', () => {
		const game = start(fixed(0));
		expect(turn(game, 'right')).toBe(game);
	});

	/**
	 * The one that matters. Two turns inside a single tick are each legal against the pending
	 * direction and together they are a reversal, so measuring against `dir` is what keeps the
	 * snake out of its own neck.
	 */
	test('two turns inside one tick cannot add up to a reversal', () => {
		const game = turn(turn(start(fixed(0)), 'up'), 'left');
		expect(game.next).toBe('up');
		expect(step(game, fixed(0)).over).toBe(false);
	});

	test('a finished game does not steer', () => {
		const over = { ...start(fixed(0)), over: true };
		expect(turn(over, 'up')).toBe(over);
	});
});

describe('step', () => {
	test('moving keeps the length and drops the tail', () => {
		const game = step(start(fixed(0)), fixed(0));
		expect(game.snake.length).toBe(3);
		expect(game.snake[0]).toEqual({ x: 9, y: 8 });
		expect(game.snake).not.toContainEqual({ x: 6, y: 8 });
	});

	test('a wall ends it', () => {
		const game = board([{ x: SIZE - 1, y: 4 }], { x: 0, y: 0 });
		expect(step(game, fixed(0)).over).toBe(true);
	});

	test('every wall ends it, not just the one the snake starts pointed at', () => {
		const edges: [Dir, Point][] = [
			['up', { x: 4, y: 0 }],
			['down', { x: 4, y: SIZE - 1 }],
			['left', { x: 0, y: 4 }],
			['right', { x: SIZE - 1, y: 4 }]
		];
		for (const [dir, head] of edges) {
			expect(step(board([head], { x: 8, y: 8 }, dir), fixed(0)).over).toBe(true);
		}
	});

	test('biting the body ends it', () => {
		// A closed loop with the head one cell above its own flank, turning down into it.
		const snake = [
			{ x: 5, y: 5 },
			{ x: 6, y: 5 },
			{ x: 6, y: 6 },
			{ x: 5, y: 6 },
			{ x: 4, y: 6 }
		];
		expect(step({ ...board(snake, { x: 0, y: 0 }), dir: 'left', next: 'down' }).over).toBe(true);
	});

	test('the tail cell is free to move into, because it empties on the same tick', () => {
		// Head at 5,5 walking down onto 5,6, which is the tail and will be gone by the time it lands.
		const snake = [
			{ x: 5, y: 5 },
			{ x: 6, y: 5 },
			{ x: 6, y: 6 },
			{ x: 5, y: 6 }
		];
		const game = step({ ...board(snake, { x: 0, y: 0 }), dir: 'left', next: 'down' }, fixed(0));
		expect(game.over).toBe(false);
		expect(game.snake[0]).toEqual({ x: 5, y: 6 });
	});

	test('eating grows it, scores it, and moves the food', () => {
		const before = board(
			[
				{ x: 4, y: 4 },
				{ x: 3, y: 4 }
			],
			{ x: 5, y: 4 }
		);
		const after = step(before, fixed(0));
		expect(after.score).toBe(1);
		expect(after.snake.length).toBe(3);
		expect(after.food).not.toEqual({ x: 5, y: 4 });
		expect(after.snake.some((p) => p.x === after.food.x && p.y === after.food.y)).toBe(false);
	});

	test('a finished game stays finished and stops moving', () => {
		const over = { ...start(fixed(0)), over: true };
		expect(step(over, fixed(0))).toBe(over);
	});

	test('the last free cell is the win, not another placement', () => {
		// Every cell but the last, laid boustrophedon so consecutive entries are neighbours, with the
		// head one move short of the end. There is no free cell left to put food in after that bite.
		const cells: Point[] = [];
		for (let y = 0; y < SIZE; y++) {
			for (let x = 0; x < SIZE; x++) cells.push({ x: y % 2 === 0 ? x : SIZE - 1 - x, y });
		}

		const food = cells[cells.length - 1];
		const snake = cells.slice(0, -1).reverse();
		const game = step(board(snake, food, SIZE % 2 === 1 ? 'right' : 'left'), fixed(0));

		expect(game.over).toBe(true);
		expect(game.won).toBe(true);
		expect(game.snake.length).toBe(SIZE * SIZE);
	});

	test('a straight run from the start hits the right wall and nothing before it', () => {
		// Eight cells of clearance, so the ninth tick is the wall. Food sits off the row it walks.
		const game = { ...start(fixed(0)), food: { x: 2, y: 2 } };
		expect(drive(game, 8).over).toBe(false);
		expect(drive(game, 9).over).toBe(true);
	});
});
