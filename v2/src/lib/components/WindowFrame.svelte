<script lang="ts">
	import { OWNER } from '$lib/os';
	import { node, type Node } from '$lib/tree';
	import { canBack, canForward, current, windows, type WindowRecord } from '$lib/windows.svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { scale } from 'svelte/transition';
	import InfoSidebar from './InfoSidebar.svelte';
	import NodeContent from './content/NodeContent.svelte';
	import Window from './Window.svelte';

	let { record }: { record: WindowRecord } = $props();

	/** What this window is showing right now, which is not what it was opened from. */
	const showingId = $derived(current(record));
	const showing = $derived(node(showingId));

	/**
	 * Which child the info sidebar is describing. Local, not in the store: it is a property of
	 * looking at a folder, not of the window existing, and it dies with the view.
	 */
	let selected = $state<string | undefined>();

	// Navigating away takes the selection with it, or the sidebar describes a sibling of the
	// folder you are no longer in. Depending on the id rather than on `record` matters: every
	// mutator hands back a new record, so reading the record here would also clear the selection
	// on minimize, restore, and drag.
	$effect(() => {
		void showingId;
		selected = undefined;
	});

	/** The folder itself until something inside it is picked. */
	const described = $derived((selected && node(selected)) || showing);

	/** Only folder windows navigate, and only folder windows carry the sidebar and the path. */
	const isFolder = $derived(record.kind === 'folder');

	/**
	 * Where this window has walked, not where the node sits in the tree. A project is listed by
	 * both its experience and by Projects, so it has no single parent; the window's own history
	 * up to the cursor is the trail the back button actually retraces.
	 */
	const path = $derived(
		record.history
			.slice(0, record.index + 1)
			.map((id) => node(id)?.name ?? id)
			.join('/')
	);

	// Reduced motion means instant, not slower.
	const motion = $derived(
		prefersReducedMotion.current
			? { duration: 0 }
			: { duration: 160, start: 0.97, opacity: 0, delay: 0 }
	);

	function raise(): void {
		windows.focus(record.id);
	}

	function open(child: Node): void {
		// Inside a folder, a child opens in place and pushes history, the way a file manager has
		// always worked. The window's back button is the way out.
		windows.navigate(record.id, child.id);
	}
</script>

{#if showing && !record.minimized}
	<!--
		Position is a custom property rather than an inline `transform`, so the mobile rule below
		can drop it without `!important` and without a second markup tree (ledger #27). The
		property applied is `translate3d`, never `left`/`top` (ledger #24).
	-->
	<div class="frame" style="--x: {record.x}px; --y: {record.y}px" transition:scale={motion}>
		<Window
			class="h-full w-full"
			onpointerdown={raise}
			onfocusin={raise}
			title={showing.name}
			focused={windows.isFocused(record.id)}
			nav={isFolder}
			path={isFolder ? path : undefined}
			canBack={canBack(record)}
			canForward={canForward(record)}
			onback={() => windows.back(record.id)}
			onforward={() => windows.forward(record.id)}
			onminimize={() => windows.minimize(record.id)}
			onclose={() => windows.close(record.id)}
			sidebar={isFolder && described ? sidebar : undefined}
		>
			<NodeContent
				node={showing}
				{selected}
				onopen={open}
				onselect={(child) => (selected = child.id)}
			/>
		</Window>
	</div>
{/if}

{#snippet sidebar()}
	{#if described}
		<!-- `modified` goes in raw as `YYYY-MM`. This is a file listing, not prose, and the
		     mockups show an ISO date here; `formatYearMonth` is for the content components. -->
		<InfoSidebar
			name={described.name}
			kind={described.kind}
			size={described.size}
			author={OWNER}
			modified={described.modified}
			items={described.children?.length}
		/>
	{/if}
{/snippet}

<style>
	.frame {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		width: min(46rem, calc(100vw - 2rem));
		height: min(30rem, calc(100dvh - var(--dock-h) - 4rem));
		transform: translate3d(var(--x), var(--y), 0);
		/* The layer itself is inert so the desktop under it stays clickable; each window opts
		   back in. */
		pointer-events: auto;
	}

	/* Full-screen on a phone, same markup, same chrome. Sizing is the only difference, so a
	   media query is the whole of it. */
	@media (max-width: 40rem) {
		.frame {
			position: fixed;
			inset: 0 0 var(--dock-h) 0;
			width: 100%;
			height: auto;
			transform: none;
		}
	}
</style>
