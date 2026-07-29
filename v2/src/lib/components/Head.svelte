<script lang="ts">
	import { OS_NAME } from '$lib/os';
	import { canonical, ldJson, PERSON } from '$lib/seo';

	/**
	 * The whole `<head>` for a page: title, description, canonical, Open Graph, Twitter card, and
	 * structured data. One component, so a route cannot ship half of it (ledger #13, #16).
	 *
	 * ponytail: no `og:image`. Nothing on this site has art yet, and a card with a title and a
	 * description is a card; a card pointing at a placeholder is worse than one pointing at
	 * nothing. `summary` rather than `summary_large_image` for exactly that reason.
	 */
	let {
		title,
		description,
		path,
		type = 'website',
		jsonld
	}: {
		title: string;
		description: string;
		/** Route path, leading slash. The origin is not the caller's business. */
		path: string;
		type?: 'website' | 'article';
		jsonld?: object;
	} = $props();

	const url = $derived(canonical(path));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />

	<meta property="og:type" content={type} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="{PERSON}, {OS_NAME}" />
	<meta property="og:locale" content="en_US" />

	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />

	<!-- Svelte parses a nested `<script>` as an element and will not interpolate into it, so the
	     tag is written out whole. The split closing tag keeps this component's own parse honest. -->
	{#if jsonld}
		<!-- The only interpolation is ldJson, which is JSON with every `<` escaped, so nothing
		     reaching this can open a tag. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html `<script type="application/ld+json">${ldJson(jsonld)}<` + `/script>`}
	{/if}
</svelte:head>
