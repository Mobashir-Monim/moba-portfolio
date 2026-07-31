<script lang="ts">
	import { bands } from '$lib/wallpapers/bands';

	/**
	 * Inlined rather than pointed at, and that is forced rather than chosen: these files paint with
	 * `var(--wall-band-*)`, and a custom property resolves in the document that declares it. An SVG
	 * behind a `url()` is a document of its own, with none of this site's tokens in it, so a
	 * referenced band would draw with no fill at all. See note 4 in `trace-wallpaper.ts`.
	 *
	 * That is also why the drawn art sits in `src/lib` while the masks stay in `static`: one is
	 * source the bundler reads, the other is an asset the browser fetches, and a glob over the
	 * bundled folder is therefore the list of drawn wallpapers rather than a copy of it. Adding a
	 * scene is dropping a folder there, naming it in `WALLPAPERS`, and giving it a block in
	 * `app.css`. Nothing in this file learns its name.
	 */
	const files = import.meta.glob('../wallpapers/*/*.svg', {
		query: '?raw',
		import: 'default',
		eager: true
	}) as Record<string, string>;

	/** `.../<wallpaper>/<slot>.svg`, which is the whole of the naming convention. */
	const art: Record<string, Record<string, string>> = {};
	for (const [path, svg] of Object.entries(files)) {
		const [, name, slot] = path.match(/([^/]+)\/([^/]+)\.svg$/)!;
		(art[name] ??= {})[slot] = svg;
	}

	const scenes = Object.entries(art).map(([name, slots]) => ({
		name,
		bands: bands(Object.keys(slots)).map((band) => ({ ...band, svg: slots[band.slot] }))
	}));
</script>

<!--
	The scene behind the desktop.

	Geometry lives in SVG files, colour lives in CSS tokens. That split is the whole reason this is
	divs and not an image: baking the art would mean one render per skin per theme per polarity,
	which is 24 files for one wallpaper. Tokens dress all 24 from one set of files.

	Every band is a shape with its own two-stop gradient in it, because the illustrations they come
	from lighten every band toward its crest, and that haze is most of what makes their depth read.
	An alpha channel could only say that by thinning, which is not a second shade, it is the band's
	own shade letting whatever is behind it through. So the bands are drawn rather than masked, and
	they are inlined, since a `var()` does not cross into a document fetched through `url()`.

	Three planes, because two have no middle. Distance is read from how many planes stand between
	the eye and the horizon, and a foreground against a backdrop gives the eye nothing to measure
	the gap with.

	Each plane is a face and up to two reliefs behind it, and every one of those is its own band and
	its own layer. That is the same argument one level down: a layer is one colour, so a band drawn
	at reduced alpha is not a second shade, it is the plane's own shade letting whatever is behind
	it through.

	The files come out of `bun scripts/trace-wallpaper.ts` for `grove` and `paint-wallpaper.ts` for
	`night-scene`, which is where the ranges, the forest and the tree are actually authored. Nothing
	here knows what shape they are, or even how many bands a scene has, only that the three planes
	are three different kinds of landscape, which is the other half of the depth.

	No mark set into the scene. There was one, sunk between the middle distance and the foreground,
	and it was a second logo on a screen that already has the masthead's: it earned its place back
	when the scene was three flat planes and the middle of the screen was empty. The bands fill that
	space on their own, and a translucent glyph behind them stopped being a composition and started
	being one more thing to look past. The masthead's tile is the mark now, in one place, at a size
	meant for reading rather than for hiding.

	Everything here is decoration and says so: `aria-hidden`, no text, no focusable child. With
	JavaScript off it renders exactly the same, because nothing about it is script.
