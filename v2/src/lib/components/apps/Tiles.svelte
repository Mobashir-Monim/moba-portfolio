<script lang="ts">
	import { GOAL, move, SIZE, start, type Dir, type Game } from '$lib/tiles';

	/**
	 * The keyboard and the grid. Every rule lives in `$lib/tiles`, which is pure, so this file only
	 * ever does two things: steer and draw. There is no clock, which is the whole difference between
	 * this app and Snake.
	 */

	/**
	 * Deterministic to begin with, then placed for real on mount, for the reason `Snake.svelte`
	 * gives: `/styleguide` renders every app in the roster at build time, and a random opening
	 * position is one board on the server and a different one in the browser. The effect reads
	 * nothing, so it runs once and never stomps a game in progress.
	 */
	// eslint-disable-next-line svelte/prefer-writable-derived
	let game = $state<Game>(start(() => 0));
	$effect(() => {
		game = start();
	});

	let board = $state<HTMLElement>();

	/**
	 * The board takes the keyboard a frame after the window opens, for the reason `Terminal.svelte`
	 * gives at length: a child's effect runs before its parent's, so doing it inline hands focus
	 * straight back to `WindowFrame`.
	 */
	$effect(() => {
		const frame = requestAnimationFrame(() => board?.focus());
		return () => cancelAnimationFrame(frame);
	});

	const label = $derived(
		game.over
			? 'No moves left.'
			: game.won
				? `${GOAL} reached. Keep going.`
				: 'Arrow keys slide the board.'
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

	function slide(dir: Dir): void {
		game = move(game, dir);
	}

	function onkeydown(event: KeyboardEvent): void {
		const dir = KEYS[event.key];
		if (!dir) return;

		// Or the arrows scroll the window body out from under the board.
		event.preventDefault();
		slide(dir);
	}

	/**
	 * How lit a tile is, on a scale the whole ramp fits in: 2 is the first step and 2048 is the
	 * eleventh, so `GOAL` arrives at full and anything past it stays there.
	 */
	const lit = (value: number): number => Math.min(1, Math.log2(value) / Math.log2(GOAL));
</script>

<div class="game">
	<div class="bar">
		<!-- One live region for the phase and the score together, so a screen reader hears the move
		     that ended the game rather than only the board going quiet. -->
		<p class="status" role="status">
			<span>{label}</span>
			<span class="score">Score {game.score}</span>
		</p>
		<button type="button" onclick={() => ((game = start()), board?.focus())}>New game</button>
	</div>

	<div class="stage">
		<!--
			`role="application"` and not a grid, for the reason `Snake.svelte` gives and 2.9 settled: a
			`role="grid"` promises that the arrows move a reading cursor, and here they move the whole
			board. The keys belong to the app, which is the one thing this role is for, and the label
			carries the instructions because there is no affordance to infer them from.

			The two ignores are that role not being on the compiler's interactive list. The alternative
			is calling the playfield a `<button>`, which is a larger lie than the warnings are worth.
		-->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			bind:this={board}
			class="board"
			style:--size={SIZE}
			tabindex="0"
			role="application"
			aria-label="{GOAL} board. Arrow keys slide every tile at once."
			{onkeydown}
		>
			{#each game.cells as value, i (i)}
				<span
					class="cell"
					class:filled={value !== 0}
					class:goal={value >= GOAL}
					class:d3={value >= 100}
					class:d4={value >= 1000}
					style:--lit={value === 0 ? 0 : lit(value)}
				>
					{value === 0 ? '' : value}
				</span>
			{/each}
		</div>

		{#if game.over}
			<div class="overlay"><p>{label}</p></div>
		{/if}
	</div>

	<!--
		A pointer needs a way in too, and on a phone the window is full screen with no keyboard at
		all. Four buttons is the whole of it, and each one hands the keyboard back to the board so a
		mixed session does not have to keep re-finding it.

		One row rather than Snake's cross, because these four are not steering: every press slides the
		whole board, so there is no heading for the layout to stand for, and the row is what keeps the
		app inside a default window instead of below its fold.
	-->
	<div class="pad" aria-label="Slide">
		{@render key('left', 'Left', '◀')}
		{@render key('up', 'Up', '▲')}
		{@render key('down', 'Down', '▼')}
		{@render key('right', 'Right', '▶')}
	</div>
</div>

{#snippet key(dir: Dir, name: string, glyph: string)}
	<button type="button" aria-label={name} onclick={() => (slide(dir), board?.focus())}>
		<span aria-hidden="true">{glyph}</span>
	</button>
{/snippet}

<style>
	.game {
		/* The board is square, so its width is also its height, and the whole app has to clear the
		   readout and the pad inside a window that opens around 384px tall. 17rem is what fits. */
		--w: 17rem;

		display: grid;
		justify-items: center;
		align-content: start;
		gap: 0.5rem;
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		letter-spacing: var(--tracking-ui);
	}

	.bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		width: min(100%, var(--w));
	}

	/* Small enough that the longest of the three labels clears the New game button on one line: the
	   bar is capped at the board's width, so a wrap here pushes the board down the window. */
	.status {
		display: grid;
		flex: 1;
		gap: 0.125rem;
		color: var(--c-fg-3);
		font-size: var(--fs-xs);
	}

	.score {
		color: var(--c-fg-1);
		font-family: var(--ff-mono);
		font-variant-numeric: tabular-nums;
	}

	.stage {
		position: relative;
		width: min(100%, var(--w));
	}

	.board {
		display: grid;
		grid-template-columns: repeat(var(--size), 1fr);
		gap: 0.25rem;
		aspect-ratio: 1;
		padding: 0.25rem;
		background: var(--c-surface-2);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-md);
		box-shadow: var(--bevel-in);
	}

	/*
	   A tile keeps one foreground on one background whatever it is worth, which is the same pair the
	   calculator's keys use and one `tokens.test.ts` already checks in all 24 combinations. The value
	   is spent on a ring instead: a mix of `--c-select` that thickens and strengthens as the tile
	   climbs, so the ramp is readable across the board without putting text on a colour nothing has
	   measured. `--c-select` rather than `--c-accent` for the reason the boot thermometer already
	   gives: the selection highlight is inside every skin's accent budget, retro's included.

	   The ring is an `outline` and not a second `box-shadow`, because the shadow slot already holds
	   `var(--bevel-out)` and two of the three skins resolve that to `none`. A `none` inside a
	   comma-separated shadow list is invalid, and the whole declaration is dropped: the ramp rendered
	   in retro and nowhere else, which looks exactly like a ramp that is too subtle.
	*/
	.cell {
		display: grid;
		place-items: center;
		border-radius: var(--r-sm);
		font-family: var(--ff-mono);
		font-size: var(--fs-xl);
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.filled {
		background: var(--c-surface-3);
		color: var(--c-fg-1);
		box-shadow: var(--bevel-out);
		outline: calc(1px + var(--lit) * 2px) solid
			color-mix(in oklab, var(--c-select) calc(var(--lit) * 100%), transparent);
		outline-offset: calc(-1px - var(--lit) * 2px);
	}

	/* The tile the game is named for, and the one moment worth spending the highlight itself on. */
	.goal {
		background: var(--c-select);
		color: var(--c-on-select);
		outline-color: var(--c-select);
	}

	/* Four digits in a quarter of the board, so the type steps down rather than the tile wrapping. */
	.d3 {
		font-size: var(--fs-lg);
	}

	.d4 {
		font-size: var(--fs-base);
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		padding: 1rem;
		background: color-mix(in oklab, var(--c-surface-0) 82%, transparent);
		border-radius: var(--r-md);
		text-align: center;
	}

	/* On its own panel, or the line reads as one more tile with words in it. */
	.overlay p {
		padding: 0.5rem 0.75rem;
		background: var(--c-surface-1);
		border: var(--bw-strong) solid var(--c-line-strong);
		border-radius: var(--r-sm);
		box-shadow: var(--elev-2);
	}

	.pad {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
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
