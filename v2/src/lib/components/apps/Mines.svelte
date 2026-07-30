<script lang="ts">
	import { COLS, count, flag, MINES, remaining, reveal, start, type Cell } from '$lib/mines';
	import { nextIndex } from '$lib/roving';

	/**
	 * The grid and the cursor. Every rule lives in `$lib/mines`, which is pure, so this file opens
	 * cells, marks them, and moves the keyboard between them.
	 */

	let game = $state(start());

	/** Which cell holds the tab stop. Roving, so the board is one stop and the arrows do the rest. */
	let cursor = $state(0);

	/** For a pointer with no second button, which on a phone is every pointer. */
	let flagMode = $state(false);

	let board = $state<HTMLElement>();

	const focusCell = (i: number): void =>
		board?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.focus();

	/**
	 * The board takes the keyboard a frame after the window opens, for the reason `Terminal.svelte`
	 * gives at length: a child's effect runs before its parent's, so doing it inline hands focus
	 * straight back to `WindowFrame`.
	 */
	$effect(() => {
		const frame = requestAnimationFrame(() => focusCell(cursor));
		return () => cancelAnimationFrame(frame);
	});

	const label = $derived(
		game.over ? 'A mine. Game over.' : game.won ? 'Board cleared.' : 'Open a cell. F flags one.'
	);

	/**
	 * Where the last reveal was pressed, which is where the ripple starts. A flood opens a whole
	 * region in one frame, and one frame is the difference between a region opening and a region
	 * having always been open: nothing on screen says the press caused it.
	 */
	let origin = $state(0);

	/** Rings out from the press, so a diagonal neighbour arrives with the ones beside it. */
	const ring = (i: number): number =>
		Math.max(
			Math.abs((i % COLS) - (origin % COLS)),
			Math.abs(Math.floor(i / COLS) - Math.floor(origin / COLS))
		);

	function open(i: number): void {
		if (flagMode) {
			game = flag(game, i);
			return;
		}

		origin = i;
		game = reveal(game, i);
	}

	function mark(event: Event, i: number): void {
		// Or the browser's own menu covers the board on the press that was meant to plant a flag.
		event.preventDefault();
		game = flag(game, i);
	}

	function onkeydown(event: KeyboardEvent, i: number): void {
		if (event.key === 'f' || event.key === 'F') {
			event.preventDefault();
			game = flag(game, i);
			return;
		}

		// `nextIndex` is 2.9's arithmetic, tested there: a step off the edge stays put rather than
		// clamping into range, and the columns are declared here because this grid does not wrap.
		const next = nextIndex(event.key, i, game.cells.length, COLS);
		if (next === undefined) return;

		// The arrows scroll the window body otherwise, and what wants looking at is the new cell.
		event.preventDefault();
		cursor = next;
		focusCell(next);
	}

	function restart(): void {
		game = start();
		cursor = 0;
		focusCell(0);
	}

	const where = (i: number): string => `Row ${Math.floor(i / COLS) + 1}, column ${(i % COLS) + 1}`;

	function glyph(cell: Cell, i: number): string {
		if (cell.state === 'flagged') return '⚑';
		if (cell.state !== 'revealed') return '';
		if (cell.mine) return '✷';

		const near = count(game.cells, i);
		return near === 0 ? '' : String(near);
	}

	/**
	 * The accessible name, which is the whole reason a cell is a real button: hidden, flagged, empty
	 * and a count all look different and would otherwise all read as an unlabelled control.
	 */
	function name(cell: Cell, i: number): string {
		if (cell.state === 'flagged') return `${where(i)}, flagged`;
		if (cell.state !== 'revealed') return `${where(i)}, hidden`;
		if (cell.mine) return `${where(i)}, mine`;

		const near = count(game.cells, i);
		return `${where(i)}, ${near === 0 ? 'empty' : `${near} ${near === 1 ? 'mine' : 'mines'} nearby`}`;
	}
</script>

