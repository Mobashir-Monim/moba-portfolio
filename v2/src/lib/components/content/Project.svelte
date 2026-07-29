<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Project } from '$lib/types/project';
	import Company from './Company.svelte';
	import Prose from './Prose.svelte';
	import Skills from './Skills.svelte';

	let { data }: { data: Project } = $props();
</script>

<article class="grid gap-6">
	<header class="grid gap-3">
		<div class="grid gap-1">
			<h1 class="text-xl font-semibold">{data.name}</h1>
			<p class="font-ui text-xs text-fg-3 capitalize">
				{data.kind}, {data.source} source
			</p>
		</div>

		{#if data.company}
			<Company data={data.company} />
		{/if}

		{#if data.url}
			<p>
				<a
					href={data.url}
					rel="noreferrer noopener external"
					class="inline-flex items-center gap-1.5 font-ui text-sm text-accent underline underline-offset-2"
				>
					<Icon name="link" size={14} />
					View source
				</a>
			</p>
		{/if}
	</header>

	<Prose paragraphs={data.description} />

	{#if data.features.length > 0}
		<section class="grid gap-2">
			<h2 class="font-ui text-sm font-semibold">Features</h2>
			<ul class="grid list-disc gap-1 ps-5 text-fg-2">
				{#each data.features as feature (feature)}
					<li>{feature}</li>
				{/each}
			</ul>
		</section>
	{/if}

	<Skills skills={data.skills} label="Built with" />
</article>
