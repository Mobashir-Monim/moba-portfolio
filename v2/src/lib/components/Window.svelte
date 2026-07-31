<script lang="ts">
	import type { Handle } from '$lib/gesture';
	import type { Snippet } from 'svelte';
	import TitleBar from './TitleBar.svelte';

	let {
		title,
		focused = false,
		nav = false,
		path,
		canBack = false,
		canForward = false,
		onback,
		onforward,
		onminimize,
		onclose,
		onpointerdown,
		onfocusin,
		onkeydown,
		element = $bindable(),
		handle,
		grip,
		toolbar,
		sidebar,
		children,
		class: klass = ''
	}: {
		title: string;
		focused?: boolean;
		nav?: boolean;
		/**
		 * The trail of folder names this window has walked, already joined. The `~/` that turns it
		 * into a shell path is `--path-prefix`, so only modern wears one.
		 */
		path?: string;
		canBack?: boolean;
		canForward?: boolean;
		onback?: () => void;
		onforward?: () => void;
		onminimize?: () => void;
		onclose?: () => void;
		/**
		 * Raising the window. `CLAUDE.md` allows exactly this: a handler on a non-interactive
		 * element, rather than the old site's window-as-a-button (ledger #17). Both are here
		 * because a pointer and a Tab key have to agree about what is in front.
		 */
		onpointerdown?: (event: PointerEvent) => void;
		onfocusin?: (event: FocusEvent) => void;
		/**
		 * Escape, and anything else the caller wants off the whole window. Handled here rather than
		 * on `window` so it only fires when focus is actually inside this one, which is also what
		 * lets the caller stop it before the desktop underneath sees it.
		 */
		onkeydown?: (event: KeyboardEvent) => void;
		/**
		 * The section, for the caller that has to move focus into it when it opens. `tabindex="-1"`
		 * below is what makes that possible without putting the window in the tab order.
		 */
		element?: HTMLElement;
		/** Passed straight to the title bar, which is the drag surface. See `$lib/gesture`. */
		handle?: Handle;
		/**
		 * Resize. Absent means no corner grip is rendered at all, which is the styleguide and any
		 * other caller that is not a positioned window on a desktop.
		 */
		grip?: Handle;
		/**
		 * The right end of the path row, which is where a Finder window keeps its view control.
		 * A snippet rather than props, so this component never learns what a view is.
		 */
		toolbar?: Snippet;
		/** Folder windows carry the info panel. Document windows leave it out. */
		sidebar?: Snippet;
		children: Snippet;
		class?: string;
	} = $props();
</script>

