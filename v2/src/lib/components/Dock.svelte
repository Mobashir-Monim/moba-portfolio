<script lang="ts">
	import type { App } from '$lib/apps';
	import Icon from './Icon.svelte';

	let {
		folders = 0,
		documents = 0,
		apps = [],
		onlaunch,
		onsettings,
		onfolders,
		ondocuments
	}: {
		/** Open folder windows. The group is hidden at zero rather than shown empty. */
		folders?: number;
		documents?: number;
		/** The roster the apps menu lists. Empty and the launcher is disabled, which it was until 4.5. */
		apps?: readonly App[];
		onlaunch?: (id: string) => void;
		onsettings?: () => void;
		onfolders?: () => void;
		ondocuments?: () => void;
	} = $props();

	// The key doubles as the glyph name, which is not a coincidence: a group is named for the
	// kind of thing it holds, and so is the icon.
	const groups = $derived(
		(
			[
				['folder', folders, onfolders],
				['document', documents, ondocuments]
			] as const
		).filter(([, count]) => count > 0)
	);

	// One id per instance, so two docks on a page cannot both claim the same popover.
	const menuId = $props.id();

	/**
	 * Only so the trigger can announce itself. The popover's own open state is the browser's, and
	 * this mirrors it off the toggle event rather than trying to own it.
	 */
	let open = $state(false);

	let trigger = $state<HTMLButtonElement>();

	/**
	 * Focus goes back to the launcher before the window opens, not after.
	 *
	 * A window records whatever held focus when it mounted and hands it back when it closes, and
	 * without this that would be the menu item: an element inside a popover that is about to be
	 * hidden, which then refuses focus and drops the keyboard on the body. Doing it here rather
	 * than teaching the window about popovers keeps the knowledge where the popover is.
	 */
	function launch(id: string): void {
		trigger?.focus();
		onlaunch?.(id);
	}
</script>

<nav class="dock" aria-label="Dock">
	<!--
		The launcher is the native popover, not a component. Light dismiss, Escape, the top layer,
		and returning focus to this button are all things the platform already does, and the whole
		of what a hand-rolled menu would have been writing. The old site's answer here was a
		full-screen overlay reading "No apps installed yet".
	-->
	<button
		bind:this={trigger}
		type="button"
		class="slot"
		popovertarget={menuId}
		aria-expanded={open}
		disabled={apps.length === 0}
	>
		<Icon name="apps" size={20} />
		<span class="sr-only">Apps</span>
	</button>

	<!--
		A labelled list of buttons, deliberately not `role="menu"`. That role promises arrow-key
		navigation, and 2.9 settled the principle: an attribute that announces keyboard behaviour
		nothing implements is worse than no attribute. Tab walks it, Enter launches, Escape leaves.

		Each item hides the popover through `popovertargetaction`, so dismissing on launch is the
		platform's job and not a handler's.
	-->
	<ul
		id={menuId}
		popover
		class="menu"
		aria-label="Apps"
		ontoggle={(event) => (open = (event as ToggleEvent).newState === 'open')}
	>
		{#each apps as item (item.id)}
			<li>
				<button
					type="button"
					popovertarget={menuId}
					popovertargetaction="hide"
					onclick={() => launch(item.id)}
				>
					{item.name}
				</button>
			</li>
		{/each}
	</ul>

	<button type="button" class="slot" onclick={onsettings}>
		<Icon name="settings" size={20} />
		<span class="sr-only">Settings</span>
	</button>

	{#if groups.length > 0}
		<span class="rule" aria-hidden="true"></span>
	{/if}

	<!-- The word is on screen, not only in the accessibility layer. The mockups read
	     `3 DOCUMENTS`, `1 FOLDER`, and a glyph beside a bare numeral does not say that. -->
	{#each groups as [key, count, onclick] (key)}
		<button type="button" class="slot" {onclick}>
			<Icon name={key} size={20} />
			<span class="count">{count} {key}{count === 1 ? '' : 's'}</span>
		</button>
	{/each}
</nav>

<style>
	.dock {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		height: var(--dock-h);
		padding-inline: 0.5rem;
		background: var(--window-bg);
		backdrop-filter: blur(var(--bl-chrome));
		border: var(--bw-strong) solid var(--c-line-strong);
		border-radius: var(--r-lg);
		box-shadow: var(--elev-1);
		font-family: var(--ff-ui);
		font-size: var(--fs-xs);
	}

	.slot {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.5rem;
		color: var(--c-fg-1);
		border-radius: var(--r-sm);
		box-shadow: var(--bevel-out);
		cursor: pointer;
		transition: background-color var(--dur-fast) var(--ez-standard);
	}

	.slot:hover:not(:disabled) {
		background: color-mix(in oklab, var(--c-fg-1) 8%, transparent);
	}

	.slot:active:not(:disabled) {
		box-shadow: var(--bevel-in);
	}

	.slot:disabled {
		opacity: 0.4;
		cursor: default;
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
		margin: 0;
		padding: 0.25rem;
		background: var(--window-bg);
		backdrop-filter: blur(var(--bl-chrome));
		color: var(--c-fg-1);
		border: var(--bw-strong) solid var(--c-line-strong);
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
		text-align: start;
		border-radius: var(--r-sm);
		cursor: pointer;
	}

	.menu button:hover {
		background: var(--c-select);
		color: var(--c-on-select);
	}

	.count {
		font-variant-numeric: tabular-nums;
		line-height: 1;
		text-transform: capitalize;
	}

	.rule {
		align-self: stretch;
		width: var(--bw);
		margin-block: 0.5rem;
		background: var(--c-line);
	}
</style>
