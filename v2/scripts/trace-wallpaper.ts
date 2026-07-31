/**
 * The `grove` wallpaper, traced out of a stock illustration rather than authored.
 *
 * `gen-wallpaper.ts` invents its scene from noise and peaks. This one does not: the shapes come
 * from `svg-refs/vecteezy_vector-illustration-of-summer-landscape-smoky-forest-green_7633589.svg`,
 * which is already built the way this site needs a wallpaper to be built. Seven terrain bands,
 * back to front, each one a gradient rectangle clipped by a silhouette. The silhouettes are the
 * whole of what is wanted; the gradients are what the theme tokens replace.
 *
 * Three things happen here, and nothing else:
 *
 * 1. **Pick the shape out of the clip.** Every band's `clipPath` holds one large subpath, the
 *    terrain, plus a few hundred crumbs of two or three hundred characters each, which are the
 *    stray specks any auto-trace leaves behind. Keeping the largest subpath is the whole filter.
 *
 * 2. **Flatten and simplify.** The source is twenty thousand cubics per band, three megabytes of
 *    path data across the scene, which is four hundred times what a mask should weigh. Cubics
 *    become polylines, polylines go through Douglas-Peucker. Pine needles want corners, not
 *    curves, so nothing is re-splined on the way out.
 *
 * 3. **Give each band its own file.** Seven bands, seven files, every one of them opaque. The
 *    alternative was to keep three files and let the bands behind the front one run at reduced
 *    `fill-opacity`, which is cheaper and wrong: a thinned band is not a second shade, it is the
 *    same shade letting the sky and the plane behind it show through. It reads as a wash, it drifts
 *    with whatever happens to sit behind it, and in the glass skin, where the plane behind is
 *    blurred, it drifts per pixel. A shade has to be a colour, so a band has to be a layer.
 *
 * 4. **Keep the source's gradient, as two tokens.** `ridge` is masks: geometry in the file, one
 *    flat colour behind it. This one cannot be, and the reason is the illustration's own idea. Each
 *    band lightens toward its crest, which is aerial haze and is most of what makes the depth read.
 *    A mask is an alpha channel and could only say that by thinning, which is note 3 again. So the
 *    band carries its own two-stop gradient and is drawn rather than masked, and the two stops are
 *    `var()` rather than colour, which is why `Wallpaper.svelte` inlines these files instead of
 *    pointing at them: a custom property resolves in the document that declares it, and an SVG
 *    behind a `url()` is a document of its own with none of this site's tokens in it.
 *
 * Run with `bun scripts/trace-wallpaper.ts`. Deterministic: same input, same bytes out.
 */

const SOURCE = new URL(
	'../../svg-refs/vecteezy_vector-illustration-of-summer-landscape-smoky-forest-green_7633589.svg',
	import.meta.url
);
/** The wallpaper this draws, which is its folder, its ink block in `app.css`, and its gradient ids. */
const WALLPAPER = 'grove';
/**
 * Under `src`, not `static`, because these are inlined rather than fetched: note 4 above is why,
 * and a glob over that folder is how `Wallpaper.svelte` knows the drawn wallpapers without a list.
 */
const OUT = new URL(`../src/lib/wallpapers/${WALLPAPER}/`, import.meta.url);

/** The source frame. Everything below is in these units until the last step. */
const SRC_W = 5500;
const SRC_H = 1800;
/** The mask frame, matching the ridge masks so both wallpapers answer to the same CSS. */
const DST_W = 1600;
const SCALE = DST_W / SRC_W;

/**
 * How far a point may sit from the line that would replace it, in mask units, before it is kept.
 *
 * A mask is painted at roughly 1.5x its own width on a large display, so this is about one screen
 * pixel. Lower and the pine bands come out at a hundred kilobytes each for detail no one sees;
 * higher and the needles start rounding into blobs.
 */
const TOLERANCE = 0.6;