<div class="game">
	<div class="bar">
		<!-- One live region for the phase and the counter together, so the press that ends the game
		     is spoken rather than only drawn. -->
		<p class="status" role="status">
			<span>{label}</span>
			<span class="count">{remaining(game.cells)} of {MINES} unflagged</span>
		</p>
		<button type="button" onclick={restart}>New game</button>
	</div>

	<!--
		Plain buttons in a grid, and deliberately not `role="grid"`: that role promises a composite
		widget whose rows and cells are its own structure, and 2.9 settled that a role which announces
		behaviour nothing implements is worse than no role. A button is reachable, Enter and Space
		already open it, and the arrows are added on top of that.

		The tab stop roves, so the board is one stop rather than eighty-one. Eighty-one is the version
		that is technically more conventional and unusable for the person it would be serving: every
		one of them stands between the board and whatever follows it.
	-->
	<div bind:this={board} class="board" style:--size={COLS} aria-label="Minefield">
		{#each game.cells as cell, i (i)}
			<button
				type="button"
				class="cell"
				class:closed={cell.state === 'hidden'}
				class:flagged={cell.state === 'flagged'}
				class:opened={cell.state === 'revealed'}
				class:mine={cell.state === 'revealed' && cell.mine}
				data-i={i}
				style:--d={ring(i)}
				tabindex={i === cursor ? 0 : -1}
				aria-label={name(cell, i)}
				onfocus={() => (cursor = i)}
				onclick={() => open(i)}
				oncontextmenu={(event) => mark(event, i)}
				onkeydown={(event) => onkeydown(event, i)}
			>
				<span aria-hidden="true">{glyph(cell, i)}</span>
			</button>
		{/each}
	</div>

	<button type="button" class="mode" aria-pressed={flagMode} onclick={() => (flagMode = !flagMode)}>
		Flag mode {flagMode ? 'on' : 'off'}
	</button>
</div>

<style>
	.game {
		/* The board is square, so its width is also its height, and the whole app has to clear the
		   readout and the mode button inside a window that opens around 384px tall. */
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

	.status {
		display: grid;
		flex: 1;
		gap: 0.125rem;
		color: var(--c-fg-3);
		font-size: var(--fs-xs);
	}

	.count {
		color: var(--c-fg-1);
		font-family: var(--ff-mono);
		font-variant-numeric: tabular-nums;
	}

	.board {
		display: grid;
		grid-template-columns: repeat(var(--size), 1fr);
		gap: 1px;
		width: min(100%, var(--w));
		aspect-ratio: 1;
		padding: 0.25rem;
		background: var(--c-surface-3);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-md);
		box-shadow: var(--bevel-in);
	}

	/* A revealed cell is the board showing through, which is what makes an opened field read as one
	   surface rather than as a hundred tiles. Only what is still closed is drawn as a key.

	   So the board is the well and the closed cells are the raised things on it, which is the way
	   round that survives both polarities: the ramp is not a straight line of lightness, and in dark
	   mode `--c-surface-3` is the darkest of the four while in light mode it is the lightest. Drawing
	   the closed cell on `--c-surface-3` and the open one on the board left the two nearly identical
	   in dark modern, where there is no bevel to carry the difference either. */
	.cell {
		/* For the lid, which is the closed cell drawn over the open one and taken away. */
		position: relative;
		display: grid;
		place-items: center;
		padding: 0;
		background: none;
		border: 0;
		color: var(--c-fg-1);
		font-family: var(--ff-mono);
		font-size: var(--fs-sm);
		font-variant-numeric: tabular-nums;
		line-height: 1;
		cursor: pointer;
	}

	/* The hairline is what carries the difference in light mode, where the two surfaces this uses are
	   both a shade off white and the gap between them alone is not enough to see a closed cell by.

	   `.opened::after` is in the list rather than repeating the four declarations, because the lid is
	   by definition a closed cell: the moment those two drift the reveal animates the wrong thing
	   away. */
	.closed,
	.flagged,
	.opened::after {
		background: var(--c-surface-2);
		border: var(--bw) solid var(--c-line);
		border-radius: var(--r-xs);
		box-shadow: var(--bevel-out);
	}

	/*
	   The lid. A revealed cell is the board showing through, so there is nothing to animate in: what
	   moves is the closed cell that was covering it, and it goes away on a delay set by how far the
	   flood had to travel to get here. So a region opens outward from the press instead of appearing
	   whole, which is the one frame that made a flood look like a screen redraw rather than a move.

	   Base `opacity: 0` with the keyframes holding it at 1, so no fill mode is needed to keep the lid
	   gone once it has lifted, only `backwards` to keep it there through its own wait. `pointer-events`
	   off, or the first press after a reveal can land on a lid on its way out.
	*/
	.opened::after {
		content: '';
		position: absolute;
		inset: 0;
		opacity: 0;
		pointer-events: none;
		animation: lid-off var(--dur-play) var(--ez-play) calc(var(--d) * var(--dur-play) / 6) backwards;
	}

	@keyframes lid-off {
		from {
			opacity: 1;
		}

		to {
			opacity: 0;
			scale: 0.86;
		}
	}

	/* The flag arrives on a cell that is already there, so the cell holds still and only the mark
	   lands. */
	.flagged span {
		animation: mark-in var(--dur-play) var(--ez-play);
	}

	@keyframes mark-in {
		from {
			scale: 0;
		}
	}

	/*
	   The flag and the mine are the only coloured things here, and both spend `--c-select` rather
	   than `--c-accent`, for the reason the boot thermometer already gives: the selection highlight
	   is inside every skin's accent budget, retro's included. The counts stay in the theme's ink,
	   because the traditional colour per number is eight hues nothing has measured for contrast and
	   a retro that spends eight colours is not retro.
	*/
	.flagged {
		color: var(--c-select);
	}

	.mine {
		background: var(--c-select);
		color: var(--c-on-select);
		border-radius: var(--r-xs);
	}

	.mode {
		padding: 0.375rem 0.75rem;
		background: var(--c-surface-3);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-sm);
		box-shadow: var(--bevel-out);
		color: inherit;
		font: inherit;
		font-size: var(--fs-xs);
		cursor: pointer;
	}

	.mode[aria-pressed='true'] {
		background: var(--c-select);
		color: var(--c-on-select);
	}

	.bar button {
		padding: 0.375rem 0.75rem;
		background: var(--c-surface-3);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-sm);
		box-shadow: var(--bevel-out);
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.bar button:active,
	.mode:active {
		box-shadow: var(--bevel-in);
	}
</style>
