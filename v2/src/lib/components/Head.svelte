<script lang="ts">
	import { about } from '$lib/content/about';
	import { OS_NAME } from '$lib/os';
	import { canonical, ldJson, PERSON } from '$lib/seo';

	/**
	 * The whole `<head>` for a page: title, description, canonical, Open Graph, Twitter card, and
	 * structured data. One component, so a route cannot ship half of it (ledger #13, #16).
	 *
	 * One card for the whole site, drawn as the boot screen in the default dress. 2.7 shipped no
	 * `og:image` on the grounds that a card pointing at a placeholder is worse than none, which
	 * held right up until there was art; the boot screen is the first thing a visitor sees, so it
	 * is the right thing for a preview to promise. Per-page cards would want a renderer, and one
	 * honest image beats thirty generated ones.
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

	/** Absolute, always. A relative `og:image` is fetched by nothing. */
	const image = canonical('/og.png');
	const imageAlt = `The ${OS_NAME} boot screen, reading ${PERSON}, ${about.title}`;
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
	<meta property="og:image" content={image} />
	<!-- Declared, so a crawler can lay out the card before it has fetched the file. -->
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={imageAlt} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={imageAlt} />

	<!-- Svelte parses a nested `<script>` as an element and will not interpolate into it, so the
	     tag is written out whole. The split closing tag keeps this component's own parse honest. -->
	{#if jsonld}
		<!-- The only interpolation is ldJson, which is JSON with every `<` escaped, so nothing
		     reaching this can open a tag. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html `<script type="application/ld+json">${ldJson(jsonld)}<` + `/script>`}
	{/if}
</svelte:head>
