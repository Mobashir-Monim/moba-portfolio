<script lang="ts">
	import { activators } from '$lib/activate';
	import Icon from '$lib/components/Icon.svelte';
	import { formatSize } from '$lib/fs';
	import { FILE_TYPE } from '$lib/os';
	import { move } from '$lib/roving';
	import type { Node } from '$lib/tree';
	import { windows } from '$lib/windows.svelte';

	let {
		node,
		items,
		selected,
		onopen,
		onselect,
		class: klass = ''
	}: {
		node: Node;
		items: Node[];
		selected?: string;
		onopen?: (child: Node) => void;
		onselect?: (child: Node) => void;
		class?: string;
	} = $props();
</script>

<!--
	A real table, because this view is a table: four columns of facts about a set of items, with a
	header that says what each column means. A grid of divs would announce as nothing and read as
	nothing with stylesheets off.

	No sorting and no disclosure triangles. Both are Finder features rather than view features,
	and neither is what was asked for.
-->
<!-- `href` arrives already built, off the node in `$lib/tree`, which is the route table. The
     site deploys at the root and has no `base` for `resolve()` to prepend. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<table class="list {klass}">
	<caption class="sr-only">Contents of {node.name}</caption>
	<thead>
		<tr>
			<th scope="col">Name</th>
			<th scope="col">Kind</th>
			<th scope="col" class="num">Size</th>
			<th scope="col">Modified</th>
		</tr>
	</thead>
	<!-- The set the arrow keys walk. The header holds no links, so it is the body and not the
	     table: see `$lib/roving`, and 7.4 for the three views this was missing from. -->
	<tbody data-roving>
		{#each items as child (child.id)}
			{@const open = windows.byId(child.id) !== undefined}
			{@const on = selected === child.id}
			<tr class:on class:open>
				<th scope="row">
					<!-- Still a link, so the row opens with Enter, survives JavaScript being off, and
					     keeps the platform's own modified clicks. -->
					<a
						href={child.href}
						aria-current={on ? 'true' : undefined}
						onkeydown={move}
						{...activators(onopen && (() => onopen(child)), onselect && (() => onselect(child)))}
					>
						<Icon name={open ? `${child.kind}-open` : child.kind} size={16} />
						<span class="name">{child.name}</span>
						{#if open}<span class="sr-only">, open</span>{/if}
					</a>
				</th>
				<td>{FILE_TYPE[child.kind]}</td>
				<td class="num">{formatSize(child.size)}</td>
				<td>{child.modified}</td>
			</tr>
		{/each}
	</tbody>
</table>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	.list {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--ff-ui);
		font-size: var(--fs-xs);
		letter-spacing: var(--tracking-ui);
		text-align: start;
	}

	th,
	td {
		padding: 0.25rem 0.5rem;
		text-align: start;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* The window scrolls, not the table, so the header rides along with it. */
	thead th {
		position: sticky;
		inset-block-start: calc(-1rem - var(--bw));
		z-index: 1;
		background: var(--c-surface-2);
		border-bottom: var(--bw) solid var(--c-line);
		color: var(--c-fg-3);
		font-weight: 600;
	}

	tbody th {
		font-weight: 400;
	}

	/* Name takes what is left; the three fact columns take what they need. */
	tbody th[scope='row'] {
		width: 100%;
	}

	td {
		color: var(--c-fg-3);
	}

	.num {
		text-align: end;
		font-variant-numeric: tabular-nums;
	}

	a {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: inherit;
		text-decoration: none;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	tbody tr:hover {
		background: color-mix(in oklab, var(--c-fg-1) 8%, transparent);
	}

	/* Selection paints the whole row, including the fact columns, so it reads as one item and not
	   as a highlighted name beside three unrelated cells. */
	.on,
	.on:hover {
		background: var(--c-select);
	}

	.on th,
	.on td {
		color: var(--c-on-select);
	}

	.open:not(.on) th,
	.open:not(.on) td {
		color: var(--c-fg-3);
	}
</style>
