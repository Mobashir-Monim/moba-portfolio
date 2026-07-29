<script lang="ts">
	import type { Kind } from '$lib/os';
	import Icon from './Icon.svelte';

	let {
		name,
		href,
		kind = 'folder',
		selected = false,
		open = false
	}: {
		name: string;
		href: string;
		kind?: Kind;
		selected?: boolean;
		/** The item has a window open. Draws the open glyph and announces it. */
		open?: boolean;
	} = $props();

	const glyph = $derived(open ? (`${kind}-open` as const) : kind);
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
	`href` arrives resolved. The tree these icons render comes from the content collections in
	phase 3, and resolving a route inside a leaf component would mean this one knowing the route
	table.
-->
<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
<a {href} class="tile" class:selected class:open aria-current={selected ? 'true' : undefined}>
	<Icon name={glyph} size={40} />
	<span class="label">{name}</span>
	{#if open}<span class="sr-only">, open</span>{/if}
</a>

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