-->
<div class="wallpaper" aria-hidden="true">
	<div class="sky"></div>

	<!--
		Every scene is in the DOM at once and CSS picks between them, which is the whole reason
		switching a wallpaper cannot flash: the pre-paint script sets `data-wallpaper` before the
		first byte of CSS is applied, and with JavaScript off the default still draws. Rendering only
		the chosen one would mean rendering the prerendered default and swapping at hydration, which
		is defect #33 with a new name.

		ponytail: that costs every scene's SVG in every page, and three scenes is 902KB of markup and
		250KB over the wire for a page whose own content is a few kilobytes. Simplifying further will
		not buy it back: `night-scene`'s tree is already as coarse as the crown survives, and
		`circuit-bottom` is mask geometry rather than path detail, so a fourfold looser tolerance moves
		it five percent. This is the ceiling, and it is reached. The next scene, or any real complaint
		about first paint, is the point where each one gets baked into one file per skin and fetched,
		which trades this weight for a request. Do that rather than folding the choice into JavaScript,
		which takes the flash back.

		`{@html}` is the payload half of the inlining above, and it is safe here for the one reason
		that makes it ever safe: there is no input. These are `?raw` imports of files this repo
		generates, resolved by the bundler at build time, so the string is fixed before the site
		exists and nothing at runtime can reach it. That is the opposite of the old site's `{@html}`,
		which injected a third-party analytics tag.

		A scene shows itself by name, through a property whose name carries the name, because that is
		the one comparison CSS cannot make: a selector can match a literal but it cannot ask whether
		a band's scene is the document's scene. So the band offers `--wall-show-<scene>` and the
		scene's own block in `app.css` answers it, which puts the switch in the block that already
		declares everything else about that wallpaper and keeps this file free of every scene's name.
	-->
	<!-- eslint-disable svelte/no-at-html-tags -->
	{#each scenes as scene (scene.name)}
		{#each scene.bands as band (band.slot)}
			<div
				class="band p-{band.plane}"
				style="display: var(--wall-show-{scene.name}, none); --wall-band-crest: var(--wall-ink-{band.crest}); --wall-band-base: var(--wall-ink-{band.base})"
			>
				{@html band.svg}
			</div>
		{/each}
	{/each}
	<!-- eslint-enable svelte/no-at-html-tags -->

	<!--
		Retro's pixelation. A band is vector, so there is nothing to snap to a grid; this quantises
		the composited result instead. feFlood paints one unit, feComposite crops it to the block
		size, feTile repeats that across the plane, the second feComposite samples the source
		through it, and feMorphology grows each sample back to a full block.

		ponytail: one filter pass over a viewport-sized layer, rasterised once because nothing here
		animates. If a large display ever measures slow, bake a pre-pixelated scene per wallpaper
		rather than reaching for a canvas.
	-->
	<svg class="defs" width="0" height="0" focusable="false">
		<filter
			id="mnemos-pixel"
			x="0"
			y="0"
			width="100%"
			height="100%"
			color-interpolation-filters="sRGB"
		>
			<feFlood x="3" y="3" width="1" height="1" />
			<feComposite width="6" height="6" />
			<feTile result="tiles" />
			<feComposite in="SourceGraphic" in2="tiles" operator="in" />
			<feMorphology operator="dilate" radius="3" />
		</filter>
	</svg>
</div>

<style>
	.wallpaper {
		position: absolute;
		inset: 0;
		overflow: hidden;
		/* The skin's treatment of the whole scene: retro quantises it, the other two pass it
		   through. Declared once, here, so no layer knows which skin it is in. */
		filter: var(--wall-fx);
		pointer-events: none;
	}

	/* The opt-out. `none` is the wallpaper that names no bands, so this is the rule that makes it
	   mean plain ground rather than an empty layer over it. */
	:global(html[data-wallpaper='none']) .wallpaper {
		display: none;
	}

	.wallpaper > div {
		position: absolute;
		inset: 0;
	}

	/* An overlay, not a ground: `--desktop-bg` is still underneath, so modern keeps its graph
	   paper and retro keeps its dither and the sky tints them rather than replacing them.

	   A quarter of it by default, which is the strength a tint wants. The knob is for the one scene
	   whose sky is not a tint: a sun is a light source, and a light source at a quarter is a smudge,
	   so `night-scene` turns it up and paints over the ground instead. */
	.sky {
		background: var(--wall-sky);
		opacity: var(--wall-sky-opacity, 0.25);
	}

	.defs {
		position: absolute;
		inset: 0 auto auto 0;
	}

	/*
	   The bands. Back to front, as many as the scene's folder holds.

	   Three rules rather than one per band, because a band's slot only ever decided which plane it
	   belongs to: the haze and the overshoot are the plane's, and the ink stops are its place in the
	   chain, which is an inline style because it is an index rather than a name.

	   Every band overshoots the viewport width. A bare `100%` puts the whole scene inside the frame,
	   which sounds right and is not: the ranges then sit as a shallow band along the bottom edge with
	   two thirds of the screen empty above them, and on a phone that band collapses to a sliver.
	   Scaling past the frame raises the crest line to where the composition wants it and crops the
	   sides instead, which is what a wallpaper does. Each plane overshoots harder than the one in
	   front of it, so the three crests fan apart up the screen rather than tracking each other.

	   What holds a scene together across that is not a shared frame width, and it cannot be: a
	   generator emits whatever units its source was drawn in, `1600` for grove and `4200` for
	   night-scene. It is that every band is bottom-anchored to the same edge of its own scene's frame
	   and scaled by width alone, so a plane's bands share a scale and land back in register with no
	   offset to carry, whatever the numbers in the `viewBox` say. A plane's reliefs take its
	   overshoot exactly, which is what keeps them the same distance rather than becoming planes of
	   their own.

	   The `rem` floors hold the composition together on a phone, where a percentage of 375px is
	   smaller than the scene needs to be. The `vh` term takes over once the viewport is tall relative
	   to its width, which is the case a `rem` floor cannot see: a band is several times wider than it
	   is tall, so a width-only scale on a portrait screen leaves an illustration sitting in the bottom
	   third of the screen, which reads as a picture someone left there. It puts the far crest back up
	   where the mark's base is so the ranges cut the mark the way they do on a desktop. The three are
	   in the same ratio as the other two terms, because that ratio is the fan and losing it collapses
	   the three distances into one.

	   The fan is the default and not the law, which is what the three tokens are for. It works when a
	   plane is its own subject, a range behind a range, where a scale difference reads as distance and
	   nothing has to line up across it. It fails outright when the planes are one drawing cut into
	   depth layers: `circuit-bottom` is a board whose traces run from the far layer into the mid one,
	   and three scales leave every one of those joins ending in mid air. Such a scene sets all three
	   tokens to the same value and buys its depth from the ink ramp and the skin's haze instead, which
	   are the two the fan was only ever a third of.

	   The bands overflow their box on the sides by design, which is what the overshoot is; the
	   clipping is `.wallpaper`'s, once, for all of them.
	*/
	/* `.wallpaper .band` rather than `.band`, because `.wallpaper > div` above is a class and a type
	   and would otherwise win the `inset` outright and stand every band up to full height. */
	.wallpaper .band {
		inset: auto 0 0;
		justify-content: center;
		/* The band is the only child and is the box, so stretching it is the one thing this must not
		   do: a stretched band is the viewport's aspect ratio rather than its own, which reads as a
		   forest pulled to the height of the screen. */
		align-items: flex-end;
	}

	.band :global(svg) {
		flex: none;
		height: auto;
	}

	.p-far {
		filter: var(--wall-haze-far);
	}

	.p-far :global(svg) {
		width: var(--wall-w-far, max(132%, 74rem, 175vh));
	}

	.p-mid {
		filter: var(--wall-haze-mid);
	}

	.p-mid :global(svg) {
		width: var(--wall-w-mid, max(122%, 68rem, 162vh));
	}

	.p-near :global(svg) {
		width: var(--wall-w-near, max(112%, 64rem, 149vh));
	}
</style>
