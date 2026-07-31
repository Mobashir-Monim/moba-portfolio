<script lang="ts">
	import Icon from './Icon.svelte';
</script>

<!--
	The scene behind the desktop.

	Geometry lives in two SVG files used as `mask-image`; colour lives in CSS tokens underneath.
	That split is the whole reason this is four divs and not an image: baking the art would mean
	one render per skin per theme per polarity, which is 24 files for one wallpaper. A mask is
	painted by whatever token sits behind it, so one file dresses all 24.

	Depth inside the far mask is alpha, not colour: three ranges at .2 / .36 / .6, so the ramp
	from haze to foreground is one paint of one token. The near mask is solid, and its slope, its
	treeline, and the lookout are one silhouette for the same reason.

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
	   makes it mean plain ground rather than two empty layers over it. */
	:global(html[data-wallpaper='none']) .wallpaper {
		display: none;
	}

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
	   Both layers overshoot the viewport width, for two reasons. A bare `100%` puts the whole
	   scene inside the frame, which sounds right and is not: the ranges then sit as a shallow band
	   along the bottom edge with two thirds of the screen empty above them. And on a phone that
	   band collapses to a 70px sliver. Scaling past the frame raises the crest line to where the
	   composition wants it and crops the sides instead, which is what a wallpaper does.

	   The far range overshoots harder than the near one, so the two crests separate rather than
	   tracking each other up the screen.
	*/
	.far,
	.near {
		mask-repeat: no-repeat;
		mask-position: 50% 100%;
	}

	.far {
		background: var(--wall-far);
		mask-image: var(--wall-mask-far);
		mask-size: max(132%, 74rem) auto;
		/* Aerial perspective, spent by the one skin whose whole idea is softness. */
		filter: var(--wall-haze);
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
