<script lang="ts">
	import { windows } from '$lib/windows.svelte';
	import WindowFrame from './WindowFrame.svelte';
</script>

<!--
	Array order is stacking order, so rendering the store in order puts the last record on top and
	no z-index bookkeeping exists to go wrong.

	Keyed by id, so focusing a window moves one DOM node instead of recreating every window after
	it (ledger #11 was an unkeyed each). The key is also what makes `transition:` correct here:
	Svelte plays the outro before removing the node, which is the entire mechanism the old site
	hand-rolled with `justOpened`, `justClosed`, and a 500ms `setTimeout`.
-->
<div class="layer">
	{#each windows.all as record (record.id)}
		<WindowFrame {record} />
	{/each}
</div>

<style>
	.layer {
		position: absolute;
		inset: 0;
		overflow: hidden;
		/* Inert, so the desktop underneath keeps its clicks. Each frame opts itself back in. */
		pointer-events: none;
	}
</style>
