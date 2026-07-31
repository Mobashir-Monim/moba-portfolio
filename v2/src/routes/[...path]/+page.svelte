<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import NodeContent from '$lib/components/content/NodeContent.svelte';
	import { graph, PERSON as person } from '$lib/seo';
	import { nodes, summary } from '$lib/tree';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const node = $derived(nodes[data.id]);
</script>

<Head
	title="{node.name} | {person}"
	description={summary(node)}
	path={node.href}
	type="article"
	jsonld={graph(node)}
/>

<!--
	The document on its own, which is what a crawler, a link preview, and a visitor with no
	JavaScript get. Ledger #12: the old site's server HTML was a logo, one `h1`, and an empty
	grid, because every piece of content only existed inside a window that mounted on click.

	The desktop renders the same `NodeContent` inside window chrome. One component, two frames.
-->
<div class="mx-auto grid max-w-3xl gap-6 px-6 py-10">
	<nav aria-label="Breadcrumb">
		<a href={resolve('/')} class="font-ui text-xs text-fg-3 underline underline-offset-2">
			{person}
		</a>
	</nav>

	<!--
		An index is the one node type whose body renders nothing of itself, since what a folder has
		to say is what it holds. That left the seven index routes as the only pages on the site with
		no `h1`, found by 6.3's pass: a reader with no JavaScript got a breadcrumb and a bare list of
		links with nothing naming the page they had landed on, and a crawler got the same on exactly
		the pages 2.12 gave `CollectionPage` and `ItemList` to.

		Here rather than in `NodeBody`, which is what keeps it off the shell: a folder window is
		named by its own title bar, and adding a second visible name inside every one of them is a
		composition change this task was not asked to make. A document needs no case either way,
		because its content component has always rendered its own heading.
	-->
	{#if node.type === 'index'}
		<h1 class="font-ui text-2xl font-semibold">{node.name}</h1>
	{/if}

	<NodeContent {node} />
</div>
