<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { about } from '$lib/content/about';
	import { certifications, degrees, publications } from '$lib/content/attainments';
	import { experiences } from '$lib/content/experiences';
	import { formatRange } from '$lib/date';
	import { nodes } from '$lib/tree';
	import type { Resume } from '$lib/types/resume';
	import type { Location } from '$lib/types/common';
	import Prose from './Prose.svelte';
	import Skills from './Skills.svelte';

	let { data }: { data: Resume } = $props();

	const fullName = [about.person.first, about.person.middle, about.person.last]
		.filter(Boolean)
		.join(' ');

	function place(location: Location): string {
		return [location.city, location.state, location.country].filter(Boolean).join(', ');
	}

	const email = about.socials.find((social) => social.label === 'email');
</script>

<!--
	The CV, assembled from the collections rather than written out again. Every row here is a page
	on this site, so the résumé is the one document that links to all of them, and none of it can
	drift from the pages it summarises: there is nothing to keep in step.
-->
<!-- `href` arrives already built, off the node in `$lib/tree`, which is the route table. The
     site deploys at the root and has no `base` for `resolve()` to prepend. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet row(title: string, href: string, meta: string, when: string)}
	<li class="grid gap-0.5">
		<a {href} class="font-ui text-sm font-semibold underline underline-offset-2">{title}</a>
		<p class="font-ui text-xs text-fg-2">{meta}</p>
		<p class="font-ui text-xs text-fg-3">{when}</p>
	</li>
{/snippet}
<!-- eslint-enable svelte/no-navigation-without-resolve -->

<article class="grid gap-6">
	<header class="grid gap-3">
		<div class="grid gap-1">
			<h1 class="text-2xl font-semibold">{fullName}</h1>
			<p class="font-ui text-sm text-fg-2">{about.title}</p>
			<p class="font-ui text-xs text-fg-3">
				{place(about.location)}{#if email}
					·
					<a
						href={email.href}
						rel="noreferrer noopener external"
						class="underline underline-offset-2">{email.href.replace('mailto:', '')}</a
					>
				{/if}
			</p>
		</div>

		<!--
			An anchor with `download`, which is the platform doing the whole job: SvelteKit's router
			leaves such links alone, so it works with JavaScript off and needs no handler. The served
			filename is a cache key; this is what it lands in the visitor's downloads folder as.
		-->
		<!-- A file in `static/`, not a route, so there is nothing for `resolve()` to resolve. -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<p>
			<a
				href={data.file}
				download={data.filename}
				class="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface-2 px-3 py-1.5 font-ui text-sm text-accent"
			>
				<Icon name="document" size={14} />
				Download PDF
			</a>
		</p>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</header>

	<Prose paragraphs={data.description} />

	<section class="grid gap-2">
		<h2 class="font-ui text-sm font-semibold">Experience</h2>
		<!-- Ordered, because the collection's order is the CV's order and it carries meaning. -->
		<ol class="grid gap-3">
			{#each experiences as experience (experience.slug)}
				{@render row(
					experience.role,
					nodes[experience.slug].href,
					`${experience.company.name}, ${place(experience.company.location)}`,
					formatRange(experience.start, experience.end)
				)}
			{/each}
		</ol>
	</section>

	<section class="grid gap-2">
		<h2 class="font-ui text-sm font-semibold">Education</h2>
		<ul class="grid gap-3">
			{#each degrees as degree (degree.slug)}
				{@render row(
					degree.name,
					nodes[degree.slug].href,
					`${degree.institution}, ${place(degree.location)}`,
					formatRange(degree.start, degree.end)
				)}
			{/each}
		</ul>
	</section>

	<section class="grid gap-2">
		<h2 class="font-ui text-sm font-semibold">Certifications</h2>
		<ul class="grid gap-3">
			{#each certifications as certification (certification.slug)}
				{@render row(
					certification.name,
					nodes[certification.slug].href,
					certification.issuer,
					`Valid ${formatRange(certification.start, certification.end)}`
				)}
			{/each}
		</ul>
	</section>

	<section class="grid gap-2">
		<h2 class="font-ui text-sm font-semibold">Publications</h2>
		<ul class="grid gap-3">
			{#each publications as publication (publication.slug)}
				{@render row(
					publication.name,
					nodes[publication.slug].href,
					publication.venue,
					publication.year
				)}
			{/each}
		</ul>
	</section>

	<Skills skills={about.skills} />
</article>
