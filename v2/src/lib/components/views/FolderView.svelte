<script lang="ts">
	import type { View } from '$lib/os';
	import { childrenOf, type Node } from '$lib/tree';
	import ColumnView from './ColumnView.svelte';
	import GalleryView from './GalleryView.svelte';
	import IconView from './IconView.svelte';
	import ListView from './ListView.svelte';

	let {
		node,
		view = 'icon',
		selected,
		onopen,
		onselect,
		class: klass = ''
	}: {
		node: Node;
		view?: View;
		selected?: string;
		onopen?: (child: Node) => void;
		onselect?: (child: Node) => void;
		class?: string;
	} = $props();

	const items = $derived(childrenOf(node.id));
</script>

<!--
	The four ways a folder draws what it holds, dispatched in one place. Every view takes the same
	props and reports back through the same two callbacks, so the window does not learn which one
	is on screen and the plain routes keep taking the default without knowing there is a choice.
-->
{#if view === 'list'}
	<ListView {node} {items} {selected} {onopen} {onselect} class={klass} />
{:else if view === 'column'}
	<ColumnView {node} {selected} {onopen} {onselect} class={klass} />
{:else if view === 'gallery'}
	<GalleryView {node} {items} {selected} {onopen} {onselect} class={klass} />
{:else}
	<IconView {items} {selected} {onopen} {onselect} class={klass} />
{/if}
