<script lang="ts">
	import type { Node } from '$lib/tree';
	import About from './About.svelte';
	import Certification from './Certification.svelte';
	import Degree from './Degree.svelte';
	import Experience from './Experience.svelte';
	import Project from './Project.svelte';
	import Publication from './Publication.svelte';
	import Resume from './Resume.svelte';

	let { node }: { node: Node } = $props();
</script>

<!--
	What the node says of itself, with nothing about what it holds. Split out of `NodeContent` so
	the gallery view can render a preview of an item without recursing into that item's own
	children, and so the switch on `node.type` exists exactly once.

	The tree carries a discriminated body, so each branch gets `node.data` narrowed for free.
-->
{#if node.type === 'about'}
	<About data={node.data} />
{:else if node.type === 'resume'}
	<Resume data={node.data} />
{:else if node.type === 'experience'}
	<Experience data={node.data} />
{:else if node.type === 'project'}
	<Project data={node.data} />
{:else if node.type === 'degree'}
	<Degree data={node.data} />
{:else if node.type === 'publication'}
	<Publication data={node.data} />
{:else if node.type === 'certification'}
	<Certification data={node.data} />
{/if}
