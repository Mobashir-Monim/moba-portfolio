<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: klass = '' }: { children: Snippet; class?: string } = $props();
</script>

<!--
	The icon grid, shared by the desktop and by every folder. The desktop paints the ground it
	sits on; the grid itself is the same grid in both places, so it is one component and not two
	copies of `grid-template-columns`.

	No role: 2.9 turns this into a `role="grid"` with arrow-key navigation, and a role invented
	now would only have to be replaced then. Until it has that behavior, the plain links inside
	are already reachable and operable.
-->
<div class="grid {klass}">{@render children()}</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, var(--icon-tile));
		align-content: start;
		justify-content: start;
		gap: 0.5rem;
	}
</style>
