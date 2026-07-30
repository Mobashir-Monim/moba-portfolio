<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { About } from '$lib/types/about';
	import Prose from './Prose.svelte';
	import Skills from './Skills.svelte';

	let { data }: { data: About } = $props();

	const fullName = $derived(
		[data.person.first, data.person.middle, data.person.last].filter(Boolean).join(' ')
	);
	const place = $derived(
		[data.location.city, data.location.state, data.location.country].filter(Boolean).join(', ')
	);
</script>

<article class="grid gap-6">
	<header class="grid gap-1">
		<h1 class="text-2xl font-semibold">{fullName}</h1>
		<p class="font-ui text-sm text-fg-2">{data.title}</p>
		<p class="font-ui text-xs text-fg-3">{place}</p>
	</header>

	<Prose paragraphs={data.description} />

	<section class="grid gap-2">
		<h2 class="font-ui text-sm font-semibold">Elsewhere</h2>
		<ul class="flex flex-wrap gap-2">
			{#each data.socials as social (social.label)}
				<li>
					<!-- The label is visible text beside the mark, so the icon is decorative and the link
					     already has its accessible name. -->
					<a
						href={social.href}
						rel="noreferrer noopener external"
						target="_blank"
						class="flex items-center gap-1.5 rounded-sm border border-line bg-surface-2 px-2 py-1 font-ui text-xs capitalize"
					>
						<Icon name={social.label} size={14} />
						{social.label}
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<Skills skills={data.skills} />
</article>
