<script lang="ts">
	import type { App } from '$lib/apps';
	import type { ChromeName } from '$lib/icons';
	import type { Kind } from '$lib/os';
	import AppLauncher from './AppLauncher.svelte';
	import Icon from './Icon.svelte';

	/** One open window, as much of it as the dock needs to draw and to name it. */
	type DockWindow = { id: string; kind: Kind; name: string };

	let {
		open = [],
		apps = [],
		onlaunch,
		onsettings,
		onrestore,
		onrestorekind
	}: {
		/** Open windows in stacking order. Minimized ones are in here too, which is the point. */
		open?: readonly DockWindow[];
		/** The roster the launcher lists. Empty and the launcher is disabled, which it was until 4.5. */
		apps?: readonly App[];
		onlaunch?: (id: string) => void;
		onsettings?: () => void;
		/** Bring one named window back, from the group's context menu. */
		onrestore?: (id: string) => void;
		/** Bring a whole kind back, from a plain click on the group. */
		onrestorekind?: (kind: Kind) => void;
	} = $props();

	/**
	 * The three groups, in the order the filesystem reads: places, then files, then programs. The
	 * glyph is named for the kind because a group is named for the kind of thing it holds, which is
	 * also why an app no longer counts as a document: it wore a document's mark and was not one.
	 */
	const GROUPS: { kind: Kind; glyph: ChromeName; one: string; many: string }[] = [
		{ kind: 'folder', glyph: 'folder', one: 'folder', many: 'folders' },
		{ kind: 'document', glyph: 'document', one: 'document', many: 'documents' },
		{ kind: 'app', glyph: 'app', one: 'app', many: 'apps' }
	];

	/** A group with nothing in it is hidden rather than shown empty. */
	const groups = $derived(
		GROUPS.map((group) => ({ ...group, items: open.filter((w) => w.kind === group.kind) })).filter(
			(group) => group.items.length > 0
		)
	);

	// One id per instance, so two docks on a page cannot both claim the same popover.
	const launcherId = $props.id();

	let trigger = $state<HTMLButtonElement>();

	/** Only so the trigger can announce itself. The launcher mirrors it off the toggle event. */
	let launcherOpen = $state(false);

	/** Each group's own menu, filled by `bind:this` and keyed by kind. */
	let menus = $state<Record<string, HTMLElement | undefined>>({});

	/**
	 * Focus goes back to the launcher button before the window opens, not after.
	 *
	 * A window records whatever held focus when it mounted and hands it back when it closes, and
	 * without this that would be a control inside a popover that is about to be hidden, which then
	 * refuses focus and drops the keyboard on the body. Doing it here rather than teaching the
	 * window about popovers keeps the knowledge where the popover is.
	 */
	function launch(id: string): void {
		trigger?.focus();
		onlaunch?.(id);
	}

	function restore(kind: Kind, id: string): void {
		menus[kind]?.hidePopover();
		onrestore?.(id);
	}

	/**
	 * Right-click, and also Shift+F10 and the context-menu key: the browser routes all three
	 * through this one event, so picking a single window out of a group is not the mouse's alone.
	 */
	function contextmenu(event: Event, kind: Kind): void {
		const menu = menus[kind];
		if (!menu) return;
		event.preventDefault();
		menu.showPopover();
	}
</script>

