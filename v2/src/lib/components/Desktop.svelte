<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		masthead,
		class: klass = ''
	}: { children: Snippet; masthead?: Snippet; class?: string } = $props();
</script>

<!--
	The ground the whole OS sits on. `--desktop-bg` is where the three skins diverge hardest:
	graph paper in modern, a two-by-two ordered dither in retro, an accent wash in glass. All
	three are one token, so this element never learns which skin it is in.

	The root is a masthead over a centred grid, not a list down one edge. On a wide screen an edge
	is where nothing is looked at: the icons were the entire product and half the visitors never
	saw them. Centring puts the mark and the four places to go where the eye already is.

	No role and no label, decided rather than deferred: the icons inside are plain links, which is
	the pattern the accessibility contract allows alongside `role="listbox"`, and the arrows they
	were missing live on the links themselves. See `$lib/roving` for why a role would be a promise
	the prerendered HTML cannot keep.
-->
<div class="desktop {klass}">
	<div class="centre">
		{@render masthead?.()}
		{@render children()}
	</div>
</div>

<style>
	.desktop {
		display: grid;
		place-items: center;
		background: var(--desktop-bg);
	}

	.centre {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2.5rem;
		width: min(64rem, 100%);
		padding: 2rem 1rem;
	}

	/* The shared grid centres its last row here and packs from the start inside a folder window,
	   which is the one difference between the two places it is used. */
	.centre :global(.grid) {
		width: 100%;
		justify-content: center;
	}

	/*
	   The icons scale with the screen, and only here: a folder window is narrow whatever the
	   display is, so `:root` keeps the base size and the desktop is the one place that overrides
	   it. Both tokens are re-declared together because a custom property computes where it is
	   declared, so a `--icon-glyph` left at `:root` would keep resolving against the base tile.
	*/
	@media (min-width: 48rem) {
		.desktop {
			--icon-tile: calc(var(--icon-base) * 1.4);
			--icon-glyph: calc(var(--icon-base) * 0.78);
		}
	}

	@media (min-width: 90rem) {
		.desktop {
			--icon-tile: calc(var(--icon-base) * 1.75);
			--icon-glyph: calc(var(--icon-base) * 0.98);
		}
	}
</style>
