<script lang="ts">
	import type { App } from '$lib/apps';
	import Icon from './Icon.svelte';

	let {
		id,
		apps = [],
		onlaunch,
		onopenchange
	}: {
		/** The `popovertarget` the dock's launcher button points at. Owned by the caller so the
		 *  trigger and the surface can live in two components without a store between them. */
		id: string;
		apps?: readonly App[];
		onlaunch?: (id: string) => void;
		/** The popover's open state is the browser's. This forwards it rather than owning it, so
		 *  the trigger over in the dock can announce `aria-expanded`. */
		onopenchange?: (open: boolean) => void;
	} = $props();

	let surface = $state<HTMLElement>();

	/**
	 * Launching closes the launcher, and it has to close before the window opens: a window records
	 * whatever held focus when it mounted and hands it back when it closes, and a control inside a
	 * hidden popover is still in the document while refusing focus, which drops the keyboard on the
	 * body. The dock hands focus back to its own button for the same reason.
	 */
	function launch(app: App): void {
		surface?.hidePopover();
		onlaunch?.(app.id);
	}
</script>

<!--
	Full screen, and the platform's own popover rather than a hand-rolled overlay: light dismiss,
	Escape, the top layer, and returning focus to the launcher button are all things the browser
	already does. The old site's answer here was a full-screen overlay reading "No apps installed
	yet"; 4.5 replaced it with a menu, and a menu is not what a wall of apps is.

	Deliberately not `role="menu"` and no arrow keys, for the reason 2.9 settled: that role promises
	keyboard behaviour, and announcing behaviour nothing implements is worse than announcing none.
	Tab walks the grid, Enter launches, Escape leaves, all of it the platform's.
-->
<div
	bind:this={surface}
	{id}
	popover
	class="launcher"
	aria-label="Apps"
	ontoggle={(event) => onopenchange?.((event as ToggleEvent).newState === 'open')}
>
	<div class="grid">
		{#each apps as item (item.id)}
			<button type="button" class="app" onclick={() => launch(item)}>
				<span class="mark"><Icon name={item.icon} size="var(--launch-glyph)" /></span>
				<span class="name">{item.name}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.launcher {
		--launch-tile: 7rem;
		--launch-glyph: 3rem;

		position: fixed;
		inset: 0;
		width: 100%;
		max-width: 100%;
		height: 100%;
		max-height: 100%;
		padding: 2rem;
		overflow: auto;
		background: color-mix(in oklab, var(--c-surface-0) 72%, transparent);
		backdrop-filter: blur(calc(var(--bl-chrome) + 8px));
		color: var(--c-fg-1);
		border: 0;
	}

	/* `display` only once it is open, and that is not a detail: the UA rule that hides a closed
	   popover is `display: none`, and any author `display` beats a UA one whatever the specificity.
	   Setting it on `.launcher` would leave the launcher permanently on screen. */
	.launcher:popover-open {
		display: grid;
		place-items: center;
	}

	/* Retro had no translucency at all, and no full-screen anything: an opaque field is the honest
	   version of this there, and `--bl-chrome: 0px` is already the skin's opt-out from the blur. */
	:global(html[data-skin='retro']) .launcher {
		background: var(--c-surface-0);
	}

	.launcher::backdrop {
		background: transparent;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, var(--launch-tile));
		justify-content: center;
		gap: 1.5rem;
		width: min(56rem, 100%);
	}

	.app {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.625rem;
		padding: 0.75rem 0.25rem;
		color: inherit;
		border-radius: var(--r-md);
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		letter-spacing: var(--tracking-ui);
		text-align: center;
		cursor: pointer;
		transition: background-color var(--dur-fast) var(--ez-standard);
	}

	.app:hover {
		background: color-mix(in oklab, var(--c-fg-1) 8%, transparent);
	}

	/* The mark is the app's tile, the way a launcher has always drawn one: the glyph sits on a
	   surface rather than floating on the ground, so the grid reads as icons and not as a list. */
	.mark {
		display: grid;
		place-items: center;
		width: calc(var(--launch-glyph) + 1.75rem);
		height: calc(var(--launch-glyph) + 1.75rem);
		background: var(--c-surface-2);
		border: var(--bw) solid var(--c-line-strong);
		border-radius: var(--r-lg);
		box-shadow: var(--elev-1), var(--bevel-out);
	}

	.app:active .mark {
		box-shadow: var(--bevel-in);
	}

	.name {
		max-width: 100%;
		overflow-wrap: anywhere;
		line-height: var(--lh-tight);
	}

	@media (min-width: 48rem) {
		.launcher {
			--launch-tile: 8.5rem;
			--launch-glyph: 3.75rem;
		}
	}
</style>
