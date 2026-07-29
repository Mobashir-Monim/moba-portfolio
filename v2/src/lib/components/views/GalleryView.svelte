<script lang="ts">
	import { pickers } from '$lib/activate';
	import Icon from '$lib/components/Icon.svelte';
	import NodeBody from '$lib/components/content/NodeBody.svelte';
	import { summary, type Node } from '$lib/tree';
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

	/** Which item the pane is showing. The first one until something is picked, never nothing. */
	const preview = $derived(items.find((item) => item.id === selected) ?? items[0]);
</script>

<!--
	Finder's gallery previews the file. Nothing on this site has a thumbnail, so a big generic
	icon would be a dead pane; the preview renders the item's actual write-up instead, which makes
	this the view for reading through a set of projects one after another.

	`NodeBody`, not `NodeContent`: the preview shows what the item says, never what it holds, or
	previewing a folder would draw a folder view inside a folder view.
-->
<!-- `href` arrives already built, off the node in `$lib/tree`, which is the route table. The
     site deploys at the root and has no `base` for `resolve()` to prepend. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="gallery {klass}">
	{#if preview}
		<article class="pane" aria-label="{preview.name} preview">
			<header>
				<Icon name={preview.kind} size={20} />
				<h3>{preview.name}</h3>
			</header>
			{#if preview.type === 'index'}
				<!-- An index folder says nothing of its own, so the one line the head tag uses is
				     the only honest thing to show. -->
				<p class="summary">{summary(preview)}</p>
			{:else}
				<NodeBody node={preview} />
			{/if}
		</article>
	{/if}

	<ul class="strip" aria-label="{node.name} items">
		{#each items as child (child.id)}
			{@const on = preview?.id === child.id}
			<li>
				<a
					href={child.href}
					class:on
					class:open={windows.byId(child.id) !== undefined}
					aria-current={on ? 'true' : undefined}
					{...pickers(onopen && (() => onopen(child)), onselect && (() => onselect(child)))}
				>
					<Icon name={windows.byId(child.id) ? `${child.kind}-open` : child.kind} size={28} />
					<span class="name">{child.name}</span>
				</a>
			</li>
		{/each}
	</ul>
</div>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	.gallery {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* ponytail: a band, for the same reason as the column view. Both grow the day the window's
	   content box becomes a flex column. */
	.pane {
		height: min(45vh, 18rem);
		overflow: auto;
		padding: 0.75rem;
		background: var(--c-surface-1);
		border: var(--bw) solid var(--c-line);
		border-radius: var(--r-sm);
	}

	.pane header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-block-end: 0.5rem;
		padding-block-end: 0.5rem;
		border-bottom: var(--bw) solid var(--c-line);
	}

	h3 {
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		font-weight: 600;
		letter-spacing: var(--tracking-ui);
	}

	.summary {
		color: var(--c-fg-2);
		font-family: var(--ff-body);
		font-size: var(--fs-sm);
		line-height: var(--lh-normal);
	}

	.strip {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		padding-block-end: 0.25rem;
	}

	.strip a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		width: 6rem;
		padding: 0.5rem 0.25rem;
		border-radius: var(--r-sm);
		color: var(--c-fg-1);
		font-family: var(--ff-ui);
		font-size: var(--fs-xs);
		letter-spacing: var(--tracking-ui);
		text-align: center;
		text-decoration: none;
	}

	.strip a:hover:not(.on) {
		background: color-mix(in oklab, var(--c-fg-1) 8%, transparent);
	}

	.strip .on {
		background: var(--c-select);
		color: var(--c-on-select);
	}

	.strip .open:not(.on) {
		color: var(--c-fg-3);
	}

	.name {
		max-width: 100%;
		overflow-wrap: anywhere;
		line-height: var(--lh-tight);
	}
</style>
