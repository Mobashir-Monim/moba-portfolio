<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { followSystemAppearance } from '$lib/appearance.svelte';

	let { children } = $props();

	// The pre-paint script in app.html resolves the OS preference once. This keeps it current
	// for the rest of the visit, and the effect's own teardown is the whole of the cleanup.
	$effect(followSystemAppearance);
</script>

<svelte:head><link rel="icon" type="image/svg+xml" href={favicon} /></svelte:head>
{@render children()}
