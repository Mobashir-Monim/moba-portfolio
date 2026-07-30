<script lang="ts">
	import { BRAND, CHROME, isChrome, type IconName } from '$lib/icons';

	let {
		name,
		size = 20,
		label,
		class: klass = ''
	}: {
		name: IconName;
		/** Rendered size. A number is CSS px; a string is any CSS length, including a `var()`, which
		 *  is how the desktop and the dock scale their glyphs from a token instead of from script.
		 *  Chrome glyphs are drawn on a 24-unit grid, so the stroke scales with this: a skin tunes
		 *  weight through `--icon-stroke`, not through size. */
		size?: number | string;
		/** Accessible name. Omit when the icon sits beside text that already says it, which
		 *  hides it from assistive tech instead of announcing the label twice. */
		label?: string;
		class?: string;
	} = $props();

	const chrome = $derived(isChrome(name) ? CHROME[name] : null);
	const brand = $derived(isChrome(name) ? null : BRAND[name]);

	/**
	 * Applied as style rather than as the `width`/`height` attributes, because an attribute cannot
	 * hold a `var()` and a presentation attribute is the weakest thing in the cascade anyway.
	 */
	const dim = $derived(typeof size === 'number' ? `${size}px` : size);

	// `role="img"` with no name is worse than no role at all, so the two move together.
	const a11y = $derived(
		label ? ({ role: 'img', 'aria-label': label } as const) : ({ 'aria-hidden': 'true' } as const)
	);
</script>

{#if chrome}
	<svg
		class="chrome {klass}"
		viewBox="0 0 24 24"
		style:width={dim}
		style:height={dim}
		fill="none"
		stroke="currentColor"
		{...a11y}
	>
		<!-- All three variants ship; CSS picks. See the note in <style> below. Adding a skin
		     means adding a line here, and src/lib/icons.test.ts fails until it is added. -->
		<path class="modern" d={chrome.modern} />
		<path class="retro" d={chrome.retro} />
		<path class="glass" d={chrome.glass} />
	</svg>
{:else if brand}
	<svg
		class={klass}
		viewBox={brand.box}
		style:width={dim}
		style:height={dim}
		fill="currentColor"
		{...a11y}
	>
		<path d={brand.d} />
	</svg>
{/if}

<style>
	svg {
		display: inline-block;
		vertical-align: middle;
		flex: none;
	}

	.chrome {
		stroke-width: var(--icon-stroke);
		stroke-linecap: var(--icon-cap);
		stroke-linejoin: var(--icon-join);
	}

	/* The skin is chosen in CSS rather than in script, so the server renders all three variants
	   and the `data-skin` already on <html> decides which one paints. That is one attribute
	   selector instead of a hydration swap: no flash, and still the right glyph with JavaScript
	   off. The cost is two unused paths per icon, which compress to nothing.

	   ponytail: if an icon-heavy view ever measures slow, the fix is to render one path from
	   `settings.skin` and accept the JS-off default, not to split the markup tree. */
	.chrome path {
		display: none;
	}

	:global(html[data-skin='modern']) .chrome path.modern,
	:global(html[data-skin='retro']) .chrome path.retro,
	:global(html[data-skin='glass']) .chrome path.glass {
		display: inline;
	}
</style>
