<script lang="ts">
	import { SIZE, start, step, TICK, turn, type Dir, type Game } from '$lib/snake';

	/**
	 * The clock, the keyboard and the grid. Every rule of the game lives in `$lib/snake`, which is
	 * pure, so this file only ever does three things: tick, steer, and draw.
	 */

	/**
	 * Deterministic to begin with, then placed for real on mount.
	 *
	 * Food is randomly placed, and a random position at init is one position on the server and a
	 * different one in the browser, which is a hydration mismatch. `/styleguide` renders every app
	 * at build time, so that is not hypothetical. The effect below reads nothing, so it runs once
	 * and never stomps a game in progress. That is also why it cannot be the writable `$derived`
	 * the linter would prefer: this is a value the game then goes on to own.
	 */
	// eslint-disable-next-line svelte/prefer-writable-derived
	let game = $state<Game>(start(() => 0));
	$effect(() => {
		game = start();
	});

	/** Whether the clock is running. Everything else about the phase is readable off the game. */
	let running = $state(false);

	/** Only so a stopped game can tell "not started yet" from "paused". */
	let started = $state(false);

	let board = $state<HTMLElement>();

	/**
	 * The board takes the keyboard when the window opens, for the reason `Terminal.svelte` gives at
	 * length and for the same mechanism: a frame later, because a child's effect runs before its
	 * parent's and doing it inline hands focus straight back to `WindowFrame`. A game that needs a
	 * Tab press before it takes an arrow key is a game nobody plays.
	 */
	$effect(() => {
		const frame = requestAnimationFrame(() => board?.focus());
		return () => cancelAnimationFrame(frame);
	});

	type Phase = 'ready' | 'running' | 'paused' | 'over';
	const phase = $derived<Phase>(
		game.over ? 'over' : running ? 'running' : started ? 'paused' : 'ready'
	);

	const label = $derived(
		{
			ready: 'Ready. Arrow keys to steer.',
			running: 'Playing. Space to pause.',
			paused: 'Paused.',
			over: game.won ? 'Board full. You win.' : 'Game over.'
		}[phase]
	);

	const KEYS: Record<string, Dir> = {
		ArrowUp: 'up',
		ArrowDown: 'down',
		ArrowLeft: 'left',
		ArrowRight: 'right',
		w: 'up',
		s: 'down',
		a: 'left',
		d: 'right'
	};

	/**
	 * The interval is the whole loop, and `$effect` is what owns its teardown, so nothing here
	 * registers a listener it has to remember to remove (ledger #2, #3). It depends on `running`
	 * and on nothing else: the read of `game` happens inside the callback, which is not tracked,
	 * so a tick does not tear the interval down and build a new one.
	 *
	 * The clock is not decoration, so `prefers-reduced-motion` does not touch it. A game that
	 * refuses to move is not a slower game, it is no game, and this one moves only because a
	 * visitor asked it to.
	 */
	$effect(() => {
		if (!running) return;

		const id = setInterval(() => {
			game = step(game);
			if (game.over) running = false;
		}, TICK);

		return () => clearInterval(id);
	});

	function begin(): void {
		game = start();
		running = true;
		started = true;
		board?.focus();
	}

	/** Steering is also how you start: the first arrow is the go signal, the way it always has been. */
	function steer(dir: Dir): void {
		if (game.over) return;
		game = turn(game, dir);
		running = true;
		started = true;
	}

	function onkeydown(event: KeyboardEvent): void {
		const dir = KEYS[event.key];
		if (dir) {
			// Or the arrows scroll the window body out from under the board.
			event.preventDefault();
			steer(dir);
			return;
		}

		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			if (game.over || !started) begin();
			else running = !running;
		}
	}
</script>

