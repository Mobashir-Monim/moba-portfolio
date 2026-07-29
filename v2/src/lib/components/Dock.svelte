<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		folders = 0,
		documents = 0,
		onapps,
		onsettings,
		onfolders,
		ondocuments
	}: {
		/** Open folder windows. The group is hidden at zero rather than shown empty. */
		folders?: number;
		documents?: number;
		onapps?: () => void;
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
</script>

<nav class="dock" aria-label="Dock">
	<!-- The launcher appears when there is a roster to launch, in phase 4. A button that opens
	     nothing is what the old site shipped, as a full-screen "No apps installed yet" overlay. -->
	<!-- Present from the start, because it is part of the composition, and disabled until there
	     is a roster behind it in phase 4. The old site's answer was a full-screen overlay reading
	     "No apps installed yet", which is a worse way to say the same thing. -->
	<button type="button" class="slot" onclick={onapps} disabled={!onapps}>
		<Icon name="apps" size={20} />
		<span class="sr-only">Apps</span>
	</button>
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
