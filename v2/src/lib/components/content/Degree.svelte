<script lang="ts">
	import { formatRange } from '$lib/date';
	import type { Degree } from '$lib/types/attainment';
	import Prose from './Prose.svelte';

	let { data }: { data: Degree } = $props();

	const place = $derived(
		[data.location.city, data.location.state, data.location.country].filter(Boolean).join(', ')
	);
</script>

<article class="grid gap-6">
	<header class="grid gap-1">
		<h1 class="text-xl font-semibold">{data.name}</h1>
		<p class="font-ui text-sm text-fg-2">{data.institution}, {place}</p>
		<p class="font-ui text-xs text-fg-3">{formatRange(data.start, data.end)}</p>
	</header>

	<Prose paragraphs={data.description} />
</article>