<!--
	A section with an accessible name, never a button. Ledger #17.

	No size, no position, no transform: this component draws the window and nothing else. Phase 2
	positions it with `translate3d()` from the store, so nothing here writes `left` or `top`
	(ledger #24) and there is no second markup tree for mobile (ledger #27).
-->
<!--
	The ignored warning is that rule's own trade, and this is the case it exists for: what it asks
	for instead is an interactive element, which is exactly the window-as-a-button of ledger #17.
	The keys land on a labelled region, every control inside it is a real button, and nothing here
	is reachable only through these handlers.
-->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section
	bind:this={element}
	class="window {klass}"
	class:focused
	aria-label={title}
	tabindex="-1"
	{onpointerdown}
	{onfocusin}
	{onkeydown}
>
	<TitleBar
		{title}
		{focused}
		{nav}
		{canBack}
		{canForward}
		{onback}
		{onforward}
		{onminimize}
		{onclose}
		{handle}
	/>

	{#if path || toolbar}
		<div class="bar">
			{#if path}<p class="path">{path}</p>{/if}
			{@render toolbar?.()}
		</div>
	{/if}

	<div class="body">
		<div class="content">{@render children()}</div>
		{#if sidebar}
			<aside class="sidebar" aria-label="{title} info">{@render sidebar()}</aside>
		{/if}
	</div>

	{#if grip}
		<!-- Pointer-only and deliberately so, the same call `CLAUDE.md` allows for drag: nothing is
		     reachable only through it, since size is presentation and the window is already fully
		     operable by keyboard. It is not focusable, so it is not a keyboard trap either. -->
		<div class="grip" {...grip} aria-hidden="true"></div>
	{/if}
</section>

<style>
	.window {
		/* The breakpoint below is the window's own width, not the viewport's, because a narrow
		   window on a wide screen has exactly the same problem. Resizing therefore restacks the
		   sidebar on its own, with no second breakpoint to keep in step. */
		container-type: inline-size;

		/* The grip's containing block. */
		position: relative;

		display: flex;
		flex-direction: column;
		min-height: 0;
		/*
		   `clip`, not `hidden`, and the difference is the whole of the bug it fixes.
		   `overflow: hidden` still makes a scroll container: it only hides the scrollbars, and the
		   box stays scrollable by script. Focusing a control scrolls every scrollable ancestor to
		   bring it into view, not just the nearest one, so tabbing or clicking to a radio below the
		   fold in a tall panel scrolled the window itself and carried its own title bar off the top.
		   `clip` is not a scroll container at all, so there is nothing left to scroll, and it clips
		   to the same rounded box.
		*/
		overflow: clip;
		background: var(--window-bg);
		backdrop-filter: blur(var(--bl-chrome));
		color: var(--c-fg-1);
		border: var(--bw-strong) solid var(--c-line);
		border-radius: var(--r-md);
		box-shadow: var(--elev-1);
		transition: box-shadow var(--dur-base) var(--ez-out);
	}

	.window.focused {
		box-shadow: var(--elev-2);
	}

	/* Where you are on the left, how you are looking at it on the right. That is Finder's toolbar,
	   compressed into the row this window already had. */
	.bar {
		display: flex;
		flex: none;
		align-items: center;
		gap: 0.5rem;
		min-height: 1.75rem;
		padding: 0.25rem 0.375rem 0.25rem 0.75rem;
		background: var(--c-surface-1);
		border-bottom: var(--bw) solid var(--c-line);
	}

	/* `--path-prefix` is the one token that differs: `~/` in modern, nothing in the other two,
	   which is the difference between a systems tool and a folder window without a branch in the
	   markup. */
	.path {
		flex: 1;
		min-width: 0;
		color: var(--c-fg-3);
		font-family: var(--ff-mono);
		font-size: var(--fs-xs);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.path::before {
		content: var(--path-prefix);
	}

	/* Ledger #4: the old site set the toolbar to one height and the content to
	   `calc(100% - <other height>)`, so below 640px the content overflowed by 20px and was
	   clipped. Flex removes the arithmetic, and with it the chance of the two disagreeing. */
	.body {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	.content {
		flex: 1;
		min-height: 0;
		overflow: auto;
		padding: 1rem;
		font-family: var(--ff-body);
		font-size: var(--fs-base);
		line-height: var(--lh-normal);
	}

	/* Second in the DOM, so reading order is content then details in every layout and with
	   stylesheets off. Wide enough and it moves to the side; narrow and it stacks under. */
	.sidebar {
		flex: none;
		overflow: auto;
		background: var(--c-surface-2);
		border-top: var(--bw) solid var(--c-line);
	}

	/* System 7's grow box, and near enough to every window corner since. Two hairlines rather than
	   a glyph, so it costs no icon and reads the same in all three skins; `touch-action` is what
	   makes the one gesture path cover touch, exactly as on the title bar. */
	.grip {
		position: absolute;
		inset-block-end: 0;
		inset-inline-end: 0;
		width: 1rem;
		height: 1rem;
		cursor: nwse-resize;
		touch-action: none;
		background: linear-gradient(
			-45deg,
			transparent 0 30%,
			var(--c-line-strong) 30% 40%,
			transparent 40% 55%,
			var(--c-line-strong) 55% 65%,
			transparent 65%
		);
		opacity: 0.7;
	}

	.grip:hover {
		opacity: 1;
	}

	/* Full-screen windows have nothing to resize to. Same breakpoint as the frame's, which is the
	   one place that decides a window is full-screen. */
	@media (max-width: 40rem) {
		.grip {
			display: none;
		}
	}

	@container (min-width: 32rem) {
		.body {
			flex-direction: row;
		}

		.sidebar {
			width: var(--sidebar-w);
			border-top: 0;
			border-inline-start: var(--bw) solid var(--c-line);
		}
	}
</style>