<div class="game">
	<!-- One live region for both readings, so a screen reader hears the phase and the score
	     together. Neither changes on a tick, only on a bite or a stop, so this stays quiet while
	     the snake is moving. -->
	<p class="status" role="status">
		<span>{label}</span>
		<span class="score">Score {game.score}</span>
	</p>

	<div class="stage">
		<!--
			`role="application"` and not a grid or a button: this is a surface whose keys belong to the
			app rather than to the reading cursor, which is the one thing that role is for. It carries
			its own instructions in the label, because there is no visual affordance to infer them from.

			The two ignores are that role not being on the compiler's interactive list. Both rules are
			asking for exactly what is already here, a focusable element that announces the keys it
			takes, so the alternative is calling the playfield a `<button>`, which is a larger lie than
			the warnings are worth.
		-->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			bind:this={board}
			class="board"
			style:--size={SIZE}
			tabindex="0"
			role="application"
			aria-label="Snake playfield. Arrow keys steer, space pauses."
			{onkeydown}
		>
			{#each game.snake as cell, i (i)}
				<span class="cell" class:head={i === 0} style:--x={cell.x} style:--y={cell.y}></span>
			{/each}
			<span class="cell food" style:--x={game.food.x} style:--y={game.food.y}></span>
		</div>

		{#if phase !== 'running'}
			<div class="overlay">
				<p>{label}</p>
				<button type="button" onclick={begin}>{started ? 'New game' : 'Start'}</button>
				{#if phase === 'paused'}
					<button type="button" onclick={() => ((running = true), board?.focus())}>Resume</button>
				{/if}
			</div>
		{/if}
	</div>

	<!--
		A pointer needs a way in too, and on a phone the window is full screen with no keyboard at
		all. Four buttons is the whole of it, and each one hands the keyboard back to the board so a
		mixed session does not have to keep re-finding it.
	-->
	<div class="pad" aria-label="Steer">
		{@render key('up', 'Up', '▲', 'u')}
		{@render key('left', 'Left', '◀', 'l')}
		{@render key('down', 'Down', '▼', 'd')}
		{@render key('right', 'Right', '▶', 'r')}
	</div>
</div>

{#snippet key(dir: Dir, name: string, glyph: string, area: string)}
	<button
		type="button"
		style:grid-area={area}
		aria-label={name}
		onclick={() => (steer(dir), board?.focus())}
	>
		<span aria-hidden="true">{glyph}</span>
	</button>
{/snippet}

<style>
	.game {
		display: grid;
		justify-items: center;
		gap: 0.75rem;
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		letter-spacing: var(--tracking-ui);
	}

	.status {
		display: flex;
		gap: 1rem;
		justify-content: space-between;
		width: min(100%, 24rem);
		color: var(--c-fg-3);
	}

	.score {
		color: var(--c-fg-1);
		font-family: var(--ff-mono);
		font-variant-numeric: tabular-nums;
	}

	.stage {
		position: relative;
		width: min(100%, 24rem);
	}

	.board {
		position: relative;
		aspect-ratio: 1;
		background: var(--c-surface-2);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-md);
		box-shadow: var(--bevel-in);
	}

	/* One cell of the board, placed by its grid coordinates. Percentages of the board rather than
	   pixels, so the whole thing scales with the window and nothing has to be measured. */
	.cell {
		position: absolute;
		width: calc(100% / var(--size));
		height: calc(100% / var(--size));
		inset-block-start: calc(var(--y) * 100% / var(--size));
		inset-inline-start: calc(var(--x) * 100% / var(--size));
		background: var(--c-fg-2);
		/* The ring is what separates two adjacent segments without a gap that would break the body. */
		box-shadow: inset 0 0 0 1px var(--c-surface-2);
	}

	.head {
		background: var(--c-fg-1);
	}

	/*
	   The only coloured thing on the board, and it is `--c-select` rather than `--c-accent` for the
	   reason the boot thermometer and the reader's progress bar already give: the selection
	   highlight is inside every skin's accent budget, retro's included, and a snake drawn in the
	   theme's ink with one lit target is what that budget buys.
	*/
	.food {
		background: var(--c-select);
		border-radius: 50%;
		box-shadow: none;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		gap: 0.75rem;
		justify-items: center;
		padding: 1rem;
		background: color-mix(in oklab, var(--c-surface-0) 82%, transparent);
		border-radius: var(--r-md);
		text-align: center;
	}

	.pad {
		display: grid;
		grid-template-areas: '. u .' 'l d r';
		gap: 0.25rem;
	}

	button {
		min-width: 2.5rem;
		min-height: 2.5rem;
		padding: 0.375rem 0.75rem;
		background: var(--c-surface-3);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-sm);
		box-shadow: var(--bevel-out);
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	button:active {
		box-shadow: var(--bevel-in);
	}
</style>
