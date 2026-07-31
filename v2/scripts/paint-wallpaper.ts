/**
 * The `night-scene` wallpaper, repainted out of a layered export.
 *
 * `trace-wallpaper.ts` pulls a scene out of a single illustration's clip paths. This one has a
 * different job: the source is already separated into one file per depth layer, registered to a
 * common frame, so the geometry needs nothing done to it. What it needs is
 * its colour taken away, because a layered export arrives fully painted, in the illustrator's hues,
 * with faceted shading inside every layer and its own gradients in the defs. None of that survives
 * contact with a wallpaper that has to read in 24 skin, theme and polarity combinations.
 *
 * So five things happen here, and nothing else:
 *
 * 1. **Repaint every drawn shape with the band's two tokens.** One `fill` for the whole layer, the
 *    `url(#<scene>-<slot>)` of a gradient this script writes, which resolves against
 *    `--wall-band-crest` and `--wall-band-base`. That is the grove scheme exactly, and it is what
 *    flattens a faceted peak into a silhouette: overlapping shapes painted the same colour are
 *    their own union. The faceting is real loss and it is the point. A layer is one distance, a
 *    distance is one shade, and shading inside a band would be a second light source arguing with
 *    the aerial perspective the ink ramp already draws.
 *
 * 2. **Leave everything inside `mask`, `clipPath` and `defs` alone.** A `fill="white"` in a
 *    luminance mask is not paint, it is the alpha channel, and repainting it would erase the layer
 *    rather than recolour it. The scanner tracks its own depth for exactly this one distinction.
 *
 * 3. **Drop `opacity` from the drawn shapes.** Same argument the rest of this wallpaper is built
 *    on: a band at reduced alpha is not a second shade, it is the band's own shade letting the sky
 *    through, and it drifts with whatever happens to sit behind it. An export uses opacity freely
 *    for haze; the ink ramp says that in colour instead.
 *
 * 4. **Namespace every id.** These files are inlined, so eleven bands across three scenes land in
 *    one document, and an id is scoped by nothing. Figma's `mask0_1345_374` happens not to collide
 *    today, which is not a property worth depending on.
 *
 * 5. **Crop to the band's own crest, bottom-anchored.** The export is full-frame, mostly empty
 *    above the layer. Moving the `viewBox` top down to the content leaves every coordinate
 *    untouched and the bottom edge fixed, so bands in a plane stay in register with each other
 *    while the element box becomes the band, which is what `Wallpaper.svelte` bottom-anchors and
 *    what the gradient spans.
 *
 * Run with `bun scripts/paint-wallpaper.ts`. Deterministic: same input, same bytes out.
 */

/**
 * Under `svg-refs/`, not `static/`, and that is the same split `grove` is on. A drawn wallpaper's
 * output is source the bundler inlines; its input is reference art the site never serves.
 */
const SOURCE = new URL('../../svg-refs/', import.meta.url);
const OUT = new URL('../src/lib/wallpapers/', import.meta.url);

/**
 * Which exported layer fills which depth slot, back to front.
 *
 * The export is three terrain layers and a sun, so the terrain takes one face per plane and the sun
 * is left behind: it is a light source rather than a distance, it has no crest to anchor and no
 * base to sit on, and a disc bottom-anchored to the desktop's floor is not a sun. It comes back as
 * a radial stop in `--wall-sky`, which is where the sky already is.
 */
type Scene = {
	name: string;
	/** The export frame every layer shares. The crop below only ever moves the top edge. */
	width: number;
	height: number;
	/** Source file to the slot it fills. Order is the file order; the slot decides the depth. */
	layers: Record<string, string>;
	/**
	 * How far a point may sit from the line that would replace it, in frame units.
	 *
	 * These are inlined into every prerendered page, so the weight is paid per page rather than
	 * once, and an export carries far more precision than a wallpaper spends. `0` keeps the curves
	 * as authored, which is right for a layer already measured in kilobytes.
	 */
	tolerance: number;
};

const SCENES: Scene[] = [
	{
		name: 'circuit-bottom',
		width: 3053,
		height: 2079,
		layers: { far: 'far', mid: 'mid', near: 'near' },
		// Traces, not terrain, and the difference matters here: the smallest shapes in this art are
		// vias a dozen units across, and a tolerance that reads as sub-pixel against a ridge turns a
		// via into a triangle. Corners survive Douglas-Peucker for free, so the only thing this can
		// cost is roundness, and roundness is most of what a via is.
		tolerance: 0.5
	},
	{
		name: 'night-scene',
		width: 4200,
		height: 3000,
		layers: { 'near-2': 'far', 'near-1': 'mid', near: 'near' },
		// The tree is five thousand leaf subpaths and a megabyte of cubics, which is four times the
		// rest of the site. At the size it is painted this is under a pixel, and it is the difference
		// between a scene that ships and one that doubles every page. Past this the crown starts
		// rounding into a blob, which is the ceiling rather than a setting to keep turning up.
		tolerance: 3
	}
];

type Pt = { x: number; y: number };

