/**
 * Draws the three ridge masks into static/wallpapers/.
 *
 * Not part of the build, and it must never be: the site is fully prerendered and the masks are
 * shipped bytes. Run it when the scene wants revising, look at what came out, and commit this
 * file next to its output.
 *
 *   bun scripts/gen-wallpaper.ts
 *
 * Why a generator rather than a drawing. A ridge that reads as landscape instead of as a sawtooth
 * needs shoulders, saddles, sub-peaks, and flanks that are steep on one side and long on the
 * other, and a treeline needs a hundred trees no two of which are the same tree. Hand-typing that
 * is several hundred control points that nobody can then revise, because moving one summit means
 * retyping both of its flanks by hand. Here a summit is five numbers and everything around it
 * follows from them.
 *
 * Everything is seeded, so this is reproducible: a rerun with no edits writes byte-identical
 * files, and a diff is only ever the change that was meant.
 *
 * What the files are allowed to contain is the mask contract in app.css. White fill, depth as
 * fill-opacity, no colour anywhere, because one set of files has to dress all 24 skin, theme, and
 * polarity combinations, and a baked colour would be right in one of them.
 */

/* --------------------------------------------------------------------------
   Deterministic randomness

   Two consumers, and they want different things. The terrain wants a continuous
   function of x, because a ridge is a curve and adjacent samples have to agree.
   The scenery wants a stream of independent draws, because the next tree has no
   relationship to the last one. So: one generator, read directly for the second
   and interpolated for the first.
   -------------------------------------------------------------------------- */

