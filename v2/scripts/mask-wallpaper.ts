/**
 * Turns the drawn wallpaper art into fetched masks, and writes the manifest that points at them.
 *
 *     bun scripts/mask-wallpaper.ts
 *
 * Run it after `trace-wallpaper.ts` or `paint-wallpaper.ts` writes new art. `tokens.test.ts` fails
 * if you forget: it re-derives every mask from its source and compares the hash in the filename,
 * so stale output is a failing test rather than a wallpaper nobody notices is a version behind.
 *
 * ## Why this exists
 *
 * The bands used to be inlined into the page with `{@html}`, because they paint with
 * `var(--wall-band-crest)` and `var(--wall-band-base)` and a custom property does not resolve in a
 * document fetched through `url()`. That was correct and it did not scale: seven scenes reached
 * 768KB brotli of HTML and another 773KB of hydration payload on `/` alone, for art of which a
 * visitor sees exactly one seventh. Mobile Lighthouse was 56 against 99 on every other route.
 *
 * The way out is that a mask needs no colour. Every band in this repo is geometry filled by one
 * two-stop vertical gradient spanning its whole viewBox, crest at the top and base at the bottom,
 * which splits exactly:
 *
 *   - geometry  -> a flat `#fff` SVG here in `static/`, fetched, cached, and shared
 *   - colour    -> `linear-gradient(to bottom, var(--wall-band-crest), var(--wall-band-base))` in
 *                  `Wallpaper.svelte`, still live tokens, still re-dressed by the skin switcher
 *
 * Both invariants survive: no JavaScript is involved, so switching a wallpaper still cannot flash
 * and the scene still renders with scripting off. What changes is that a hidden band costs nothing,
 * because a `display: none` element never fetches its mask.
 *
 * ## Layers
 *
 * A band is usually one paint, so it is usually one mask. `hive` is the exception and the reason
 * this file has a layer concept at all: its cells carry a lit rim in the crest and a shadowed rim
 * in the base, flat, over a gradient face. Three paints cannot come out of one alpha channel, so
 * that band emits three masks that stack. Everything else emits one and the loop collapses.
 *
 * The three paint values are matched literally. Every `white` and `#fff` in the sources is inside a
 * `<mask>` or a `<clipPath>`, which are referenced rather than painted, so matching by value alone
 * cannot catch one by accident. A source that breaks either assumption throws rather than writing a
 * mask that looks nearly right.
 */

import { createHash } from 'node:crypto';
import { readdirSync, rmSync } from 'node:fs';

const SRC = new URL('../src/lib/wallpapers/', import.meta.url);
const OUT = new URL('../static/wallpapers/', import.meta.url);
const MANIFEST = new URL('../src/lib/wallpapers/art.ts', import.meta.url);

/**
 * What a layer is painted with, and the class `Wallpaper.svelte` hands it.
 *
 * `ramp` and not `band`, which is what it is: the crest-to-base run the band was drawn with. The
 * obvious name collides with the `.band` the layer sits inside, and `.wallpaper .band` outranks
 * `.paint` on specificity, so the layer took the band's own `inset` and collapsed to no height.
 */
const PAINTS = ['ramp', 'crest', 'base'] as const;
type Paint = (typeof PAINTS)[number];

/** The fill each paint appears as in the source, given the band it belongs to. */
const fillOf = (paint: Paint, scene: string, slot: string) =>
	paint === 'ramp' ? `url(#${scene}-${slot})` : `var(--wall-band-${paint})`;

/**
 * One pass over both things this script cares about, in one regex, because they interleave.
 *
 * The first branch is a region whose shapes are referenced rather than painted: a `<mask>`, a
 * `<clipPath>`, or a `<defs>` holding either. Their fills are `white` and `#fff` and mean opacity
 * inside a mask or nothing at all inside a clip path, so rewriting one punches the geometry out of
 * the band instead of colouring it. The second branch is a painted shape, always self-closing and
 * always carrying its fill inline.
 *
 * Alternation rather than blanking the regions out and putting them back: a placeholder has to be
 * a string that cannot occur in the document, and path data is a haystack of every printable
 * character there is. Matching both and passing the first branch through untouched needs no such
 * string to exist.
 */
const SCAN =
	/<(defs|mask|clipPath)\b[\s\S]*?<\/\1>|<(?:path|rect|circle|ellipse|polygon|polyline|line)\b[^>]*\/>/g;

const isReferenced = (match: string) => /^<(?:defs|mask|clipPath)\b/.test(match);

const fillIn = (tag: string) => tag.match(/\bfill="([^"]*)"/)?.[1];

/**
 * The fills a band actually paints with, referenced geometry passed over, in the order the
 * document first uses them. Order is the answer: layers stack, and `hive` draws its face, then its
 * shadowed rim, then its lit one. A set sorted by anything else is a bevel lit from the wrong side.
 */
function paintedFills(svg: string): string[] {
	const fills = new Set<string>();
	for (const [match] of svg.matchAll(SCAN)) {
		if (isReferenced(match)) continue;
		const fill = fillIn(match);
		if (fill !== undefined) fills.add(fill);
	}
	return [...fills];
}

type Layer = { paint: Paint; href: string };
type Art = { w: number; h: number; layers: Layer[] };

/**
 * One layer's mask: the source with every other paint's shapes dropped and this one's turned
 * opaque. The gradient goes with them, since nothing references it any more and a `var()` in a
 * document fetched through `url()` resolves to nothing anyway.
 */
