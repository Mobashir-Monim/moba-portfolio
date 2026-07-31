<script lang="ts">
	import type { Handle } from '$lib/gesture';
	import Icon from './Icon.svelte';

	let {
		title,
		focused = false,
		nav = false,
		canBack = false,
		canForward = false,
		onback,
		onforward,
		onminimize,
		onclose,
		handle
	}: {
		title: string;
		/** Focused windows get the accent title bar and, in retro, the pinstripes. */
		focused?: boolean;
		/** Folder windows navigate. Document windows do not, so they omit the pair entirely. */
		nav?: boolean;
		canBack?: boolean;
		canForward?: boolean;
		onback?: () => void;
		onforward?: () => void;
		onminimize?: () => void;
		onclose?: () => void;
		/**
		 * Pointer handlers from whatever owns this window's position. Absent means the bar is not a
		 * drag surface, which is how the styleguide renders one without inventing a desktop for it.
		 */
		handle?: Handle;
	} = $props();
</script>

<!--
	A div, not a button. Ledger #17: the old site nested a control button inside a toolbar button
	inside the window button, which is invalid HTML and unpredictable in assistive tech. The drag
	handlers land on this element and nothing about it needs to be interactive to take them: a
	pointer gesture is not a control, and the window is already reachable and closable by keyboard.
-->
<!--
	Controls left, title, navigation right. That is the arrangement the 1.1 mockups were drawn
	in, in all three skins, and DOM order matches visual order so a screen reader and a pointer
	read the bar the same way.
-->
<div class="titlebar" class:focused class:grabbable={handle} {...handle}>
	<div class="group">
		{#if onclose}
			<button
				type="button"
				class="control border border-red-600 bg-red-600/15 hover:bg-red-600/50!"
				onclick={onclose}
			>
				<!-- <Icon name="close" size={14} /> -->
				<span class="sr-only">Close {title}</span>
			</button>
		{/if}
		{#if onminimize}
			<button
				type="button"
				class="control border border-yellow-600 bg-yellow-600/15 hover:bg-yellow-600/50!"
				onclick={onminimize}
			>
				<!-- <Icon name="minimize" size={14} /> -->
				<span class="sr-only">Minimize {title}</span>
			</button>
		{/if}
	</div>

	<!-- The chip repaints the bar's own background behind the text, which is what keeps retro's
	     pinstripes from running through the title. In the other two skins it is the same paint as
	     the bar and therefore invisible. -->
	<h2 class="title"><span class="chip">{title}</span></h2>

	{#if nav}
		<div class="group">
			<button type="button" class="control back" disabled={!canBack} onclick={onback}>
				<Icon name="chevron" size={14} />
				<span class="sr-only">Back</span>
			</button>
			<button type="button" class="control" disabled={!canForward} onclick={onforward}>
				<Icon name="chevron" size={14} />
				<span class="sr-only">Forward</span>
			</button>
		</div>
	{/if}
</div>

<style>
	/* Focused and idle differ only in these three, so every rule below reads one set of names and
	   the state lives in one place. */
	.titlebar {
		--_bg: var(--titlebar-bg-idle);
		--_fg: var(--titlebar-fg-idle);
		--_pattern: none;

		display: flex;
		align-items: stretch;
		gap: 0.25rem;
		height: var(--chrome-h);
		padding-inline: 0.375rem;
		/* Pattern first so it layers over the paint. `none` is a legal image layer, which is how
		   the skins that have no pattern opt out without a branch. */
		background: var(--_pattern), var(--_bg);
		color: var(--_fg);
		border-bottom: var(--bw) solid var(--c-line);
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		letter-spacing: var(--tracking-ui);
		/* Named, not `all`: ledger #23 and the hard rule in CLAUDE.md. Focus swaps `--_bg`, `--_fg`
		   and `--_pattern`, which reach the paint as background-color and color. The pattern is a
		   background-image and does not interpolate in any browser, so listing it would be a
		   promise the engine cannot keep; retro's pinstripes appear on the frame focus lands. */
		transition:
			background-color var(--dur-fast) var(--ez-standard),
			color var(--dur-fast) var(--ez-standard);
	}

	.titlebar.focused {
		--_bg: var(--titlebar-bg);
		--_fg: var(--titlebar-fg);
		--_pattern: var(--titlebar-pattern);
	}

	/* `touch-action: none` is what makes one code path cover mouse, touch, and pen: without it the
	   browser claims the touch for a pan and the move events never arrive. `user-select` stops a
	   drag from selecting the title, which is chrome text and never worth selecting anyway. */
	.grabbable {
		cursor: grab;
		touch-action: none;
		user-select: none;
	}

	.grabbable:active {
		cursor: grabbing;
	}

	.title {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: var(--title-align);
		font-size: inherit;
		font-weight: 100;
	}

	.chip {
		display: flex;
		align-items: center;
		max-width: 100%;
		padding-inline: 0.5rem;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		/* background: var(--_bg); */
	}

	/* Wide enough that two neighbouring 24px targets do not overlap: the glyphs are 15.2px, so
	   9px of gap puts their centres 24.2px apart, which is what SC 2.5.8's spacing clause asks
	   for. Tightening this re-breaks the criterion the `::after` below exists to satisfy. */
	.group {
		display: flex;
		align-items: center;
		gap: 0.5625rem;
	}

	.control {
		position: relative;
		display: grid;
		place-items: center;
		align-self: center;
		width: 0.95rem;
		height: 0.95rem;
		/* background: var(--_bg); */
		border-radius: var(--r-xs);
		box-shadow: var(--bevel-out);
		cursor: pointer;
		/* Named, not `all`: ledger #23 and the hard rule in CLAUDE.md. Hover repaints, active swaps
		   the bevel, disabled fades. Nothing else about a control moves. */
		transition:
			background-color var(--dur-fast) var(--ez-standard),
			box-shadow var(--dur-fast) var(--ez-standard),
			opacity var(--dur-fast) var(--ez-standard);
	}

	/* WCAG 2.2 SC 2.5.8, Target Size (Minimum), which is a Level AA criterion and the one thing
	   6.1's audit found that no amount of contrast checking would have.

	   The glyph stays 15.2px, because a title bar control is drawn at the size the three skins
	   were designed around and 24px of visible chrome is a different window. What grows is the
	   target underneath it: a pseudo-element is part of its originating element for hit testing,
	   so a press anywhere in here is a press on the button, and nothing about the drawing moves.

	   24px rather than a rem, deliberately. The criterion is written in CSS pixels, so a token
	   that tracks the skin would satisfy it in some skins and not others. */
	.control::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 24px;
		height: 24px;
		translate: -50% -50%;
	}

	/* Greyscale on purpose. Retro's accent budget is the title bar's paint and the selection
	   highlight, and a control that lights up accent on hover spends it a third time. */
	.control:hover:not(:disabled) {
		background: var(--c-surface-2);
	}

	.control:active:not(:disabled) {
		box-shadow: var(--bevel-in);
	}

	.control:disabled {
		opacity: 0.35;
		cursor: default;
	}

	/* The glyph points right, so back is the same glyph turned around. Four glyphs for four
	   angles is how an icon set gets to 24 entries. */
	.back :global(svg) {
		transform: rotate(180deg);
	}
</style>
