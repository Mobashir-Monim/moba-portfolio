<script lang="ts">
	import type { Snippet } from 'svelte';
	import Wallpaper from './Wallpaper.svelte';

	let {
		children,
		masthead,
		scene = false,
		class: klass = ''
	}: {
		children: Snippet;
		masthead?: Snippet;
		/** Draw the wallpaper behind the grid. The real desktop wants it; the styleguide's
		 *  thumbnail-sized desktops want the plain ground they are there to show. */
		scene?: boolean;
		class?: string;
	} = $props();
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
<div class="desktop {klass}" class:scene>
	{#if scene}<Wallpaper />{/if}
	<div class="centre">
		{@render masthead?.()}
		{@render children()}
	</div>
</div>

<style>
	.desktop {
		position: relative;
		display: grid;
		place-items: center;
		background: var(--desktop-bg);
	}

	/*
	   Positioned, and deliberately without a `z-index`: the wallpaper is an earlier sibling, so
	   painting order alone puts the grid over it, and that is the whole of the stacking this
	   needs. A `z-index` here would raise the desktop out of document order and over the window
	   layer, which is a later sibling of this component with no z-index of its own, so the icons
	   would draw on top of every open window.
	*/
	.centre {
		position: relative;
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
	   Text on a wallpaper gets its own ground, which is the one thing a scene behind the desktop
	   genuinely costs.

	   The AA contract is not negotiable and neither is the arithmetic: `--c-fg-2` clears 4.5:1 on
	   `--c-surface-0` by about 5.2:1 in the light palettes, so a ridge a few percent darker than
	   the ground already fails, and a ridge dark enough to read as a ridge fails badly. There is
	   no wallpaper worth having on the other side of that. So the label sits on a chip, which is
	   what a desktop icon has done on every OS that ever shipped a photograph, and the pair
	   table's own `fg on surface-1` guarantee carries it in all 24 combinations.

	   The glyph above the label keeps no chip: it is non-text, so 3:1 is its bar, and
	   src/lib/tokens.test.ts holds both ridge colours to it.

	   Scoped to `.scene`, because the same icon renders inside folder windows, where there is no
	   scene and a chip would be noise. `none` is a scene with nothing in it, so it opts out too.
	*/
	.desktop.scene :global(:where(.label, .masthead h1)) {
		padding: 0.125rem 0.4375rem;
		background: var(--c-surface-1);
		border-radius: var(--r-xs);
	}

	/* Selection already is a ground, and a chip inside it would read as a second one. */
	.desktop.scene :global(.tile.selected .label) {
		background: none;
	}

	:global(html[data-wallpaper='none']) .desktop.scene :global(:where(.label, .masthead h1)) {
		padding: 0;
		background: none;
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
