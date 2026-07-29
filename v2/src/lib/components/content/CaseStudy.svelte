<script lang="ts">
	import { neighbours } from '$lib/content/case-studies';
	import { nodes } from '$lib/tree';
	import type { CaseStudy } from '$lib/types/case-study';
	import Prose from './Prose.svelte';

	let { data }: { data: CaseStudy } = $props();

	const project = $derived(nodes[data.project.slug]);
	const { previous, next } = $derived(neighbours(data.slug));

	/**
	 * Anchors are prefixed with the study's own slug because two studies can be open at once in
	 * two windows, and a bare `#problem` would then exist twice in one document.
	 */
	function anchor(id: string): string {
		return `${data.slug}-${id}`;
	}
</script>

<!-- `href` arrives already built, off the node in `$lib/tree`, which is the route table. The
     site deploys at the root and has no `base` for `resolve()` to prepend, and a fragment has
     nothing to resolve against at all. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="reader">
	<div class="layout">
		<header class="head">
			<p class="eyebrow">Case study</p>
			<h1>{data.project.name}</h1>
			<a class="up" href={project.href}>{data.project.name} in the catalogue</a>
		</header>

		<!--
			The contents list, which is the second thing a reader wants after the lead and the first
			thing they want on the way back. Fragment links and nothing else: the browser scrolls
			whichever container the reader is inside, so this works in a window, on the route, and
			with no script at all.

			Scroll progress rides on top of it rather than pinned across the page, because a bar
			pinned over the prose has the prose scrolling under it, and a rule crossing a line of
			text reads as a strikethrough. This box is opaque and already sticks, so progress sits
			beside the section it is progress through.
		-->
		<nav class="toc" aria-label="Contents">
			<div class="progress" aria-hidden="true"></div>
			<p class="toc-title">Contents</p>
			<ol>
				{#each data.sections as section (section.id)}
					<li><a href="#{anchor(section.id)}">{section.title}</a></li>
				{/each}
			</ol>
		</nav>

		<article class="body">
			<Prose paragraphs={data.description} />

			{#each data.sections as section (section.id)}
				<section>
					<h2 id={anchor(section.id)}>{section.title}</h2>
					<Prose paragraphs={section.paragraphs} />
				</section>
			{/each}
		</article>

		{#if previous || next}
			<nav class="pager" aria-label="Case studies">
				{#if previous}
					<a class="prev" href={nodes[previous.slug].href}>
						<span class="dir">Previous</span>
						<span class="what">{previous.project.name}</span>
					</a>
				{/if}
				{#if next}
					<a class="next" href={nodes[next.slug].href}>
						<span class="dir">Next</span>
						<span class="what">{next.project.name}</span>
					</a>
				{/if}
			</nav>
		{/if}
	</div>
</div>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	/* Its own container, so the two-column layout answers to the width of the reader rather than
	   to the viewport. That is what makes one markup tree fit a narrow window on a wide screen,
	   a full-width route, and the gallery view's preview pane. */
	.reader {
		container-type: inline-size;
	}

	.layout {
		display: grid;
		gap: 1.5rem;
	}

	/* --- Progress ---------------------------------------------------------------------------
	   Scroll-driven, so there is no listener, no `$effect`, and no script: the timeline is
	   whichever scroller the reader is inside, which is the window body in the shell, the
	   gallery view's preview pane, and the document on the plain route. Hidden where the
	   timeline is unsupported, because a bar that never fills is worse than no bar. */
	.progress {
		display: none;
	}

	@supports (animation-timeline: scroll()) {
		/* Inside the contents box's padding rather than bled to its edges, which would want the
		   box to clip and the box must not (see `.toc`). */
		.progress {
			display: block;
			height: 3px;
			margin-block-end: 0.625rem;
			background: var(--c-line);
		}

		.progress::after {
			content: '';
			display: block;
			height: 100%;
			/* `--c-select`, not `--c-accent`, for the reason the boot thermometer gives: the
			   selection highlight is inside every skin's accent budget, retro's included, and this
			   is the same widget filling the same way. */
			background: var(--c-select);
			transform: scaleX(0);
			transform-origin: 0 50%;
			/* Longhands, not the shorthand: `animation` resets `animation-timeline` to `auto`, and
			   omitting a duration from it is the difference between a bar tied to the scroll and a
			   bar that finishes instantly. */
			animation-name: read;
			animation-timing-function: linear;
			animation-fill-mode: both;
			animation-timeline: scroll();
		}

		@keyframes read {
			to {
				transform: scaleX(1);
			}
		}

		/* A bar that moves only as far as the reader has already scrolled is not motion, so it
		   stays. The global rule in `app.css` caps every animation at 1ms, which on a progress
		   timeline means permanently full rather than instant. */
		@media (prefers-reduced-motion: reduce) {
			.progress::after {
				animation-duration: auto !important;
			}
		}
	}

	/* --- Head ------------------------------------------------------------------------------ */

	.head {
		display: grid;
		gap: 0.25rem;
	}

	.eyebrow {
		color: var(--c-fg-3);
		font-family: var(--ff-ui);
		font-size: var(--fs-xs);
		letter-spacing: var(--tracking-ui);
		text-transform: uppercase;
	}

	h1 {
		font-size: var(--fs-xl);
		font-weight: 600;
	}

	.up {
		justify-self: start;
		color: var(--c-accent);
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* --- Contents -------------------------------------------------------------------------- */

	/* Never give this `overflow: hidden`. That makes it a scroll container, and the progress bar
	   inside it resolves `scroll()` to the nearest one: a box that never scrolls, so the bar
	   would sit at zero forever while still looking correct in a static screenshot. */
	.toc {
		padding: 0.75rem;
		background: var(--c-surface-2);
		border: var(--bw) solid var(--c-line);
		border-radius: var(--r-sm);
	}

	.toc-title {
		margin-block-end: 0.375rem;
		color: var(--c-fg-3);
		font-family: var(--ff-ui);
		font-size: var(--fs-xs);
		letter-spacing: var(--tracking-ui);
		text-transform: uppercase;
	}

	.toc ol {
		display: grid;
		gap: 0.25rem;
		list-style: decimal;
		padding-inline-start: 1.25rem;
	}

	.toc a {
		color: var(--c-fg-1);
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		text-decoration: none;
	}

	.toc a:hover {
		color: var(--c-accent);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* --- Body ------------------------------------------------------------------------------ */

	.body {
		display: grid;
		gap: 1.5rem;
	}

	.body section {
		display: grid;
		gap: 0.5rem;
	}

	h2 {
		font-family: var(--ff-ui);
		font-size: var(--fs-lg);
		font-weight: 600;
		letter-spacing: var(--tracking-ui);
		/* The fragment lands the heading under a sticky progress bar without this. */
		scroll-margin-block-start: 1rem;
	}

	/* --- Pager ----------------------------------------------------------------------------- */

	.pager {
		display: flex;
		gap: 0.75rem;
		justify-content: space-between;
		padding-block-start: 1rem;
		border-top: var(--bw) solid var(--c-line);
	}

	.pager a {
		display: grid;
		gap: 0.125rem;
		max-width: 48%;
		color: var(--c-fg-1);
		text-decoration: none;
	}

	/* One child in a flex row would sit at the start whichever it is, so the next link says which
	   end it belongs at rather than relying on there being a previous one. */
	.pager .next {
		margin-inline-start: auto;
		text-align: end;
	}

	.dir {
		color: var(--c-fg-3);
		font-family: var(--ff-ui);
		font-size: var(--fs-xs);
		letter-spacing: var(--tracking-ui);
		text-transform: uppercase;
	}

	.what {
		font-family: var(--ff-ui);
		font-size: var(--fs-sm);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.pager a:hover .what {
		color: var(--c-accent);
	}

	/* --- Wide ------------------------------------------------------------------------------
	   The contents list moves beside the prose and sticks. Below this it stays where it is in
	   the DOM, above the body, which is where a contents box has always gone on a narrow page. */
	@container (min-width: 40rem) {
		.layout {
			grid-template-columns: minmax(0, 1fr) 11rem;
			column-gap: 2rem;
		}

		.head {
			grid-column: 1 / -1;
			grid-row: 1;
		}

		.body {
			grid-column: 1;
			grid-row: 2;
		}

		.toc {
			grid-column: 2;
			grid-row: 2;
			/* Stretched, it fills the row and has nothing left to stick within. */
			align-self: start;
			position: sticky;
			inset-block-start: 1rem;
		}

		.pager {
			grid-column: 1 / -1;
			grid-row: 3;
		}
	}
</style>