/**
 * The source's seven bands, grouped into the three planes, each group ordered back to front.
 *
 * The grouping follows the illustration's own reading of distance rather than an even split: the
 * two bare ranges are the far plane because bare is what far looks like, the first two forest
 * bands are the middle because that is where trees resolve into trees, and the last two are near
 * because they are the ones that run off the bottom of the frame.
 *
 * The front band of a group is the plane's face and gets the plane's own name. The ones behind it
 * are its relief and get a numbered suffix counting backwards, matching the mask tokens in
 * `app.css`. A plane's relief is bounded by its face and is the same distance from the eye; what
 * separates the two is a lit slope, not a horizon, which is why the shade steps between them are
 * a third of the step between planes.
 */
type Plane = { name: string; clips: string[] };

const PLANES: Plane[] = [
	{
		name: 'far',
		clips: [
			// The tall right-hand summit, the one thing in the scene with a peak.
			'clip-3',
			// The long range under it, full width, and the plane's own silhouette.
			'clip-6'
		]
	},
	{
		name: 'mid',
		clips: [
			// A bare shoulder on the left, the last of the terrain before the treeline.
			'clip-9',
			// The treeline proper, where the crest stops being smooth.
			'clip-12',
			'clip-15'
		]
	},
	{
		name: 'near',
		clips: [
			'clip-30',
			// The foreground, which reaches the bottom edge and is what the desktop sits on.
			'clip-33'
		]
	}
];

/**
 * `far.svg` for the front band of a plane, `far-1.svg` for the one behind it, and so on.
 *
 * The wallpaper's name is the folder these land in, so it is not in the file name. A band is named
 * for the slot it fills, which is what `app.css` and `Wallpaper.svelte` both address it by, and
 * every wallpaper's folder then reads the same way whatever the scene inside it is.
 */
const fileFor = (plane: Plane, i: number) => {
	const back = plane.clips.length - 1 - i;
	return `${plane.name}${back ? `-${back}` : ''}.svg`;
};

type Pt = { x: number; y: number };

/** Every clip in the file, by id. The source nests one path per `clipPath` and no more. */
function readClips(svg: string): Map<string, string> {
	const clips = new Map<string, string>();
	for (const m of svg.matchAll(/<clipPath id="(clip-\d+)">\s*<path[^>]*\sd="([^"]*)"/g)) {
		clips.set(m[1], m[2]);
	}
	return clips;
}

/** The terrain, which is the longest subpath. See note 1 at the top. */
function terrain(d: string): string {
	return d.split(/(?=M )/).reduce((a, b) => (b.length > a.length ? b : a), '');
}

/**
 * Path data to points.
 *
 * The source uses `M`, `L`, `C`, and `Z`, all absolute, which is what a trace emits and all this
 * needs to understand. A cubic is walked at a fixed step rather than adaptively, because
 * Douglas-Peucker is about to throw most of it away and an adaptive flattener would only be
 * choosing more carefully which points to discard.
 */
function flatten(d: string): Pt[] {
	const tokens = d.match(/[MLCZmlcz]|-?\d*\.?\d+/g) ?? [];
	const pts: Pt[] = [];
	let cmd = '';
	let cur: Pt = { x: 0, y: 0 };
	let i = 0;

	const num = () => Number(tokens[i++]);

	while (i < tokens.length) {
		const t = tokens[i];
		if (/[MLCZmlcz]/.test(t)) {
			cmd = t;
			i++;
			if (cmd === 'Z' || cmd === 'z') continue;
		}
		if (cmd === 'M' || cmd === 'L') {
			cur = { x: num(), y: num() };
			pts.push(cur);
		} else if (cmd === 'C') {
			const p1 = { x: num(), y: num() };
			const p2 = { x: num(), y: num() };
			const p3 = { x: num(), y: num() };
			// Sixteen steps across a curve that is usually a few source units long, which is a
			// fraction of a mask unit per step. Below the tolerance, so nothing is lost here that
			// the simplifier would have kept.
			for (let s = 1; s <= 16; s++) {
				const u = s / 16;
				const v = 1 - u;
				pts.push({
					x: v * v * v * cur.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u * u * u * p3.x,
					y: v * v * v * cur.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u * u * u * p3.y
				});
			}
			cur = p3;
		} else {
			// Nothing else appears in this file. Failing loudly beats drawing something wrong.
			throw new Error(`unhandled path command: ${t}`);
		}
	}
	return pts;
}