function layerSvg(svg: string, keep: string, drop: string[]): string {
	return svg
		.replace(/<linearGradient\b[\s\S]*?<\/linearGradient>\s*/g, '')
		.replace(SCAN, (match) => {
			if (isReferenced(match)) return match;
			const fill = fillIn(match);
			if (fill === keep) return match.replace(/\bfill="[^"]*"/, 'fill="#fff"');
			return fill !== undefined && drop.includes(fill) ? '' : match;
		});
}

/**
 * One source band's masks, derived and nothing written. Exported because `tokens.test.ts` re-runs
 * it over the same sources and compares the content hashes to the ones in `art.ts`: a mask that is
 * a version behind its art is otherwise invisible, since the site still builds and still renders,
 * just a wallpaper nobody remembers changing.
 */
export function masksFor(
	scene: string,
	slot: string,
	svg: string
): { w: number; h: number; layers: { paint: Paint; name: string; body: string }[] } {
	const where = `${scene}/${slot}.svg`;

	const box = svg.match(/viewBox="\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*"/);
	if (!box) throw new Error(`${where} has no viewBox, so it has no aspect ratio`);
	const [, , y, w, h] = box.map(Number);

	/*
	 * The gradient has to span the band's own box top to bottom, crest first, or the CSS gradient
	 * that replaces it is not the same gradient. All 24 sources do; a generator that ever emits a
	 * partial span should stop this script rather than quietly shift a scene's wash.
	 */
	const grad = svg.match(/<linearGradient\b[^>]*\by1="([-\d.]+)"[^>]*\by2="([-\d.]+)"/);
	if (!grad) throw new Error(`${where} has no band gradient to convert`);
	if (Math.abs(+grad[1] - y) > 1 || Math.abs(+grad[2] - (y + h)) > 1) {
		throw new Error(`${where} gradient spans ${grad[1]}..${grad[2]}, not ${y}..${y + h}`);
	}
	if (!/<linearGradient[^>]*>\s*<stop[^>]*var\(--wall-band-crest\)/.test(svg)) {
		throw new Error(`${where} does not start its gradient on the crest`);
	}

	const fills = paintedFills(svg);
	const unknown = fills.filter((fill) => !PAINTS.some((p) => fillOf(p, scene, slot) === fill));
	if (unknown.length) {
		throw new Error(`${where} paints with ${unknown.join(', ')}, which is not a band paint`);
	}

	const present = fills.map((fill) => PAINTS.find((p) => fillOf(p, scene, slot) === fill)!);
	if (!present.includes('ramp')) throw new Error(`${where} paints nothing with its gradient`);

	const layers = present.map((paint) => {
		const body = layerSvg(
			svg,
			fillOf(paint, scene, slot),
			present.filter((p) => p !== paint).map((p) => fillOf(p, scene, slot))
		);
		// Content-addressed, so `_headers` can call these immutable honestly and re-running this
		// script is what busts the cache. Nothing points at a mask except the manifest.
		const hash = createHash('sha256').update(body).digest('hex').slice(0, 8);
		return { paint, name: `${slot}.${hash}.svg`, body };
	});

	return { w, h, layers };
}

/** Every scene folder under `lib/wallpapers/`, which is the list of scenes. */
export const drawnScenes = (): string[] =>
	readdirSync(SRC, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();

/** Every slot file in one, by name. */
export const drawnSlots = (scene: string): string[] =>
	readdirSync(new URL(`${scene}/`, SRC))
		.filter((f) => f.endsWith('.svg'))
		.map((f) => f.slice(0, -4))
		.sort();

if (import.meta.main) {
	const art: Record<string, Record<string, Art>> = {};

	// Wiped rather than overwritten, or a re-trace leaves the mask it replaced behind under the old
	// hash, cached for a year by the rule in `_headers` and referenced by nothing.
	rmSync(OUT, { recursive: true, force: true });

	for (const scene of drawnScenes()) {
		for (const slot of drawnSlots(scene)) {
			const svg = await Bun.file(new URL(`${scene}/${slot}.svg`, SRC)).text();
			const { w, h, layers } = masksFor(scene, slot, svg);
			for (const { name, body } of layers) await Bun.write(new URL(`${scene}/${name}`, OUT), body);
			(art[scene] ??= {})[slot] = {
				w,
				h,
				layers: layers.map(({ paint, name }) => ({
					paint,
					href: `/wallpapers/${scene}/${name}`
				}))
			};
		}
	}

	// `JSON.stringify` rather than a hand-built literal: this is data, JSON is a subset of an object
	// literal, and `bun run format` puts it in the house style either way.
	const body = JSON.stringify(art, null, '\t');

	await Bun.write(
		MANIFEST,
		`// Generated by \`bun scripts/mask-wallpaper.ts\`. Do not edit by hand.
//
// Where every band's mask lives, and the box it is drawn in. The href is content-addressed, so a
// re-traced scene lands under a new name and the immutable rule in \`_headers\` stays honest.
//
// \`w\` and \`h\` come from the source viewBox and become the layer's \`aspect-ratio\`. An inline SVG
// carried its own ratio and got its height from \`height: auto\`; a div wearing a mask has neither,
// so the number has to travel with the file.

/** What a layer is painted with. \`ramp\` is the crest-to-base gradient, the other two are flat. */
export type Paint = 'ramp' | 'crest' | 'base';

export type Layer = { paint: Paint; href: string };

/** One band's art: its source box, and the layers that stack inside it, back to front. */
export type Art = { w: number; h: number; layers: Layer[] };

export const ART: Record<string, Record<string, Art>> = ${body};
`
	);

	const scenes = drawnScenes();
	const files = scenes.reduce((n, s) => n + readdirSync(new URL(`${s}/`, OUT)).length, 0);
	console.log(`${files} masks across ${scenes.length} scenes, and src/lib/wallpapers/art.ts`);
}
