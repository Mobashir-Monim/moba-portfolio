<script lang="ts">
	import { VIEWS, VIEW_LABEL, type View } from '$lib/os';
	import Icon from './Icon.svelte';

	let { view, onview }: { view: View; onview: (next: View) => void } = $props();
</script>

<!--
	Buttons with `aria-pressed`, not a radio group: these act on the window in front of you rather
	than record an answer to submit, and a toolbar toggle is what `aria-pressed` is for. Each one
	carries its name in visually hidden text, so the glyphs stay unlabelled without going unnamed.
-->
<div class="switcher" role="group" aria-label="Show items">
	{#each VIEWS as value (value)}
		<button
			type="button"
			class="option"
			aria-pressed={view === value}
			onclick={() => onview(value)}
		>
			<Icon name="view-{value}" size={18} />
			<span class="sr-only">{VIEW_LABEL[value]}</span>
		</button>
	{/each}
</div>

<style>
	/* One segmented control: the group carries the border and the children carry the divisions,
	   so retro's hairlines never double up where two segments meet. */
	.switcher {
		display: flex;
		flex: none;
		align-items: stretch;
		border: var(--bw) solid var(--c-line);
		border-radius: var(--r-sm);
		overflow: hidden;
	}

	.option {
		display: grid;
		place-items: center;
		padding-inline: 0.375rem;
		color: var(--c-fg-3);
		border-inline-start: var(--bw) solid var(--c-line);
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ez-standard),
			color var(--dur-fast) var(--ez-standard);
	}

	.option:first-child {
		border-inline-start: 0;
	}

	.option:hover {
		background: color-mix(in oklab, var(--c-fg-1) 8%, transparent);
		color: var(--c-fg-1);
	}

	/* The pressed segment is the one place this control spends colour, which is the same budget
	   the selection highlight is drawn from and therefore true in retro as well. */
	.option[aria-pressed='true'] {
		background: var(--c-select);
		color: var(--c-on-select);
	}
</style>
