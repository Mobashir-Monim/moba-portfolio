<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: klass = '' }: { children: Snippet; class?: string } = $props();
</script>

<!--
	The ground the whole OS sits on. `--desktop-bg` is where the three skins diverge hardest:
	graph paper in modern, a two-by-two ordered dither in retro, an accent wash in glass. All
	three are one token, so this element never learns which skin it is in.

	The root is a list down the left edge, not a field of tiles. It is four places to go, and a
	column reads as a menu where a grid reads as a folder that happens to be empty. Folders use
	`IconGrid`; this is the one place that does not.

	No role and no label: 2.9 turns the list into a `role="listbox"` with arrow-key navigation,
	and a role invented now would only have to be replaced then.
-->
<div class="desktop {klass}">
	<div class="list">{@render children()}</div>
</div>

<style>
	.desktop {
		background: var(--desktop-bg);
	}

	.list {
		display: grid;
		grid-template-columns: max-content;
		gap: 0.125rem;
		padding: 1rem;
	}
</style>