/** Distance from p to the line through a and b. Degenerate segment falls back to the endpoint. */
function perpendicular(p: Pt, a: Pt, b: Pt): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const len = Math.hypot(dx, dy);
	if (len === 0) return Math.hypot(p.x - a.x, p.y - a.y);
	return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

/**
 * Douglas-Peucker, iterative.
 *
 * Iterative rather than recursive because these bands arrive as three hundred thousand points and
 * the recursive form blows the stack on the first one.
 */
function simplify(pts: Pt[], tolerance: number): Pt[] {
	if (pts.length < 3) return pts;
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

/** One decimal is a fifth of a pixel at the size these masks are painted at, same as the ridges. */
const n = (v: number) => String(Math.round(v * 10) / 10);

function polygon(pts: Pt[]): string {
	let out = `M${n(pts[0].x)} ${n(pts[0].y)}`;
	for (let i = 1; i < pts.length; i++) out += `L${n(pts[i].x)} ${n(pts[i].y)}`;
	return out + 'Z';
}

const svg = await Bun.file(SOURCE).text();
const clips = readClips(svg);

/**
 * Trace every band once, in source units, before any plane is written.
 *
 * The planes have to agree on where the horizon is, and each one is cropped to its own content,
 * so the crop cannot be decided until every band in that plane is known.
 */
const traced = new Map<string, Pt[]>();
for (const plane of PLANES) {
	for (const clip of plane.clips) {
		const d = clips.get(clip);
		if (!d) throw new Error(`${clip} is not in the source`);
		traced.set(clip, simplify(flatten(terrain(d)), TOLERANCE / SCALE));
	}
}

for (const plane of PLANES) {
	for (const [i, clip] of plane.clips.entries()) {
		// Bottom-anchored like the ridge masks: every file's bottom edge is the source's bottom
		// edge, so bands sharing a plane share a scale and land back in register with no offset to
		// carry. The top is cropped to the band's own crest, because empty rows above it would only
		// stretch the file and push the crest down the screen.
		const band = traced.get(clip)!;
		const top = Math.min(...band.map((p) => p.y));
		const height = Math.round((SRC_H - top) * SCALE * 10) / 10;
		const pts = band.map((p) => ({ x: p.x * SCALE, y: (p.y - top) * SCALE }));

		const file = fileFor(plane, i);
		// The gradient spans the band's own box, which is the whole reason each file is cropped to
		// its crest: `y2` is this band's height, so the crest stop lands on the crest whatever the
		// band's depth or the viewport's shape.
		//
		// The id is wallpaper-then-slot even though the file name is only the slot, because these
		// are inlined: seven of them land in one document, and a document that ever holds two
		// wallpapers at once would have two `#far` in it. A file name is scoped by its folder and
		// an id is scoped by nothing.
		const id = `${WALLPAPER}-${file.slice(0, -4)}`;
		const out =
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${DST_W} ${height}" width="${DST_W}" height="${height}">\n` +
			`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="${height}" gradientUnits="userSpaceOnUse">` +
			`<stop stop-color="var(--wall-band-crest)"/>` +
			`<stop offset="1" stop-color="var(--wall-band-base)"/>` +
			`</linearGradient>\n` +
			`<path d="${polygon(pts)}" fill="url(#${id})"/>\n</svg>\n`;
		await Bun.write(new URL(file, OUT), out);
		console.log(
			`${file.padEnd(20)}${(out.length / 1024).toFixed(1).padStart(7)}kB  height ${height}`
		);
	}
}
