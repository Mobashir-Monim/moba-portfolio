<script lang="ts">
	import { formatRange } from '$lib/date';
	import type { Certification } from '$lib/types/attainment';
	import Prose from './Prose.svelte';

	let { data }: { data: Certification } = $props();
</script>

<article class="grid gap-6">
	<header class="grid gap-1">
		<h1 class="text-xl font-semibold">{data.name}</h1>
		<p class="font-ui text-sm text-fg-2">{data.issuer}</p>
		<!-- A certification's range is validity, not tenure, so it says so rather than leaving the
		     reader to guess why a credential ended. -->
		<p class="font-ui text-xs text-fg-3">Valid {formatRange(data.start, data.end)}</p>
	</header>

	<Prose paragraphs={data.description} />
</article>
