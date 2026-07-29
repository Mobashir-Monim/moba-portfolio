<script lang="ts">
	import DesktopIcon from '$lib/components/DesktopIcon.svelte';
	import IconGrid from '$lib/components/IconGrid.svelte';
	import { childrenOf, type Node } from '$lib/tree';
	import { windows } from '$lib/windows.svelte';
	import About from './About.svelte';
	import Certification from './Certification.svelte';
	import Degree from './Degree.svelte';
	import Experience from './Experience.svelte';
	import Project from './Project.svelte';
	import Publication from './Publication.svelte';

	let {
		node,
		selected,
		onopen,
		onselect
	}: {
		node: Node;
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
-->
{#if node.type === 'about'}
	<About data={node.data} />
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

{#if children.length > 0}
	<!-- `mt-6` only when there is prose above it, which is every folder except a bare index. -->
	<IconGrid class={node.type === 'index' ? '' : 'mt-6'}>
		{#each children as child (child.id)}
			<DesktopIcon
				name={child.name}
				href={child.href}
				kind={child.kind}
				selected={selected === child.id}
				open={windows.byId(child.id) !== undefined}
				onopen={onopen && (() => onopen(child))}
				onselect={onselect && (() => onselect(child))}
			/>
		{/each}
	</IconGrid>
{/if}
