<script lang="ts">
	import FolderView from '$lib/components/views/FolderView.svelte';
	import type { View } from '$lib/os';
	import { childrenOf, type Node } from '$lib/tree';
	import NodeBody from './NodeBody.svelte';

	let {
		node,
		view = 'icon',
		selected,
		onopen,
		onselect
	}: {
		node: Node;
		/** How to draw what the node holds. A window passes its own; a route takes the default. */
		view?: View;
		/** Id of the child the info sidebar is describing. Windows only; a route has no sidebar. */
		selected?: string;
		/** Omit and the child icons stay plain links, which is the route and the no-script case. */
		onopen?: (child: Node) => void;
		onselect?: (child: Node) => void;
	} = $props();

	const children = $derived(childrenOf(node.id));
</script>

<!--
	The one component that stands between the content and how it is being looked at. A route
	renders this and gets a document; a window renders the same call and gets the same document
	inside chrome. That is the whole of the dual-render decision in `CLAUDE.md`, and it is why
	the tree carries its body rather than the shell keeping a second lookup keyed by the same ids.

	The body is its own component so the gallery view can preview an item without recursing into
	that item's children; what the node holds is the four views' business, not this file's.
-->
<NodeBody {node} />

{#if children.length > 0}
	<!-- `mt-6` only when there is prose above it, which is every folder except a bare index. -->
	<FolderView
		{node}
		{view}
		{selected}
		{onopen}
		{onselect}
		class={node.type === 'index' ? '' : 'mt-6'}
	/>
{/if}
