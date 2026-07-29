<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { caseStudyOf } from '$lib/tree';
	import type { Project } from '$lib/types/project';
	import Company from './Company.svelte';
	import Prose from './Prose.svelte';
	import Skills from './Skills.svelte';

	let { data }: { data: Project } = $props();

	/** Six of the twenty-one have one. The rest render exactly as they did. */
	const study = $derived(caseStudyOf(data.slug));
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

		<!-- `href` arrives already built, off the node in `$lib/tree`, which is the route table. The
		     site deploys at the root and has no `base` for `resolve()` to prepend. -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		{#if data.url || study}
			<p class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
				{#if data.url}
					<a
						href={data.url}
						rel="noreferrer noopener external"
						class="inline-flex items-center gap-1.5 font-ui text-sm text-accent underline underline-offset-2"
					>
						<Icon name="link" size={14} />
						View source
					</a>
				{/if}

				{#if study}
					<a
						href={study.href}
						class="inline-flex items-center gap-1.5 font-ui text-sm text-accent underline underline-offset-2"
					>
						<Icon name="document" size={14} />
						Read the case study
					</a>
				{/if}
			</p>
		{/if}
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
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
