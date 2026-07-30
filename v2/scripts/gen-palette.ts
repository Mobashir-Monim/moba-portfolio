/**
 * Emits the theme blocks for app.css and reports the WCAG contrast of every
 * pair the test in src/lib/tokens.test.ts enforces.
 *
 * Not part of the build. Run it when a hue needs revising:
 *
 *   bun scripts/gen-palette.ts          # CSS blocks, paste into app.css
 *   bun scripts/gen-palette.ts --report # contrast table
 *
 * Ramps are authored in OKLCH so lightness is perceptual and AA is predictable,
 * then flattened to hex, because the runtime must not depend on this script.
 */
import { contrast } from '../src/lib/contrast';

/**
 * Two hues per theme, in OKLCH degrees. Names track what stores an image.
 *
 * `accent` dresses the accent, the selection, and the focus ring. `chrome` dresses everything
 * else: the surfaces, the ink, the rules. They are separate numbers because running the whole
 * ramp off one hue is what made the earlier palettes read flat. When the ground is a desaturated
 * shade of the accent, the accent is not a colour on the page, it is the same colour turned up,
 * and nothing pops. Give the chrome its own hue and the accent has something to be different
 * from.
 *
 * Two rules on the pairing, and every row below follows both:
 *
 *   far apart      at least 100 degrees, so the two never read as one hue at two saturations.
 *   chrome reads   grey, which in practice means the 250-265 band (cool grey) or the 70-90 band
 *                  (warm greige). Those are the two places a low-chroma cast still says "grey"
 *                  rather than naming a colour. `cyanotype` and `anthotype` sit in the warm band
 *                  because their accents are already cool, and the cool band is spoken for.
 *
 * The accent hues themselves were picked by sweeping all 360 degrees through the ramps below and
 * measuring how much of the authored chroma survives `fit()`. Contrast almost never decides this:
 * sRGB does. At these lightnesses the gamut delivers all of the asked-for chroma around 320, most
 * of it around 140, roughly three quarters in the warm band, and barely half through the cyan and
 * teal stretch from 165 to 235. That stretch is why there is no teal theme. The four below take
 * one hue from each usable cluster, which is also what keeps them apart.
 */
const THEMES = {
	ferrite: { accent: 40, chrome: 250 }, // iron-oxide burnt orange on cool grey
	phosphor: { accent: 140, chrome: 265 }, // P1 CRT green on cool grey
	cyanotype: { accent: 245, chrome: 78 }, // Prussian blue on warm paper
	anthotype: { accent: 328, chrome: 88 } // petal-juice magenta on warm greige
} as const;

/** Lightness and chroma per token. Hue comes from the theme. */
type Spec = Record<string, [L: number, C: number]>;

/** Tokens drawn from the theme's accent hue. Everything else takes the chrome hue. */
const ACCENT_TOKENS = new Set([
	'accent',
	'accent-hover',
	'on-accent',
	'select',
	'on-select',
	'focus'
]);

/*
 * Harshness is lightness, vibrancy is chroma, and separation is hue. Three axes, and every way
 * this ramp has been wrong was one axis on its own. Hue is handled by the pairing above; the two
 * below are what these specs set.
 *
 * The first ramp was harsh: the ground sat at the very bottom of the range (L 0.125 to 0.155 in
 * dark, pure #ffffff in light), so every window was near-white type on near-black. That is the
 * right amount of contrast for a 1-bit display and too much for `modern` and `glass`.
 *
 * Pulling the ground off both ends fixed that. Pulling chroma down at the same time did not fix
 * anything: it only made the result dull, because a desaturated accent on a desaturated ground
 * is a palette with nothing in it. So chroma went back up and the lightness structure stayed.
 *
 * Where each axis now sits:
 *
 *   L, the soft part    dark surfaces run 0.19 to 0.31 rather than 0.125 to 0.255; light
 *                       surfaces stop at 0.995 rather than pure white. fg-1 on surface-1 lands
 *                       near 13.5:1 rather than 16.3:1.
 *   C, the alive part   accents at 0.145 to 0.15, which is as far as sRGB goes at these
 *                       lightnesses for most of the six hues. Surfaces and ink carry roughly
 *                       twice the tint they did, so the greys belong to the theme rather than
 *                       reading as neutral graphite laid over it.
 *
 * Ink lightness stays near the ends of the range on purpose: it is what carries retro's crunch,
 * and retro's character is otherwise pure shape.
 */
const DARK: Spec = {
	'surface-0': [0.225, 0.024],
	'surface-1': [0.265, 0.022],
	'surface-2': [0.31, 0.024],
	'surface-3': [0.19, 0.022],
	'fg-1': [0.95, 0.016],
	'fg-2': [0.8, 0.02],
	'fg-3': [0.7, 0.024],
	line: [0.375, 0.028],
	'line-strong': [0.6, 0.032],
	accent: [0.75, 0.145],
	'accent-hover': [0.83, 0.13],
	'on-accent': [0.19, 0.05],
	select: [0.52, 0.15],
	'on-select': [0.99, 0.01],
	focus: [0.78, 0.145]
};

