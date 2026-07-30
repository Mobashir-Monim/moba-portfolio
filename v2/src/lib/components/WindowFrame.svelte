<script lang="ts">
	import { app } from '$lib/apps';
	import { clampSize, clampToDesktop, gesture, type Bounds } from '$lib/gesture';
	import { OWNER } from '$lib/os';
	import { node, type Node } from '$lib/tree';
	import {
		canBack,
		canForward,
		current,
		windows,
		WRAP,
		type WindowRecord
	} from '$lib/windows.svelte';
	import { untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { scale } from 'svelte/transition';
	import InfoSidebar from './InfoSidebar.svelte';
	import ViewSwitcher from './ViewSwitcher.svelte';
	import AppContent from './apps/AppContent.svelte';
	import NodeContent from './content/NodeContent.svelte';
	import Window from './Window.svelte';

	/**
	 * `z` is this window's place in the stack. The layer renders in open order and pays for the
	 * stacking here, because a keyed each that reorders moves DOM nodes, and a node that moves
	 * between a press and its release eats the click (2.13).
	 */
	let { record, z = 0 }: { record: WindowRecord; z?: number } = $props();

	/** What this window is showing right now, which is not what it was opened from. */
	const showingId = $derived(current(record));
	const showing = $derived(node(showingId));

	/**
	 * The windows with no node behind them. An app is not content, so it has no tree entry, no
	 * route, and no info sidebar; everything else about it is an ordinary window, which is the
	 * point. A lookup rather than a branch per app, which is what 4.5 turned this into.
	 */
	const showingApp = $derived(app(showingId));
	const title = $derived(showingApp?.name ?? showing?.name ?? '');

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

		// Walking into a folder replaces the content, and with it the link that was focused, so the
		// keyboard lands on the body and Escape stops reaching this window at all. Only that case:
		// the back button survives its own click, and pulling focus off it would cost the second
		// press. `win` is read untracked because this effect must not depend on it, or minimizing a
		// window would clear the selection it was put away with.
		if (document.activeElement === document.body) untrack(() => win)?.focus();
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

	/**
	 * Escape drops the selection if there is one and closes the window otherwise, which is what a
	 * file manager has always done with it. It stops here so the desktop's own Escape does not also
	 * fire: this window is inside that desktop, and one key should not mean two things at once.
	 */
	function onkeydown(event: KeyboardEvent): void {
		if (event.key !== 'Escape') return;
		event.stopPropagation();
		if (selected) selected = undefined;
		else windows.close(record.id);
	}

	let frame = $state<HTMLElement>();

	/** The window's own `<section>`, so focus can be put inside it when it opens. */
	let win = $state<HTMLElement>();

	/**
	 * The icon this window is of, which is where focus goes when it closes. The record's id is what
	 * the window was opened from, so unlike `showing` it does not move as the window navigates.
	 */
	const openedFrom = $derived(node(record.id)?.href);

	/**
	 * Focus follows the window in and back out again. The effect re-runs when the section comes and
	 * goes, which is also minimize and restore, so putting a window away hands the keyboard back
	 * rather than leaving it on a node that no longer exists.
	 */
	$effect(() => {
		const opener = document.activeElement as HTMLElement | null;
		// Read while the component is alive, because the teardown runs after it is not.
		const href = openedFrom;
		win?.focus();

		return () => {
			// Clicking a link does not focus it in every browser, and the opener can equally be a
			// row inside a window that has since closed. The item's own icon answers both.
			//
			// Connected is not enough: a control inside a closed popover is still in the document and
			// still refuses focus, so `focus()` on it silently drops the keyboard on the body. That is
			// the launcher, and it is why the dock hands focus back to its own button before opening.
			const usable = opener?.isConnected && opener.checkVisibility() ? opener : null;
			const icon = href ? document.querySelector<HTMLElement>(`a[href="${href}"]`) : null;
			(usable ?? icon)?.focus();
		};
	});

	/**
	 * Where the window is being dragged to and how big it is being dragged out to, both
	 * component-local for the length of the gesture. The store is written once, on pointerup, so
	 * a gesture is one state change and not one per frame (ledger #25). Null means no gesture is
	 * running and the record is the truth again, which is also what a cancelled gesture restores.
	 */
	let pos = $state<{ x: number; y: number } | null>(null);
	let size = $state<Bounds | null>(null);

	const x = $derived(pos?.x ?? record.x);
	const y = $derived(pos?.y ?? record.y);
	const w = $derived(size?.w ?? record.w);
	const h = $derived(size?.h ?? record.h);

	/** Which step of the cascade this window sits on, while it is still where CSS put it. */
	const n = $derived(record.seq % WRAP);

	/**
	 * The desktop the window is being moved or stretched inside. Read at pointerdown rather than
	 * on mount, so a resized viewport is measured again: ledger #5 was exactly the opposite,
	 * dimensions read once in `onMount` while the position math stayed live.
	 */
	function desktop(): Bounds | undefined {
		const layer = frame?.parentElement;
		return layer ? { w: layer.clientWidth, h: layer.clientHeight } : undefined;
	}

	/** Dragging by the title bar. */
	const handle = gesture((event) => {
		// A press on one of the title bar's controls is that control's, not a drag's.
		if ((event.target as Element).closest('button')) return;

		const bounds = desktop();
		if (!frame?.parentElement || !bounds) return;

		// Measured, not read off the record, because a window that has never been dragged carries
		// no position: it is wherever the stylesheet centred it. One expression covers both cases,
		// and the drag stays in the absolute pixels `clampToDesktop` already speaks.
		const box = frame.getBoundingClientRect();
		const layer = frame.parentElement.getBoundingClientRect();
		const from = { x: box.left - layer.left, y: box.top - layer.top };
		const width = frame.offsetWidth;
		pos = from;

		return {
			move: (dx, dy) => (pos = clampToDesktop(from.x + dx, from.y + dy, width, bounds)),
			commit: () => {
				if (pos) windows.moveTo(record.id, pos.x, pos.y);
				pos = null;
			},
			cancel: () => (pos = null)
		};
	});

	/** Stretching by the corner grip. Same gesture, different arithmetic. */
	const grip = gesture(() => {
		const bounds = desktop();
		if (!frame || !bounds) return;

		// The rendered size, because a window that has never been resized carries none of its own.
		const from = { w: frame.offsetWidth, h: frame.offsetHeight };
		size = from;

		return {
			move: (dx, dy) => (size = clampSize(from.w + dx, from.h + dy, bounds)),
			commit: () => {
				if (size) windows.resizeTo(record.id, size.w, size.h);
				size = null;
			},
			cancel: () => (size = null)
		};
	});

	function open(child: Node): void {
		// A folder is a place, so it opens in this window and pushes history, the way a file
		// manager has always worked; the back button is the way out. A document is not a place: it
		// gets its own window, the way double-clicking a file has always handed it to a viewer.
		// `windows.open` raises and unminimizes one that is already open rather than duplicating it.
		if (child.kind === 'folder') windows.navigate(record.id, child.id);
		else windows.open(child.id, child.kind);
	}
</script>

{#if (showing || showingApp) && !record.minimized}
	<!--
		Position is a custom property rather than an inline `transform`, so the mobile rule below
		can drop it without `!important` and without a second markup tree (ledger #27). The
		property applied is `translate3d`, never `left`/`top` (ledger #24).
	-->
	<!--
		A window that has never been resized sets no `--w`, and one that has never been dragged sets
		no `--x`, so both defaults below stay CSS expressions against the desktop rather than numbers
		frozen at open time. That is what puts a new window in the middle of the screen: `--n` is its
		step of the cascade, so a second window opens just off the first rather than on top of it.
	-->
	<!--
		`|global`, and it is load-bearing rather than decorative (2.14). A Svelte 5 transition is
		local by default, which means it plays only when the state change happened in its own block.
		Minimize and restore flip the `{#if}` above, so those two qualify; opening and closing add
		and remove this whole component from the each in `WindowLayer`, which is one block up, so
		local skipped both silently. Removing the modifier does not fail a test or log a warning, it
		just quietly takes the animation off the two operations most visitors will ever see.
	-->
	<div
		bind:this={frame}
		class="frame"
		style:--x={x === undefined ? null : `${x}px`}
		style:--y={y === undefined ? null : `${y}px`}
		style:--w={w ? `${w}px` : null}
		style:--h={h ? `${h}px` : null}
		style:--n={n}
		style:z-index={z}
		transition:scale|global={motion}
	>
		<Window
			class="h-full w-full"
			bind:element={win}
			{handle}
			{grip}
			onpointerdown={raise}
			onfocusin={raise}
			{onkeydown}
			{title}
			focused={windows.isFocused(record.id)}
			nav={isFolder}
			path={isFolder ? path : undefined}
			canBack={canBack(record)}
			canForward={canForward(record)}
			onback={() => windows.back(record.id)}
			onforward={() => windows.forward(record.id)}
			onminimize={() => windows.minimize(record.id)}
			onclose={() => windows.close(record.id)}
			toolbar={isFolder ? toolbar : undefined}
			sidebar={isFolder && described ? sidebar : undefined}
		>
			{#if showingApp}
				<AppContent id={showingApp.id} />
			{:else if showing}
				<NodeContent
					node={showing}
					view={record.view}
					{selected}
					onopen={open}
					onselect={(child) => (selected = child.id)}
				/>
			{/if}
		</Window>
	</div>
{/if}

{#snippet toolbar()}
	<ViewSwitcher view={record.view} onview={(next) => windows.setView(record.id, next)} />
{/snippet}

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
		/* One step of the cascade, and how far the middle sits above the dock. */
		--step: 28px;

		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		width: var(--w, min(46rem, calc(100vw - 2rem)));
		height: var(--h, min(30rem, calc(100dvh - var(--dock-h) - 4rem)));
		/*
		   The fallbacks centre the window in the desktop: `50cq*` is half the layer, `50%` is half
		   this element, and the two together put the middle of one on the middle of the other
		   whatever size either turns out to be. The layer is a size container so that resolves; the
		   dock is discounted so the window is centred in the space a visitor can actually see.

		   A dragged window sets `--x` and `--y` and the fallbacks stop applying, which is why drag
		   measures where it starts rather than reading a number off the record.
		*/
		transform: translate3d(
			var(--x, calc(50cqw - 50% + (var(--n) - 2.5) * var(--step))),
			var(--y, calc(50cqh - 50% - var(--dock-h) / 2 + (var(--n) - 2.5) * var(--step))),
			0
		);
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