/** Mulberry32. Thirty-two bits of state and a good enough spread for scenery. */
function seeded(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Fractal value noise over one dimension. Four octaves of a 256-entry table read with a smoothstep
 * between neighbours, each octave half the amplitude and a little over twice the frequency of the
 * one before.
 *
 * The frequency ratio is 2.1 rather than 2 on purpose: at exactly 2 the octaves share every other
 * lattice point and the sum develops a visible beat at the table length. Returns roughly -0.5 to
 * 0.5, so an amplitude in units multiplies straight through.
 */
function noise(rand: () => number): (x: number) => number {
	const octaves = Array.from({ length: 4 }, () => {
		const table = Array.from({ length: 256 }, rand);
		return (x: number) => {
			const i = Math.floor(x);
			const f = x - i;
			const a = table[i & 255];
			const b = table[(i + 1) & 255];
			return a + (b - a) * f * f * (3 - 2 * f);
		};
	});
	return (x: number) => {
		let sum = 0;
		let total = 0;
		let amp = 1;
		let freq = 1;
		for (const octave of octaves) {
			sum += (octave(x * freq) - 0.5) * amp;
			total += amp;
			amp *= 0.5;
			freq *= 2.1;
		}
		return sum / total;
	};
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (v: number) => {
	const t = clamp01(v);
	return t * t * (3 - 2 * t);
};

/* --------------------------------------------------------------------------
   Sampled curve to path

   The terrain below is an analytic function, so it can be sampled as finely as
   wanted and the only question is how many of those samples survive into the
   file. Two passes answer it: throw away every point the curve does not need,
   then run a spline through the ones that are left.
   -------------------------------------------------------------------------- */

type Pt = { x: number; y: number };

/** One decimal is a fifth of a pixel at the size these masks are painted at. */
const n = (v: number) => String(Math.round(v * 10) / 10);

function sample(fn: (x: number) => number, from: number, to: number, step: number): Pt[] {
	const out: Pt[] = [];
	for (let x = from; x < to; x += step) out.push({ x, y: fn(x) });
	out.push({ x: to, y: fn(to) });
	return out;
}

function perpendicular(p: Pt, a: Pt, b: Pt): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const len = Math.hypot(dx, dy);
	if (len === 0) return Math.hypot(p.x - a.x, p.y - a.y);
	return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

/**
 * Ramer-Douglas-Peucker. Keeps whatever the tolerance cannot flatten, which on a landscape means
 * it keeps every summit and drops the long calm runs between them.
 *
 * It is also what keeps a sharp summit sharp. Dense sampling puts two survivors right at an apex,
 * so the spline below gets a short segment there and pinches, while a gentle shoulder keeps one
 * point across a long span and swoops.
 */
function simplify(pts: Pt[], tolerance: number): Pt[] {
	if (pts.length < 3) return pts;
	const first = pts[0];
	const last = pts[pts.length - 1];
	let far = 0;
	let index = -1;
	for (let i = 1; i < pts.length - 1; i++) {
		const d = perpendicular(pts[i], first, last);
		if (d > far) {
			far = d;
			index = i;
		}
	}
	if (far <= tolerance) return [first, last];
	return [
		...simplify(pts.slice(0, index + 1), tolerance).slice(0, -1),
		...simplify(pts.slice(index), tolerance)
	];
}

/**
 * Centripetal Catmull-Rom through the points, emitted as cubic Bezier segments.
 *
 * Centripetal, meaning the knot spacing is raised to 0.5 rather than used raw, because the uniform
 * form loops and cusps wherever three points crowd together, which on a ridge is exactly at the
 * summits. This variant is the one with a proof that it never does.
 *
 * The endpoints are doubled so the first and last segment have a neighbour to take a tangent from.
 */
function spline(pts: Pt[]): string {
	const knots = [pts[0], ...pts, pts[pts.length - 1]];
	const span = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y) ** 0.5;
	const out: string[] = [];
	for (let i = 1; i < knots.length - 2; i++) {
		const [p0, p1, p2, p3] = [knots[i - 1], knots[i], knots[i + 1], knots[i + 2]];
		const t01 = span(p0, p1);
		const t12 = span(p1, p2);
		const t23 = span(p2, p3);
		// Barry and Goldman's tangents, scaled by the segment's own share of its neighbourhood.
		// That scaling is the whole of what makes the spline non-uniform.
		const a = t01 + t12 === 0 ? 0 : t12 / (t01 + t12) / 3;
		const b = t12 + t23 === 0 ? 0 : t12 / (t12 + t23) / 3;
		const c1 = { x: p1.x + (p2.x - p0.x) * a, y: p1.y + (p2.y - p0.y) * a };
		const c2 = { x: p2.x - (p3.x - p1.x) * b, y: p2.y - (p3.y - p1.y) * b };
		out.push(`C${n(c1.x)} ${n(c1.y)} ${n(c2.x)} ${n(c2.y)} ${n(p2.x)} ${n(p2.y)}`);
	}
	return out.join('');
}

/* --------------------------------------------------------------------------
   Terrain

   A ridge is a handful of authored summits plus the detail that a summit implies.
   The summits are the composition and they are typed out below; the sub-peaks on
   their flanks and the wobble along the whole crest are derived from the seed,
   because those are the parts where being deliberate buys nothing.
   -------------------------------------------------------------------------- */

/**
 * One summit. `h` is a weight rather than a height: the band stretches the sum of its summits onto
 * the floor and crest it was given, which is what lets a summit be moved or added without the
 * skyline drifting off the composition.
 *
 * `wl` and `wr` are the two flank widths, and their being separate is most of why these read as
 * mountains: a real ridge is steep on the weather side and ramps out on the other. Around 0.8 of
 * the band's relief is the width that reads as a mountain rather than as a needle or a dune.
 *
 * `e` is the falloff exponent, and it is the difference between a spire and a massif. At 1 the
 * summit is a corner; by 2.2 the top has flattened into a plateau and the flanks stand up.
 */
type Peak = { x: number; h: number; wl: number; wr: number; e: number };

function bell(x: number, p: Peak): number {
	const w = x < p.x ? p.wl : p.wr;
	return p.h * Math.exp(-(Math.abs((x - p.x) / w) ** p.e));
}

/**
 * The small summits that ride on a big one's flanks. A few per authored peak, a quarter to a half
 * of its parent's height and a fifth of its width, dropped somewhere along a flank rather than at
 * a fixed offset.
 *
 * These are what a hand-drawn ridge has and a polyline never does: the flank stops being one
 * straight run down to the valley and grows the false summits and the notches between them that
 * make the eye read distance.
 *
 * They ride on the terrain rather than compete with it, which is the one thing that has to be
 * said about how they are combined below. Thrown into the smooth maximum alongside the summits
 * they vanish outright: a sub-peak is by definition shorter than the mountain it sits on, so the
 * maximum picks the mountain everywhere and the flank comes out as clean as if they were never
 * there. Added on top of the maximum they do exactly what they are for.
 */
function shoulders(peaks: Peak[], detail: number, rand: () => number): Peak[] {
	const out: Peak[] = [];
	for (const p of peaks) {
		for (let i = 0; i < detail + Math.floor(rand() * 2); i++) {
			const side = rand() < 0.5 ? -1 : 1;
			const flank = side < 0 ? p.wl : p.wr;
			out.push({
				x: p.x + flank * (0.5 + rand() * 1.15) * side,
				h: p.h * (0.09 + rand() * 0.16),
				wl: flank * (0.09 + rand() * 0.11),
				wr: flank * (0.09 + rand() * 0.11),
				e: 1.2 + rand() * 0.7
			});
		}
	}
	return out;
}

/** A band of terrain: one silhouette at one alpha, back to front within a file. */
type Band = {
	/** Painted alpha, before the bands in front of it composite over. */
	opacity: number;
	/** Height of the deepest saddle, in viewBox units above the bottom edge. */
	floor: number;
	/** Height of the tallest summit, same units. */
	crest: number;
	peaks: Peak[];
	/** Sub-peaks per summit. Distant ranges want more of them, near ones want a clean silhouette. */
	detail: number;
	/** Amplitude of the crest wobble, in units, at full height. */
	grain: number;
	/** Wavelength of that wobble, in units. Small numbers read as scree, large as folds. */
	fold: number;
	seed: number;
	forest?: Forest;
};

const X0 = -8;
const X1 = 1608;

/**
 * The band's skyline as a function of x, in viewBox coordinates, so y grows downward and the
 * caller never has to think in two directions at once.
 *
 * Summits combine by smooth maximum rather than by sum, and that is what lets a mountain be both
 * broad and separate from its neighbour. Added together, two overlapping bells fill the saddle
 * between them from below, so the only way to keep a saddle deep is to make both summits narrow,
 * which is how the first pass of this scene ended up as a row of needles. A maximum leaves the
 * saddle where the two flanks cross, so width and separation stop fighting. Smooth rather than
 * plain, because a plain maximum meets in a hard V and a range of hard Vs is the sawtooth this
 * whole file exists to get away from. Log-sum-exp is the standard way to round that corner, and
 * the sharpness constant is how much of the corner it leaves.
 *
 * Both ends are then stretched onto the band's floor and crest, so the deepest saddle genuinely
 * reaches the floor and the tallest summit genuinely reaches the crest, whatever the arithmetic
 * in between did. A summit can be moved without the skyline drifting off the composition.
 *
 * The wobble is scaled by how high the terrain already is, so summits get weather and valleys stay
 * calm. Flat noise across the whole band is the thing that makes generated terrain look generated.
 */
const SHARPNESS = 24;

function skyline(band: Band, height: number): (x: number) => number {
	const rand = seeded(band.seed);
	const detail = shoulders(band.peaks, band.detail, rand);
	const grain = noise(rand);
	const raw = (x: number) =>
		Math.log(band.peaks.reduce((sum, p) => sum + Math.exp(SHARPNESS * bell(x, p)), 0)) / SHARPNESS +
		detail.reduce((sum, p) => sum + bell(x, p), 0);

	let low = Infinity;
	let high = -Infinity;
	for (let x = X0; x <= X1; x += 2) {
		const v = raw(x);
		low = Math.min(low, v);
		high = Math.max(high, v);
	}
	const relief = band.crest - band.floor;

	return (x: number) => {
		const t = (raw(x) - low) / (high - low);
		const weather = grain(x / band.fold) * band.grain * (0.25 + 0.75 * t);
		return height - (band.floor + t * relief + weather);
	};
}

/* --------------------------------------------------------------------------
   Scenery

   Everything here is emitted as extra subpaths inside the band's own path, never
   as separate elements. A path fills its subpaths as a union under the default
   nonzero rule, so a crown that overlaps the ridge paints one alpha rather than
   two, and a band at fill-opacity 0.4 does not grow a seam wherever two trees
   touch. Every subpath below is wound the same way for that reason: reverse one
   and the union punches a hole in the mountain behind it.
   -------------------------------------------------------------------------- */

/**
 * A conifer as one spire with concave flanks, which is what a fir actually is from a distance:
 * wide and soft at the skirt, tightening as it goes up. The stacked wedges this replaces were
 * three straight triangles, and three straight triangles at fifty repetitions read as a pattern
 * rather than as trees.
 */
function conifer(cx: number, base: number, h: number, w: number, lean: number): string {
	return (
		`M${n(cx - w)} ${n(base)}` +
		`Q${n(cx - w * 0.4)} ${n(base - h * 0.46)} ${n(cx + lean)} ${n(base - h)}` +
		`Q${n(cx + w * 0.4)} ${n(base - h * 0.46)} ${n(cx + w)} ${n(base)}Z`
	);
}

/** The same silhouette with its controls pushed outside, so the flanks bulge and it reads round. */
function broadleaf(cx: number, base: number, h: number, w: number, lean: number): string {
	return (
		`M${n(cx - w)} ${n(base)}` +
		`Q${n(cx - w * 1.15)} ${n(base - h * 0.78)} ${n(cx + lean)} ${n(base - h)}` +
		`Q${n(cx + w * 1.15)} ${n(base - h * 0.78)} ${n(cx + w)} ${n(base)}Z`
	);
}

type Forest = {
	from: number;
	to: number;
	/** Spacing between trunks, in units, before the density and slope rules stretch it. */
	gap: [number, number];
	/** Crown height, in units, before the same rules shrink it. */
	size: [number, number];
	/** Crown half-width as a fraction of crown height. */
	slim: number;
	/**
	 * The treeline, as two fractions of the band's own relief. Below the first the slope is fully
	 * wooded, above the second it is bare rock, and between them the forest thins out. Two numbers
	 * rather than one because a hard edge at a single altitude is a contour line, not a treeline.
	 */
	line: [number, number];
	seed: number;
};

/**
 * Walks the skyline planting trees, and the whole of the difference from an evenly spaced row is
 * in what it multiplies the spacing and the size by.
 *
 * Altitude thins the forest, because that is what altitude does, and it means the summits stand
 * bare against the sky while the saddles fill in. Slope thins it too, because a face steep enough
 * to be rock does not hold soil. Both also shrink what does grow, so the edge of the treeline is
 * small scattered trees rather than full-sized ones that stop.
 */
function forest(ridge: (x: number) => number, band: Band, height: number, f: Forest): string {
	const rand = seeded(f.seed);
	const relief = band.crest - band.floor;
	const out: string[] = [];
	for (let x = f.from; x < f.to;) {
		const y = ridge(x);
		const altitude = (height - y - band.floor) / relief;
		const slope = Math.abs(ridge(x + 6) - ridge(x - 6)) / 12;
		const density =
			smoothstep((f.line[1] - altitude) / (f.line[1] - f.line[0])) *
			smoothstep((1.5 - slope) / 0.9);
		if (rand() < density) {
			// One in twelve is an emergent, half again as tall as its neighbours. A canopy whose
			// tallest tree is its average height is a hedge; the ones that overtop it are what give
			// the skyline of a forest its ragged edge.
			const emergent = rand() < 0.13 ? 1.65 : 1;
			const h = (f.size[0] + rand() * (f.size[1] - f.size[0])) * (0.55 + 0.45 * density) * emergent;
			const w = (h / emergent) * f.slim * (0.8 + rand() * 0.4);
			const lean = w * (rand() - 0.5) * 0.5;
			// A tenth of the planting is round, which is enough to break the repeat and not so much
			// that the ridge stops reading as a conifer line.
			const draw = rand() < 0.1 ? broadleaf : conifer;
			out.push(draw(x, y + 1.5, h, w, lean));
		}
		const spacing = f.gap[0] + rand() * (f.gap[1] - f.gap[0]);
		x += spacing / (0.35 + 0.65 * density);
	}
	return out.join('');
}

/**
 * The fire lookout, carried over from the old scene because it is the one thing in the wallpaper
 * that says a person has been up there. Splayed legs, a braced platform, a cabin, and a pitched
 * roof, all of it rectangles and one triangle, because it has to survive retro quantising the
 * whole scene to six-pixel blocks and a rectangle is the only shape that does.
 */
function lookout(cx: number, base: number, h: number): string {
	const legTop = base - h * 0.52;
	const spread = h * 0.19;
	const leg = h * 0.045;
	const cabin = h * 0.3;
	const halfCabin = h * 0.21;
	const box = (x0: number, y0: number, x1: number, y1: number) =>
		`M${n(x0)} ${n(y0)}L${n(x1)} ${n(y0)}L${n(x1)} ${n(y1)}L${n(x0)} ${n(y1)}Z`;
	return [
		`M${n(cx - spread)} ${n(base)}L${n(cx - spread + leg)} ${n(base)}L${n(cx - leg * 1.4)} ${n(legTop)}L${n(cx - leg * 2.4)} ${n(legTop)}Z`,
		`M${n(cx + spread - leg)} ${n(base)}L${n(cx + spread)} ${n(base)}L${n(cx + leg * 2.4)} ${n(legTop)}L${n(cx + leg * 1.4)} ${n(legTop)}Z`,
		box(cx - spread * 0.62, base - h * 0.26, cx + spread * 0.62, base - h * 0.26 + leg * 0.8),
		box(cx - halfCabin * 1.14, legTop - leg, cx + halfCabin * 1.14, legTop),
		box(cx - halfCabin, legTop - leg - cabin, cx + halfCabin, legTop - leg),
		`M${n(cx - halfCabin * 1.32)} ${n(legTop - leg - cabin)}L${n(cx)} ${n(legTop - leg - cabin - h * 0.14)}L${n(cx + halfCabin * 1.32)} ${n(legTop - leg - cabin)}Z`
	].join('');
}

/* --------------------------------------------------------------------------
   The scene

   Three files, three depths. The far one carries the distant ranges and the
   whole of the aerial perspective, the middle one is the layer the old scene did
   not have and the reason it had no middle, and the near one is the foreground
   the desktop icons sit against.

   Each file's viewBox height and each layer's mask-size in app.css are one
   decision, not two: bottom-anchored, the crest of a band lands at
   `mask width * (viewBox height - crest y) / 1600` above the bottom of the
   screen. The heights below and the percentages there were solved together so
   the three crests separate on a laptop and stay separated on a phone.
   -------------------------------------------------------------------------- */

type Scene = { file: string; height: number; bands: Band[] };

export const SCENES: Scene[] = [
	{
		file: 'ridge-far.svg',
		height: 560,
		bands: [
			{
				// Composited alpha 0.30. The horizon, and deliberately the busiest silhouette in the
				// scene: distance is what turns a jagged skyline into a suggestion of one, so the
				// range carrying the most detail is the one that reads softest.
				opacity: 0.3,
				floor: 362,
				crest: 535,
				detail: 4,
				grain: 13,
				fold: 44,
				seed: 1201,
				peaks: [
					{ x: 250, h: 0.85, wl: 235, wr: 200, e: 1.25 },
					{ x: 640, h: 0.6, wl: 210, wr: 245, e: 1.4 },
					{ x: 1030, h: 1, wl: 205, wr: 260, e: 1.2 },
					{ x: 1420, h: 0.72, wl: 235, wr: 210, e: 1.35 }
				]
			},
			{
				// Composited alpha 0.58.
				opacity: 0.4,
				floor: 286,
				crest: 467,
				detail: 4,
				grain: 12,
				fold: 42,
				seed: 4477,
				peaks: [
					{ x: 70, h: 0.74, wl: 210, wr: 235, e: 1.3 },
					{ x: 450, h: 1, wl: 200, wr: 255, e: 1.15 },
					{ x: 840, h: 0.58, wl: 220, wr: 195, e: 1.45 },
					{ x: 1220, h: 0.9, wl: 205, wr: 250, e: 1.25 },
					{ x: 1570, h: 0.68, wl: 225, wr: 205, e: 1.4 }
				]
			},
			{
				// Composited alpha 0.88, which is as solid as this file gets: anything nearer than
				// this belongs in a layer of its own, where it can take its own colour token.
				//
				// All three bands live in one file because they share one token, and sharing a token
				// is exactly what alpha bands are for: they carry relief, not distance. It is also
				// why the two layers in front are one solid band each. A translucent band paints a
				// slightly different tone wherever what is behind it changes, and inside this file
				// that never shows, because each band sits almost entirely within the one behind it.
				opacity: 0.71,
				floor: 202,
				crest: 383,
				detail: 3,
				grain: 11,
				fold: 40,
				seed: 8123,
				peaks: [
					{ x: 180, h: 0.9, wl: 230, wr: 200, e: 1.35 },
					{ x: 570, h: 0.64, wl: 215, wr: 255, e: 1.45 },
					{ x: 960, h: 1, wl: 205, wr: 265, e: 1.2 },
					{ x: 1350, h: 0.76, wl: 240, wr: 210, e: 1.3 }
				]
			}
		]
	},
	{
		file: 'ridge-mid.svg',
		height: 420,
		bands: [
			{
				// The layer the old scene did not have. Its treeline is deliberately fine: at this
				// distance a forest is a texture along a crest, and drawing it at the near layer's
				// scale would flatten the depth this whole layer was added for.
				opacity: 1,
				floor: 146,
				crest: 337,
				detail: 3,
				grain: 11,
				fold: 40,
				seed: 6611,
				peaks: [
					{ x: 80, h: 0.7, wl: 225, wr: 255, e: 1.35 },
					{ x: 470, h: 1, wl: 215, wr: 280, e: 1.2 },
					{ x: 880, h: 0.56, wl: 240, wr: 210, e: 1.5 },
					{ x: 1240, h: 0.92, wl: 220, wr: 265, e: 1.3 },
					{ x: 1580, h: 0.72, wl: 235, wr: 215, e: 1.4 }
				],
				forest: {
					from: -6,
					to: 1606,
					gap: [6, 13],
					size: [11, 21],
					slim: 0.31,
					line: [0.45, 0.92],
					seed: 9042
				}
			}
		]
	},
	{
		file: 'ridge-near.svg',
		height: 340,
		bands: [
			{
				// The foreground carries the fewest summits and the widest flanks of the three
				// files, because it is the only silhouette read at full size: what is detail at the
				// horizon is clutter here, and the forest along the crest is detail enough.
				opacity: 1,
				floor: 79,
				crest: 283,
				detail: 3,
				grain: 10,
				fold: 46,
				seed: 3391,
				peaks: [
					{ x: 190, h: 0.72, wl: 280, wr: 320, e: 1.5 },
					{ x: 680, h: 1, wl: 270, wr: 360, e: 1.35 },
					{ x: 1230, h: 0.9, wl: 320, wr: 280, e: 1.4 }
				],
				forest: {
					from: -6,
					to: 1606,
					gap: [7, 16],
					size: [16, 46],
					slim: 0.28,
					line: [0.28, 0.9],
					seed: 5528
				}
			}
		]
	}
];

/** Where the lookout stands: the right flank of the near layer's second summit. */
const LOOKOUT = { x: 1250, h: 74 };

export function draw(scene: Scene): string {
	const paths = scene.bands.map((band) => {
		const ridge = skyline(band, scene.height);
		const crest = simplify(sample(ridge, X0, X1, 2), 1.4);
		let d = `M${n(X0)} ${n(crest[0].y)}${spline(crest)}L${n(X1)} ${n(scene.height)}L${n(X0)} ${n(scene.height)}Z`;
		if (band.forest) d += forest(ridge, band, scene.height, band.forest);
		if (scene.file.includes('near')) d += lookout(LOOKOUT.x, ridge(LOOKOUT.x) + 2, LOOKOUT.h);
		const alpha = band.opacity === 1 ? '' : ` fill-opacity="${band.opacity}"`;
		return `<path${alpha} d="${d}"/>`;
	});
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 ${scene.height}" ` +
		`width="1600" height="${scene.height}" fill="#fff">\n${paths.join('\n')}\n</svg>\n`
	);
}

if (import.meta.main) {
	for (const scene of SCENES) {
		const svg = draw(scene);
		await Bun.write(new URL(`../static/wallpapers/${scene.file}`, import.meta.url), svg);
		console.log(`${scene.file}  ${(svg.length / 1024).toFixed(1)}KB`);
	}
}
