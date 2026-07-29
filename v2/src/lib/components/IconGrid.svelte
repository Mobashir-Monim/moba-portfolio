<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: klass = '' }: { children: Snippet; class?: string } = $props();
</script>

<!--
	The icon grid, shared by the desktop and by every folder. The desktop paints the ground it
	sits on; the grid itself is the same grid in both places, so it is one component and not two
	copies of `grid-template-columns`.

	No role, decided rather than deferred: the links inside are already reachable and operable, and
	the arrows they were missing live on the links themselves. `$lib/roving` has the reasoning, and
	it is also what measures this grid's column count, since only the layout knows where a row ends.
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