const LIGHT: Spec = {
	'surface-0': [0.905, 0.02],
	'surface-1': [0.975, 0.013],
	'surface-2': [0.945, 0.016],
	// Not 1.0: pure white is the one value in the ramp with no tint at all, and it reads as a
	// hole punched in a tinted palette. 0.995 is still the brightest surface.
	'surface-3': [0.995, 0.007],
	'fg-1': [0.27, 0.035],
	'fg-2': [0.46, 0.034],
	'fg-3': [0.525, 0.034],
	line: [0.89, 0.022],
	'line-strong': [0.575, 0.03],
	accent: [0.515, 0.15],
	'accent-hover': [0.45, 0.16],
	'on-accent': [0.99, 0.005],
	select: [0.515, 0.15],
	'on-select': [0.99, 0.005],
	focus: [0.53, 0.15]
};

/**
 * Pairs that must pass. Text pairs need 4.5:1 (WCAG 1.4.3 AA, normal text);
 * non-text pairs need 3:1 (1.4.11). Kept in sync with tokens.test.ts by hand:
 * two short lists beat a shared module neither side reads.
 */
const PAIRS: [fg: string, bg: string, min: number][] = [
	...['surface-0', 'surface-1', 'surface-2', 'surface-3'].flatMap(
		(bg) => [['fg-1', bg, 4.5] as [string, string, number], ['fg-2', bg, 4.5]] as const
	),
	// fg-3 is muted body copy, it never sits on the desktop ground.
	['fg-3', 'surface-1', 4.5],
	['fg-3', 'surface-2', 4.5],
	['fg-3', 'surface-3', 4.5],
	['on-accent', 'accent', 4.5],
	['on-accent', 'accent-hover', 4.5],
	['on-select', 'select', 4.5],
	['accent', 'surface-1', 3],
	// 4.5, not 3: the info sidebar's heading is accent-coloured text on the panel, which is the
	// one place outside the title bar a skin spends accent on letterforms. tokens.test.ts holds
	// that separately, and this line is what stops a softened accent from failing it there.
	['accent', 'surface-2', 4.5],
	['line-strong', 'surface-0', 3],
	['line-strong', 'surface-1', 3],
	['line-strong', 'surface-2', 3],
	['focus', 'surface-0', 3],
	['focus', 'surface-1', 3],
	['focus', 'surface-2', 3],
	['focus', 'surface-3', 3]
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** OKLCH to linear sRGB. Björn Ottosson's matrices. */
function oklchToLinear(L: number, C: number, hDeg: number): [number, number, number] {
	const h = (hDeg * Math.PI) / 180;
	const a = C * Math.cos(h);
	const b = C * Math.sin(h);
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
	];
}

const inGamut = (rgb: number[]) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);

/** Bisect chroma down until the colour fits sRGB, so out-of-gamut hues desaturate instead of skewing. */
function fit(L: number, C: number, h: number): [number, number, number] {
	if (inGamut(oklchToLinear(L, C, h))) return oklchToLinear(L, C, h);
	let lo = 0;
	let hi = C;
	for (let i = 0; i < 24; i++) {
		const mid = (lo + hi) / 2;
		if (inGamut(oklchToLinear(L, mid, h))) lo = mid;
		else hi = mid;
	}
	return oklchToLinear(L, lo, h);
}

const encode = (v: number) =>
	v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(clamp01(v), 1 / 2.4) - 0.055;

function hex(L: number, C: number, h: number): string {
	return (
		'#' +
		fit(L, C, h)
			.map((v) =>
				Math.round(clamp01(encode(v)) * 255)
					.toString(16)
					.padStart(2, '0')
			)
			.join('')
	);
}

function build(spec: Spec, hues: { accent: number; chrome: number }): Record<string, string> {
	return Object.fromEntries(
		Object.entries(spec).map(([name, [L, C]]) => [
			name,
			hex(L, C, ACCENT_TOKENS.has(name) ? hues.accent : hues.chrome)
		])
	);
}

function css(): string {
	const out: string[] = [];
	for (const [theme, hues] of Object.entries(THEMES)) {
		// Compound, not descendant: `dark` and `data-theme` both live on <html>.
		for (const [mode, spec] of [
			['', LIGHT],
			['.dark', DARK]
		] as const) {
			const ramp = build(spec, hues);
			out.push(`${mode}[data-theme='${theme}'] {`);
			for (const [name, value] of Object.entries(ramp)) out.push(`\t--c-${name}: ${value};`);
			out.push('}\n');
		}
	}
	return out.join('\n');
}

function report(): string {
	const rows: string[] = [];
	let failures = 0;
	for (const [theme, hues] of Object.entries(THEMES)) {
		for (const [mode, spec] of [
			['light', LIGHT],
			['dark', DARK]
		] as const) {
			const ramp = build(spec, hues);
			for (const [fg, bg, min] of PAIRS) {
				const ratio = contrast(ramp[fg], ramp[bg]);
				const ok = ratio >= min;
				if (!ok) failures++;
				rows.push(
					`${ok ? 'ok  ' : 'FAIL'} ${theme.padEnd(9)} ${mode.padEnd(6)} ${fg.padEnd(12)} on ${bg.padEnd(10)} ${ratio.toFixed(2)} (min ${min})`
				);
			}
		}
	}
	return (
		rows.filter((r) => r.startsWith('FAIL')).join('\n') + `\n${failures} failing of ${rows.length}`
	);
}

if (import.meta.main) {
	console.log(process.argv.includes('--report') ? report() : css());
}
