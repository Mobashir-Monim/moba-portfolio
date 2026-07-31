<script lang="ts">
	import Icon from './Icon.svelte';
</script>

<!--
	The scene behind the desktop.

	Geometry lives in three SVG files used as `mask-image`; colour lives in CSS tokens underneath.
	That split is the whole reason this is five divs and not an image: baking the art would mean
	one render per skin per theme per polarity, which is 24 files for one wallpaper. A mask is
	painted by whatever token sits behind it, so one set of files dresses all 24.

	Three planes, because two have no middle. Distance is read from how many planes stand between
	the eye and the horizon, and a foreground against a backdrop gives the eye nothing to measure
	the gap with. The bands inside each file are alpha rather than colour, so a file can carry its
	own relief in one paint of one token, but alpha cannot stand in for the third plane: the bands
	share a token by definition, and it is the token that changes with distance.

	The masks come out of `bun scripts/gen-wallpaper.ts`, which is where the summits, the treeline,
	and the lookout are actually authored. Nothing here knows what shape they are.

	The mark sits between the sky and the ranges, so the ridges cut its base. That is the whole
	composition, and it is why the masthead's own mark hides when a wallpaper is on: two of them
	on one screen is one too many.

	Everything here is decoration and says so: `aria-hidden`, no text, no focusable child. With
	JavaScript off it renders exactly the same, because nothing about it is script.
-->
<div class="wallpaper" aria-hidden="true">
	<div class="sky"></div>
	<div class="mark"><Icon name="logo" size="var(--wall-mark-size)" /></div>
	<div class="far"></div>
	<div class="mid"></div>
	<div class="near"></div>

	<!--
		Retro's pixelation. A mask is vector, so there is nothing to snap to a grid; this quantises
		the composited result instead. feFlood paints one unit, feComposite crops it to the block
		size, feTile repeats that across the plane, the second feComposite samples the source
		through it, and feMorphology grows each sample back to a full block.

		ponytail: one filter pass over a viewport-sized layer, rasterised once because nothing here
		animates. If a large display ever measures slow, bake a pre-pixelated mask per wallpaper
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

	/* The opt-out. `none` is the one wallpaper that names no masks, so this is the rule that
	   makes it mean plain ground rather than three empty layers over it. */
	:global(html[data-wallpaper='none']) .wallpaper {
		display: none;
	}

	/*
	   Every layer is one div painting one token through one mask, and that is the ceiling as much
	   as it is the technique: each one is a viewport-sized composited surface, rasterised once
	   because nothing here moves or scrolls.

	   ponytail: three is comfortable and five would not be. If the scene ever wants more planes
	   than this, the next move is to merge the layers that share a colour token back into one file
	   as alpha bands, not to add divs, and the one after that is to bake the whole composite per
	   skin rather than to reach for a canvas.
	*/
	.wallpaper > div {
		position: absolute;
		inset: 0;
	}

	/* An overlay, not a ground: `--desktop-bg` is still underneath, so modern keeps its graph
	   paper and retro keeps its dither and the sky tints them rather than replacing them. */
	.sky {
		background: var(--wall-sky);
	}

	/*
	   All three layers overshoot the viewport width, for two reasons. A bare `100%` puts the whole
	   scene inside the frame, which sounds right and is not: the ranges then sit as a shallow band
	   along the bottom edge with two thirds of the screen empty above them. And on a phone that
	   band collapses to a 70px sliver. Scaling past the frame raises the crest line to where the
	   composition wants it and crops the sides instead, which is what a wallpaper does.

	   Each layer overshoots harder than the one in front of it, so the three crests fan apart up
	   the screen rather than tracking each other. Those percentages and the viewBox heights in
	   gen-wallpaper.ts are one decision solved together: bottom-anchored, a crest lands at
	   `mask width * (viewBox height - crest y) / 1600` above the bottom edge, so changing either
	   half alone slides a range into the one behind it.

	   The `rem` floors are what hold the composition together on a phone, where a percentage of
	   375px is smaller than the scene needs to be.
	*/
	.far,
	.mid,
	.near {
		mask-repeat: no-repeat;
		mask-position: 50% 100%;
	}

	/* Aerial perspective, spent by the one skin whose whole idea is softness, and graded rather
	   than switched: the far range takes more of it than the middle one, which is what a real
	   focus falloff does and what one blurred layer behind one sharp one cannot say. */
	.far {
		background: var(--wall-far);
		mask-image: var(--wall-mask-far);
		mask-size: max(132%, 74rem) auto;
		filter: var(--wall-haze-far);
	}

	.mid {
		background: var(--wall-mid);
		mask-image: var(--wall-mask-mid);
		mask-size: max(122%, 68rem) auto;
		filter: var(--wall-haze-mid);
	}

	.near {
		background: var(--wall-near);
		mask-image: var(--wall-mask-near);
		mask-size: max(112%, 64rem) auto;
	}

	/*
	   Sunk into the scene rather than floating over it: the mark's base sits below the far crest,
	   so the ranges cut it the way the reference cuts its own. `align-content` centres it and the
	   padding pushes it down from there, which is the whole of the placement.
	*/
	.mark {
		display: grid;
		place-items: center;
		align-content: center;
		padding-block-start: 9%;
		color: var(--wall-mark);
	}

	.defs {
		position: absolute;
		inset: 0 auto auto 0;
	}
</style>
