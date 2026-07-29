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
	<button type="button" class="slot" onclick={onapps}>
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

	{#each groups as [key, count, onclick] (key)}
		<button type="button" class="slot" {onclick}>
			<Icon name={key} size={20} />
			<span class="count" aria-hidden="true">{count}</span>
			<span class="sr-only">
				Show {count}
				{key}{count === 1 ? '' : 's'}
			</span>
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

	.slot:hover {
		background: color-mix(in oklab, var(--c-fg-1) 8%, transparent);
	}

	.slot:active {
		box-shadow: var(--bevel-in);
	}

	.count {
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.rule {
		align-self: stretch;
		width: var(--bw);
		margin-block: 0.5rem;
		background: var(--c-line);
	}
</style>
