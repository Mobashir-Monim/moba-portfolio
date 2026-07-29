<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: klass = '' }: { children: Snippet; class?: string } = $props();
</script>

<!--
	The ground the whole OS sits on. `--desktop-bg` is where the three skins diverge hardest: a
	flat surface in modern, a two-by-two ordered dither in retro, an accent wash in glass. All
	three are one token, so this element never learns which skin it is in.

	No role and no label: in phase 2 the icon list becomes a `role="grid"` with arrow-key
	navigation, and a role invented now would only have to be replaced then.
-->
<div class="desktop {klass}">
	<div class="grid">{@render children()}</div>
</div>

<style>
	.desktop {
		background: var(--desktop-bg);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, var(--icon-tile));
		align-content: start;
		justify-content: start;
		gap: 0.5rem;
		padding: 1rem;
	}
</style>
