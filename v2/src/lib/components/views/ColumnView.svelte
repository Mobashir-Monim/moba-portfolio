<script lang="ts">
	import { pickers } from '$lib/activate';
	import Icon from '$lib/components/Icon.svelte';
	import { childrenOf, node as lookup, type Node } from '$lib/tree';
	import { windows } from '$lib/windows.svelte';

	let {
		node,
		selected,
		onopen,
		onselect,
		class: klass = ''
	}: {
		node: Node;
		selected?: string;
		onopen?: (child: Node) => void;
		onselect?: (child: Node) => void;
		class?: string;
	} = $props();

	/**
	 * What has been picked, one id per column, left to right. Local because it is a way of
	 * looking at this folder rather than a fact about it, and it dies with the view.
	 */
	let trail = $state<string[]>([]);

	// A different folder is a different browse. Depending on the id rather than on the node keeps
	// this from firing on every unrelated re-render, the same reason `WindowFrame` does it.
	$effect(() => {
		void node.id;
		trail = [];
	});

	/**
	 * The columns themselves: this folder, then one for each picked folder that has something in
	 * it. Picking a document ends the chain, which is what makes the last column the leaf.
	 *
	 * Anchored at the window's current folder rather than at the root, because this tree has no
	 * parent map by design: a project is listed under both its experience and under Projects, so
	 * there is no single ancestor path to draw as columns to its left.
	 */
	const columns = $derived.by(() => {
		const cols = [{ label: node.name, items: childrenOf(node.id) }];
		for (const id of trail) {
			const items = childrenOf(id);
			if (items.length === 0) break;
			cols.push({ label: lookup(id)?.name ?? id, items });
		}
		return cols;
	});

	function pick(index: number, child: Node): void {
		trail = [...trail.slice(0, index), child.id];
		onselect?.(child);
	}
</script>

<!-- `href` arrives already built, off the node in `$lib/tree`, which is the route table. The
     site deploys at the root and has no `base` for `resolve()` to prepend. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="columns {klass}">
	{#each columns as column, index (index)}
		<ul aria-label={column.label}>
			{#each column.items as child (child.id)}
				{@const on =
					trail[index] === child.id || (index === 0 && !trail.length && selected === child.id)}
				{@const open = windows.byId(child.id) !== undefined}
				<li>
					<a
						href={child.href}
						class:on
						aria-current={on ? 'true' : undefined}
						{...pickers(onopen && (() => onopen(child)), () => pick(index, child))}
					>
						<Icon name={open ? `${child.kind}-open` : child.kind} size={16} />
						<span class="name">{child.name}</span>
						{#if child.children?.length}
							<Icon name="chevron" size={12} class="more" />
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/each}
</div>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	/*
	 * ponytail: a band rather than the full window. Filling it means making the window's content
	 * box a flex column and handing this the leftover, which is a change every content component
	 * shares. Worth doing when a second view wants it; today one does.
	 */
	.columns {
		display: flex;
		align-items: stretch;
		height: min(60vh, 26rem);
		overflow-x: auto;
		border: var(--bw) solid var(--c-line);
		border-radius: var(--r-sm);
	}

	ul {
		flex: none;
		width: 13rem;
		overflow-y: auto;
		padding: 0.25rem;
		border-inline-end: var(--bw) solid var(--c-line);
	}

	ul:last-child {
		border-inline-end: 0;
	}

	a {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.375rem;
		border-radius: var(--r-sm);
		color: var(--c-fg-1);
		font-family: var(--ff-ui);
		font-size: var(--fs-xs);
		letter-spacing: var(--tracking-ui);
		text-decoration: none;
	}

	a:hover:not(.on) {
		background: color-mix(in oklab, var(--c-fg-1) 8%, transparent);
	}

	.on {
		background: var(--c-select);
		color: var(--c-on-select);
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	/* The affordance that says this row has a column behind it. */
	a :global(.more) {
		opacity: 0.6;
	}
</style>
