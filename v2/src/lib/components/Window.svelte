<script lang="ts">
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
<section class="window {klass}" class:focused aria-label={title} {onpointerdown} {onfocusin}>
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
	/>

	{#if path}
		<p class="path">{path}</p>
	{/if}

	<div class="body">
		<div class="content">{@render children()}</div>
		{#if sidebar}
			<aside class="sidebar" aria-label="{title} info">{@render sidebar()}</aside>
		{/if}
	</div>
</section>

<style>
	.window {
		/* The breakpoint below is the window's own width, not the viewport's, because a narrow
		   window on a wide screen has exactly the same problem. */
		container-type: inline-size;

		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
		background: var(--window-bg);
		backdrop-filter: blur(var(--bl-chrome));
		color: var(--c-fg-1);
		border: var(--bw-strong) solid var(--c-line-strong);
		border-radius: var(--r-md);
		box-shadow: var(--elev-1);
		transition: box-shadow var(--dur-base) var(--ez-out);
	}

	.window.focused {
		box-shadow: var(--elev-2);
	}

	/* Where you are, under the bar that says what you are looking at. `--path-prefix` is the one
	   token that differs: `~/` in modern, nothing in the other two, which is the difference
	   between a systems tool and a folder window without a branch in the markup. */
	.path {
		flex: none;
		padding: 0.25rem 0.75rem;
		background: var(--c-surface-1);
		border-bottom: var(--bw) solid var(--c-line);
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
