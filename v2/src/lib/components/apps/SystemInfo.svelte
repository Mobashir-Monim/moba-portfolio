<script lang="ts">
	import { settings } from '$lib/appearance.svelte';
	import { BUILT, STACK } from '$lib/build';
	import { formatSize } from '$lib/fs';
	import { OS_NAME, OS_VERSION } from '$lib/os';

	/**
	 * About This Machine.
	 *
	 * Every number here is measured or injected, never written down, because the whole joke rests
	 * on the readings being real. Three sources, and the split between them is the interesting
	 * part: the software versions come from `package.json` at build time, the weight comes from
	 * the browser's own resource timings, and the dress comes from the settings store.
	 */

	type Row = [label: string, value: string];

	/**
	 * What this visit actually pulled down, from the Performance API rather than from a build-time
	 * measurement of the bundle.
	 *
	 * A bundle size cannot be injected into the bundle whose size it reports, which is a circle,
	 * and the ways out of it are all worse than this: a second build pass, a byte-patched
	 * placeholder, or a number fetched at runtime from a JSON file. The reading below needs none
	 * of them and answers a better question, since it counts the document, the CSS, and the font
	 * alongside the script.
	 *
	 * `encodedBodySize` rather than `transferSize`, which is zero on a cache hit and would report
	 * a returning visitor a site that weighs nothing.
	 */
	function weigh(): Row[] {
		const nav = performance.getEntriesByType('navigation') as PerformanceResourceTiming[];
		const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
		const all = [...nav, ...res];
		if (all.length === 0) return [];

		const bytes = all.reduce((sum, entry) => sum + entry.encodedBodySize, 0);
		return [
			['Transferred', formatSize(bytes)],
			['Requests', `${all.length}`]
		];
	}

	/**
	 * Read after hydration rather than during render, which is why this is `$state` and an
	 * `$effect` and not the `$derived` the linter would prefer. `screen` and `performance` do not
	 * exist while the page prerenders, and a `$derived` guarded on `browser` would render empty on
	 * the server and full on the client, which is a hydration mismatch. `/styleguide` renders this
	 * component at build time, so that is not hypothetical.
	 *
	 * The weight is honestly "this visit so far": SvelteKit code-splits, so navigating pulls more
	 * chunks. Changing the dress re-reads it, which is free and keeps the count current.
	 */
	// eslint-disable-next-line svelte/prefer-writable-derived
	let session = $state<Row[]>([]);
	$effect(() => {
		session = [
			['Display', `${screen.width} x ${screen.height}`],
			['Dress', `${settings.skin}, ${settings.theme}, ${settings.appearance}`],
			...weigh()
		];
	});

	const system: Row[] = [
		['Host', 'Cloudflare Workers'],
		['Delivery', 'Prerendered static, hydrated'],
		['Built', BUILT]
	];
</script>

<div class="info">
	<header>
		<p class="machine">{OS_NAME} {OS_VERSION}</p>
		<p class="hint">
			Everything below is measured or injected at build time. Nothing on this page is typed in by
			hand, which is the only way the numbers stay true.
		</p>
	</header>

	{@render section('System', system)}
	{@render section('Software', STACK)}
	{@render section('This session', session)}

	<!--
		Lighthouse waits for 6.1. A score cannot be pulled at build time without running Lighthouse
		in the build, and a hardcoded 100 is exactly the number this window exists not to print.
	-->
</div>

{#snippet section(heading: string, rows: readonly Row[])}
	{#if rows.length > 0}
		<section>
			<h3>{heading}</h3>
			<!-- A description list, because that is what every row is: a term and its value. -->
			<dl>
				{#each rows as [label, value] (label)}
					<dt>{label}</dt>
					<dd>{value}</dd>
				{/each}
			</dl>
		</section>
	{/if}
{/snippet}

<style>
	.info {
		display: grid;
		gap: 1rem;
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		letter-spacing: var(--tracking-ui);
	}

	.machine {
		font-size: var(--fs-lg);
		font-weight: 600;
	}

	.hint {
		margin-top: 0.25rem;
		color: var(--c-fg-3);
		font-size: var(--fs-xs);
		max-width: 44ch;
	}

	section {
		padding: 0.75rem;
		background: var(--c-surface-2);
		border: var(--bw) solid var(--c-line);
		border-radius: var(--r-md);
	}

	h3 {
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	/* Term and value on one row, and the terms share a column so the values line up. `auto` rather
	   than a fixed width, so the longest label sets it and no skin's type metrics can clip one. */
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.125rem 1rem;
	}

	dt {
		color: var(--c-fg-3);
	}

	dd {
		font-family: var(--ff-mono);
		font-variant-numeric: tabular-nums;
	}
</style>