/**
 * Path data to points.
 *
 * Exports use absolute `M`, `L`, `H`, `V`, `C` and `Z`, which is what this handles. Anything else
 * is a source this script has not seen, and drawing it wrong silently is worse than stopping.
 */
function flatten(d: string): Pt[][] {
	const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
	const subpaths: Pt[][] = [];
	let pts: Pt[] = [];
	let cmd = '';
	let cur: Pt = { x: 0, y: 0 };
	let start: Pt = { x: 0, y: 0 };
	let i = 0;

	const num = () => Number(tokens[i++]);
	const push = (p: Pt) => {
		pts.push(p);
		cur = p;
	};

	while (i < tokens.length) {
		const t = tokens[i];
		if (/[A-Za-z]/.test(t)) {
			cmd = t;
			i++;
			if (cmd === 'Z' || cmd === 'z') {
				if (pts.length) subpaths.push(pts);
				pts = [];
				cur = start;
				continue;
			}
			if (cmd === 'M' || cmd === 'm') {
				if (pts.length) subpaths.push(pts);
				pts = [];
			}
		}
		if (cmd === 'M' || cmd === 'L') push({ x: num(), y: num() });
		else if (cmd === 'm' || cmd === 'l') push({ x: cur.x + num(), y: cur.y + num() });
		else if (cmd === 'H') push({ x: num(), y: cur.y });
		else if (cmd === 'h') push({ x: cur.x + num(), y: cur.y });
		else if (cmd === 'V') push({ x: cur.x, y: num() });
		else if (cmd === 'v') push({ x: cur.x, y: cur.y + num() });
		else if (cmd === 'C' || cmd === 'c') {
			const rx = cmd === 'c' ? cur.x : 0;
			const ry = cmd === 'c' ? cur.y : 0;
			const p1 = { x: rx + num(), y: ry + num() };
			const p2 = { x: rx + num(), y: ry + num() };
			const p3 = { x: rx + num(), y: ry + num() };
			// Eight steps. These curves are leaf-sized against a 4200 frame, so the flattening error
			// is well under the tolerance the simplifier is about to apply anyway.
			for (let s = 1; s <= 8; s++) {
				const u = s / 8;
				const v = 1 - u;
				pts.push({
					x: v * v * v * cur.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u * u * u * p3.x,
					y: v * v * v * cur.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u * u * u * p3.y
				});
			}
			cur = p3;
		} else throw new Error(`unhandled path command: ${cmd}`);

		if (cmd === 'M' || cmd === 'm') {
			start = cur;
			// A polyline after a moveto is a lineto run, which is what the spec says and what an
			// export emits.
			cmd = cmd === 'M' ? 'L' : 'l';
		}
	}
	if (pts.length) subpaths.push(pts);
	return subpaths;
}

/** Distance from p to the line through a and b. Degenerate segment falls back to the endpoint. */
function perpendicular(p: Pt, a: Pt, b: Pt): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const len = Math.hypot(dx, dy);
	if (len === 0) return Math.hypot(p.x - a.x, p.y - a.y);
	return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

/** Douglas-Peucker, iterative, because the tree arrives as a million points and blows the stack. */
function simplify(pts: Pt[], tolerance: number): Pt[] {
	if (pts.length < 3 || tolerance <= 0) return pts;
	const keep = new Uint8Array(pts.length);
	keep[0] = 1;
	keep[pts.length - 1] = 1;
	const stack: [number, number][] = [[0, pts.length - 1]];

	while (stack.length) {
		const [from, to] = stack.pop()!;
		let worst = 0;
		let at = -1;
		for (let i = from + 1; i < to; i++) {
			const dist = perpendicular(pts[i], pts[from], pts[to]);
			if (dist > worst) {
				worst = dist;
				at = i;
			}
		}
		if (at !== -1 && worst > tolerance) {
			keep[at] = 1;
			stack.push([from, at], [at, to]);
		}
	}
	return pts.filter((_, i) => keep[i]);
}

/** One decimal, same as the other two generators: a fifth of a pixel at the painted size. */
const n = (v: number) => String(Math.round(v * 10) / 10);

/** Path data back out, one closed polygon per subpath. */
function polygons(subpaths: Pt[][]): string {
	let out = '';
	for (const pts of subpaths) {
		if (pts.length < 2) continue;
		out += `M${n(pts[0].x)} ${n(pts[0].y)}`;
		for (let i = 1; i < pts.length; i++) out += `L${n(pts[i].x)} ${n(pts[i].y)}`;
		out += 'Z';
	}
	return out;
}

/**
 * Rewrite one exported layer.
 *
 * A tag scanner rather than a parser, because the one structural fact this needs is whether a shape
 * is paint or alpha, and that is answered by whether any ancestor is a `mask`, a `clipPath`, or the
 * `defs` they live in. Everything else is attribute surgery.
 */
