<script lang="ts">
	import { activators } from '$lib/activate';
	import type { Kind } from '$lib/os';
	import Icon from './Icon.svelte';

	let {
		name,
		href,
		kind = 'folder',
		selected = false,
		open = false,
		layout = 'tile',
		onopen,
		onselect
	}: {
		name: string;
		href: string;
		kind?: Kind;
		selected?: boolean;
		/**
		 * `tile` stacks the label under the glyph and sits in a grid, which is every folder.
		 * `row` puts it beside, which is the desktop's list down the left edge. A variant, not a
		 * second component: the markup is identical and only the axis changes.
		 */
		layout?: 'tile' | 'row';
		/** The item has a window open. Draws the open glyph and announces it. */
		open?: boolean;
		/**
		 * Open in the shell instead of navigating. Omit both handlers and this stays exactly what
		 * it is in the markup, a link, which is what the styleguide and a JavaScript-off visitor
		 * get.
		 */
		onopen?: () => void;
		onselect?: () => void;
	} = $props();

	const glyph = $derived(open ? (`${kind}-open` as const) : kind);

	/** Shared with the other three folder views, which owe a link exactly the same behaviour. */
	const activate = $derived(activators(onopen, onselect));
</script>

<!--
	A link, which the accessibility contract allows and which is the only version that works with
	JavaScript off. Ledger #20: the old site put `on:keydown` with no key check on a div, so Tab
	selected the icon instead of moving past it, and nothing opened on Enter. An anchor gets all
	of that from the platform.

	Phase 2 layers the grid pattern (arrow keys move, Enter opens, Escape deselects) over this.
	`aria-current` is the selection, because a link cannot be `aria-selected`.
-->
<!--
	`href` arrives already built. It comes off the node in `$lib/tree`, which is the route table,
	so resolving it again inside a leaf component would mean this one knowing about routes. The
	site deploys at the root and has no `base` for `resolve()` to prepend.
-->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a
	{href}
	class="tile"
	class:row={layout === 'row'}
	class:selected
	class:open
	aria-current={selected ? 'true' : undefined}
	{...activate}
>
	<Icon name={glyph} size={layout === 'row' ? 20 : 40} />
	<span class="label">{name}</span>
	{#if open}<span class="sr-only">, open</span>{/if}
</a>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		width: var(--icon-tile);
		padding: 0.5rem 0.25rem;
		border-radius: var(--r-sm);
		color: var(--c-fg-1);
		font-family: var(--ff-ui);
		font-size: var(--fs-xs);
		letter-spacing: var(--tracking-ui);
		text-align: center;
		text-decoration: none;
		transition:
			background-color var(--dur-fast) var(--ez-standard),
			color var(--dur-fast) var(--ez-standard);
	}

	/* The row. Width shrinks to the label so the hit area is the item and not the column. */
	.tile.row {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
		width: auto;
		padding: 0.25rem 0.5rem;
		text-align: start;
	}

	.tile:hover {
		background: color-mix(in oklab, var(--c-fg-1) 8%, transparent);
	}

	/* Selection is the one place every skin spends the accent, retro included, because this is
	   what System 7's Color control panel actually coloured. Retro reads as a hard inversion
	   rather than a tinted pill only because `--r-sm` is 0 there. */
	.tile.selected,
	.tile.selected:hover {
		background: var(--c-select);
		color: var(--c-on-select);
	}

	/* An open item is still on the desktop, just already somewhere else. */
	.tile.open:not(.selected) {
		color: var(--c-fg-3);
	}

	.label {
		max-width: 100%;
		overflow-wrap: anywhere;
		line-height: var(--lh-tight);
	}
</style>
