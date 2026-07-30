<script lang="ts">
	import { windows } from '$lib/windows.svelte';
	import WindowFrame from './WindowFrame.svelte';

	/**
	 * Where each window sits in the stack, by id. The store's array order is the stack, and this
	 * is that order turned into a number the stylesheet can use.
	 */
	const depth = $derived(new Map(windows.all.map((record, i) => [record.id, i])));

	/**
	 * DOM order, which is open order and never changes while a window is open.
	 *
	 * Rendering the stack directly is what 2.13 was: raising happens on `pointerdown`, so pressing
	 * a control on a window that is not already on top reordered the each, and Svelte moved the
	 * pressed button to a new place in the DOM before the release. Chrome then has a press and a
	 * release on different tree positions, dispatches no `click` at all, and the window a visitor
	 * just pressed Close on stays open.
	 */
	const order = $derived([...windows.all].sort((a, b) => a.seq - b.seq));
</script>

<!--
	Keyed by id, so nothing is recreated while it is open (ledger #11 was an unkeyed each). The key
	is also what makes `transition:` correct here: Svelte plays the outro before removing the node,
	which is the entire mechanism the old site hand-rolled with `justOpened`, `justClosed`, and a
	500ms `setTimeout`.
-->
<div class="layer">
	{#each order as record (record.id)}
		<WindowFrame {record} z={depth.get(record.id) ?? 0} />
	{/each}
</div>

<style>
	.layer {
		position: absolute;
		inset: 0;
		overflow: hidden;
		/* A size container, which is what lets a window that has never been dragged centre itself
		   in `cq` units. Its own size comes from the insets above, so containment costs nothing. */
		container-type: size;
		/* Inert, so the desktop underneath keeps its clicks. Each frame opts itself back in. */
		pointer-events: none;
		/* The windows' own stacking context, so a tenth window cannot climb over the boot screen
		   or the dock on the strength of a number that only means "tenth". */
		isolation: isolate;
	}
</style>
