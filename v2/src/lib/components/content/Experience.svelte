<script lang="ts">
	import { formatRange } from '$lib/date';
	import type { Experience } from '$lib/types/experience';
	import Company from './Company.svelte';
	import Prose from './Prose.svelte';

	let { data }: { data: Experience } = $props();
</script>

<article class="grid gap-6">
	<header class="grid gap-3">
		<div class="grid gap-1">
			<h1 class="text-xl font-semibold">{data.role}</h1>
			<!-- A machine-readable range would need two `<time>` elements and a full date each; these
			     are months, and the honest markup for a month is text. -->
			<p class="font-ui text-xs text-fg-3">{formatRange(data.start, data.end)}</p>
		</div>
		<Company data={data.company} />
	</header>

	<Prose paragraphs={data.description} />
</article>
