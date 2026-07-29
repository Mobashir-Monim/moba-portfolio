<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Publication } from '$lib/types/attainment';
	import Prose from './Prose.svelte';

	let { data }: { data: Publication } = $props();

	const authors = $derived(
		data.authors.map((a) => [a.first, a.middle, a.last].filter(Boolean).join(' '))
	);
</script>

<article class="grid gap-6">
	<header class="grid gap-1">
		<h1 class="text-xl font-semibold">{data.name}</h1>
		<!-- Publication order, which is meaningful and is not mine to sort. -->
		<p class="font-ui text-sm text-fg-2">{authors.join(', ')}</p>
		<p class="font-ui text-xs text-fg-3">{data.venue}, {data.year}</p>
	</header>

	<section class="grid gap-2">
		<h2 class="font-ui text-sm font-semibold">Abstract</h2>
		<Prose paragraphs={data.description} />
	</section>

	<p>
		<a
			href={data.url}
			rel="noreferrer noopener external"
			class="inline-flex items-center gap-1.5 font-ui text-sm text-accent underline underline-offset-2"
		>
			<Icon name="link" size={14} />
			Read the paper
		</a>
	</p>
</article>