function repaint(svg: string, scene: Scene, slot: string): { body: string; top: number } {
	const id = `${scene.name}-${slot}`;
	const ns = (raw: string) => `${id}-${raw}`;
	/** The shapes this script is willing to be responsible for. Anything else stops the run. */
	const SHAPES = new Set(['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line']);
	const HIDDEN = new Set(['mask', 'clipPath', 'defs']);

	const GRADIENTS = new Set(['linearGradient', 'radialGradient']);

	let top = Infinity;
	let depth = 0;
	/** Masks specifically, which need the seam treatment the drawn shapes below do not. */
	let masked = 0;
	/** Set while inside a gradient, whose stops go out with it. See the drop below. */
	let dropping = '';
	let out = '';

	for (const m of svg.matchAll(/<(\/?)([\w-]+)((?:"[^"]*"|[^>])*?)(\/?)>|([^<]+)/g)) {
		const [whole, close, tag, attrs, selfClose, text] = m;
		if (text !== undefined) {
			// Whitespace between tags. Newlines are the export's, and dropping them is most of why
			// these files come out smaller than they went in.
			if (text.trim() && !dropping) out += text;
			continue;
		}
		if (dropping) {
			if (close && tag === dropping) dropping = '';
			continue;
		}
		if (tag === 'svg') continue; // The wrapper is rewritten by the caller.

		if (close) {
			if (HIDDEN.has(tag)) depth--;
			if (tag === 'mask') masked--;
			out += whole;
			continue;
		}

		// Gradient defs go out with the colour they described, stops and all: nothing references them
		// after the repaint, and the whole element has to go or the close tag is left unbalanced.
		if (GRADIENTS.has(tag)) {
			if (!selfClose) dropping = tag;
			continue;
		}

		let rest = attrs.replace(/\sid="([^"]*)"/g, (_, raw) => ` id="${ns(raw)}"`);
		rest = rest.replace(/url\(#([^)]*)\)/g, (_, raw) => `url(#${ns(raw)})`);

		if (depth === 0 && SHAPES.has(tag)) {
			if (tag !== 'path') throw new Error(`${id}: ${tag} is drawn, and only path is handled`);
			const d = rest.match(/\sd="([^"]*)"/)?.[1];
			if (!d) throw new Error(`${id}: a path with no d`);
			const subpaths = flatten(d).map((pts) => simplify(pts, scene.tolerance));
			for (const pts of subpaths) for (const p of pts) if (p.y < top) top = p.y;
			// One fill for the layer, no opacity, no stroke: notes 1 and 3 at the top.
			rest = rest
				.replace(/\s(?:fill|fill-opacity|opacity|stroke|stroke-width)="[^"]*"/g, '')
				.replace(/\sd="[^"]*"/, ` d="${polygons(subpaths)}"`);
			out += `<path${rest} fill="url(#${id})"/>`;
			continue;
		}

		// The seam treatment, and it goes on the mask rather than on the paint, because that is
		// where the seam is. An export draws a faceted ridge as one full-size rectangle per facet,
		// each cut to shape by its own luminance mask. Two facets sharing an edge therefore share
		// nothing: each mask's edge pixel is half white, half alpha composites to three quarters
		// rather than to one, and the band behind shows through as a pale hairline down every
		// ridge the export shaded. Painting the facets one colour cannot close it; growing each
		// mask by a unit so neighbours overlap does, and a unit of 4200 moves no silhouette the
		// eye can find.
		if (masked && tag === 'path' && / fill="white"/.test(rest)) {
			out += `<path${rest} stroke="white" stroke-width="2" stroke-linejoin="round"/>`;
			continue;
		}

		if (HIDDEN.has(tag) && !selfClose) depth++;
		if (tag === 'mask' && !selfClose) masked++;
		out += `<${tag}${rest}${selfClose}>`;
	}

	if (!Number.isFinite(top)) throw new Error(`${id}: nothing is drawn`);
	return { body: out, top };
}

for (const scene of SCENES) {
	for (const [file, slot] of Object.entries(scene.layers)) {
		const svg = await Bun.file(new URL(`${scene.name}/${file}.svg`, SOURCE)).text();
		const { body, top } = repaint(svg, scene, slot);
		const id = `${scene.name}-${slot}`;
		// Rounded down, so the crop never cuts into the crest it is cropping to.
		const y = Math.floor(top);
		const height = scene.height - y;
		const out =
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${y} ${scene.width} ${height}" width="${scene.width}" height="${height}">\n` +
			// Spanning the band's own box, which is the whole reason each file is cropped to its
			// crest: the crest stop lands on the crest whatever the band's depth or the screen's shape.
			`<linearGradient id="${id}" x1="0" y1="${y}" x2="0" y2="${scene.height}" gradientUnits="userSpaceOnUse">` +
			`<stop stop-color="var(--wall-band-crest)"/>` +
			`<stop offset="1" stop-color="var(--wall-band-base)"/>` +
			`</linearGradient>\n${body}\n</svg>\n`;
		await Bun.write(new URL(`${scene.name}/${slot}.svg`, OUT), out);
		console.log(
			`${`${scene.name}/${slot}.svg`.padEnd(28)}${(out.length / 1024).toFixed(1).padStart(8)}kB` +
				`  ${(svg.length / 1024).toFixed(1).padStart(8)}kB in   crest ${y}`
		);
	}
}
