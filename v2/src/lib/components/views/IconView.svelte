<script lang="ts">
	import DesktopIcon from '$lib/components/DesktopIcon.svelte';
	import IconGrid from '$lib/components/IconGrid.svelte';
	import type { Node } from '$lib/tree';
	import { windows } from '$lib/windows.svelte';

	let {
		items,
		selected,
		onopen,
		onselect,
		class: klass = ''
	}: {
		items: Node[];
		selected?: string;
		onopen?: (child: Node) => void;
		onselect?: (child: Node) => void;
		class?: string;
	} = $props();
</script>

<!--
	The default, and the only one of the four that also serves the plain routes and the desktop.
	It is the grid that already existed; the other three are new browsers over the same items.
-->
<IconGrid class={klass}>
	{#each items as child (child.id)}
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
