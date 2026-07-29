<script lang="ts">
	import { about } from '$lib/content/about';
	import NodeContent from '$lib/components/content/NodeContent.svelte';
	import { nodes, summary } from '$lib/tree';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const node = $derived(nodes[data.id]);
	const person = $derived(`${about.person.first} ${about.person.last}`);
</script>

<svelte:head>
	<title>{node.name} | {person}</title>
	<meta name="description" content={summary(node)} />
</svelte:head>

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

	<NodeContent {node} />
</div>
