<script lang="ts">
	import type { Company } from '$lib/types/company';

	let { data, detailed = false }: { data: Company; detailed?: boolean } = $props();

	const place = $derived(
		[data.location.city, data.location.state, data.location.country].filter(Boolean).join(', ')
	);
</script>

<!--
	The company card, shared by an experience and by a project built under one. The logo is
	decorative: the name is right beside it in text, so announcing it twice is noise, and a
	company with no mark in the repo simply drops it rather than standing in a placeholder.
-->
<div class="flex items-center gap-3">
	{#if data.logo}
		<img src={data.logo} alt="" width="40" height="40" class="rounded-sm object-contain" />
	{/if}
	<div class="min-w-0">
		<p class="font-ui text-sm font-semibold">{data.name}</p>
		<p class="font-ui text-xs text-fg-3">{data.industry}, {place}</p>
		{#if data.website}
			<!-- The value is a bare host so it reads well; the scheme is added only here. -->
			<a
				href="https://{data.website}"
				rel="noreferrer noopener external"
				class="font-ui text-xs text-accent underline underline-offset-2">{data.website}</a
			>
		{/if}
	</div>
</div>

{#if detailed}
	<div class="grid gap-3 text-fg-2">
		{#each data.description as paragraph, i (i)}
			<p>{paragraph}</p>
		{/each}
	</div>
{/if}