<nav class="dock" aria-label="Dock">
	<!--
		The launcher is the native popover, not an overlay this component draws. Light dismiss,
		Escape, the top layer, and returning focus to this button are all things the platform already
		does, and the whole of what a hand-rolled launcher would have been writing. The old site's
		answer here was a full-screen overlay reading "No apps installed yet"; this is the full-screen
		overlay it should have been.
	-->
	<button
		bind:this={trigger}
		type="button"
		class="slot"
		popovertarget={launcherId}
		aria-expanded={launcherOpen}
		disabled={apps.length === 0}
	>
		<Icon name="apps" size="var(--dock-icon)" />
		<span class="sr-only">Apps</span>
	</button>

	<AppLauncher
		id={launcherId}
		{apps}
		onlaunch={launch}
		onopenchange={(state) => (launcherOpen = state)}
	/>

	<button type="button" class="slot" onclick={onsettings}>
		<Icon name="settings" size="var(--dock-icon)" />
		<span class="sr-only">Settings</span>
	</button>

	{#if groups.length > 0}
		<span class="rule" aria-hidden="true"></span>
	{/if}

	<!--
		A group is one icon with the count on it, the way a dock has always said "there are several
		of these". The word used to sit on screen beside the glyph, which grew the dock sideways with
		every window opened and read as a status line rather than as a control.

		Click brings the whole kind back, the context menu picks one out of it. The accessible name
		says what the badge shows, so the numeral itself is hidden and is not announced twice.
	-->
	{#each groups as group (group.kind)}
		<div class="group">
			<button
				type="button"
				class="slot"
				aria-label="{group.items.length} open {group.items.length === 1 ? group.one : group.many}"
				aria-haspopup="menu"
				onclick={() => onrestorekind?.(group.kind)}
				oncontextmenu={(event) => contextmenu(event, group.kind)}
			>
				<Icon name={group.glyph} size="var(--dock-icon)" />
				<span class="badge" aria-hidden="true">{group.items.length}</span>
			</button>

			<!--
				Labelled buttons rather than `role="menu"`, the same call the launcher makes: the role
				promises arrow-key navigation, and Tab already walks this.
			-->
			<ul bind:this={menus[group.kind]} popover class="menu" aria-label="Open {group.many}">
				{#each group.items as item (item.id)}
					<li>
						<button type="button" onclick={() => restore(group.kind, item.id)}>{item.name}</button>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</nav>

<style>
	.dock {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		background: var(--window-bg);
		padding: 0.375rem;
		backdrop-filter: blur(var(--bl-chrome));
		border: var(--bw-strong) solid var(--c-line);
		border-radius: var(--r-lg);
		box-shadow: var(--elev-1);
		font-family: var(--ff-ui);
		font-size: var(--fs-xs);
	}

	.slot {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem;
		color: var(--c-fg-1);
		border-radius: var(--r-md);
		box-shadow: var(--bevel-in);
		cursor: pointer;
		background: color-mix(in oklab, var(--c-fg-1) 8%, transparent);
		transition: all var(--dur-fast) var(--ez-standard);
	}

	.slot:hover:not(:disabled) {
		background: color-mix(in oklab, var(--c-fg-1) 25%, transparent);
	}

	.slot:active:not(:disabled) {
		box-shadow: var(--bevel-in);
	}

	.slot:disabled {
		opacity: 0.4;
		cursor: default;
	}

	/* The badge's containing block, and nothing else: a group is a button plus a popover, and an
	   open popover leaves the flow entirely. */
	.group {
		position: relative;
		display: flex;
	}

	.badge {
		position: absolute;
		inset-block-start: 0.25rem;
		inset-inline-end: 0.25rem;
		display: grid;
		place-items: center;
		min-width: 1.125rem;
		height: 1.125rem;
		padding-inline: 0.25rem;
		background: var(--c-select);
		color: var(--c-on-select);
		border-radius: 999px;
		font-size: var(--fs-xs);
		font-variant-numeric: tabular-nums;
		line-height: 1;
		pointer-events: none;
	}

	/* Retro has no round anything. The badge takes `--c-select` rather than `--c-accent` because
	   the selection highlight is the one colour inside every skin's accent budget, retro included. */
	:global(html[data-skin='retro']) .badge {
		border-radius: 0;
		box-shadow: var(--bevel-out);
	}

	/*
	   An open popover is in the top layer, where an ancestor's containing block no longer applies,
	   so it is positioned against the viewport the way the dock itself is. That is exact on the
	   desktop, which is the only place a real dock is; in the styleguide the menu opens above where
	   the dock would be rather than above the swatch.
	*/
	.menu {
		position: fixed;
		inset: auto;
		inset-block-end: calc(var(--dock-h) + 1.25rem);
		left: 50%;
		translate: -50%;
		min-width: 10rem;
		max-width: min(22rem, calc(100vw - 2rem));
		margin: 0;
		padding: 0.25rem;
		background: var(--window-bg);
		backdrop-filter: blur(var(--bl-chrome));
		color: var(--c-fg-1);
		border: var(--bw-strong) solid var(--c-line);
		border-radius: var(--r-md);
		box-shadow: var(--elev-2);
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		letter-spacing: var(--tracking-ui);
	}

	.menu button {
		display: block;
		width: 100%;
		padding: 0.375rem 0.625rem;
		overflow: hidden;
		text-align: start;
		text-overflow: ellipsis;
		white-space: nowrap;
		border-radius: var(--r-sm);
		cursor: pointer;
	}

	.menu button:hover {
		background: var(--c-select);
		color: var(--c-on-select);
	}

	.rule {
		align-self: stretch;
		width: var(--bw);
		margin-block: 0.5rem;
		background: var(--c-line);
	}
</style>
