/**
 * Emits the four theme blocks for app.css and reports the WCAG contrast of every
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

/** Per-theme accent hue, in OKLCH degrees. Names track what stores an image. */
const THEMES = {
	ferrite: 34, // warm red, core-memory rust
	phosphor: 148, // CRT green
	halide: 248, // cool blue, silver-halide film
	selenium: 300 // violet, selenium drum
} as const;

/** Lightness and chroma per token. Hue comes from the theme. */
type Spec = Record<string, [L: number, C: number]>;

const DARK: Spec = {
	'surface-0': [0.155, 0.014],
	'surface-1': [0.205, 0.014],
	'surface-2': [0.255, 0.014],
	'surface-3': [0.125, 0.014],
	'fg-1': [0.965, 0.008],
	'fg-2': [0.815, 0.008],
	'fg-3': [0.705, 0.008],
	line: [0.33, 0.016],
	'line-strong': [0.575, 0.02],
	accent: [0.72, 0.145],
	'accent-hover': [0.8, 0.13],
	'on-accent': [0.16, 0.03],
	select: [0.52, 0.15],
	'on-select': [0.985, 0.01],
	focus: [0.76, 0.15]
};

const LIGHT: Spec = {
	'surface-0': [0.865, 0.012],
	'surface-1': [0.99, 0.006],
	'surface-2': [0.945, 0.01],
	'surface-3': [1.0, 0.0],
	'fg-1': [0.23, 0.012],
	'fg-2': [0.44, 0.012],
	'fg-3': [0.52, 0.012],
	line: [0.855, 0.014],
	'line-strong': [0.55, 0.018],
	accent: [0.5, 0.15],
	'accent-hover': [0.43, 0.15],
	'on-accent': [0.99, 0.005],
	select: [0.5, 0.15],
	'on-select': [0.99, 0.005],
	focus: [0.5, 0.15]
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
	['accent', 'surface-2', 3],
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

function build(spec: Spec, hue: number): Record<string, string> {
	return Object.fromEntries(Object.entries(spec).map(([name, [L, C]]) => [name, hex(L, C, hue)]));
}

function css(): string {
	const out: string[] = [];
	for (const [theme, hue] of Object.entries(THEMES)) {
		// Compound, not descendant: `dark` and `data-theme` both live on <html>.
		for (const [mode, spec] of [
			['', LIGHT],
			['.dark', DARK]
		] as const) {
			const ramp = build(spec, hue);
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
	for (const [theme, hue] of Object.entries(THEMES)) {
		for (const [mode, spec] of [
			['light', LIGHT],
			['dark', DARK]
		] as const) {
			const ramp = build(spec, hue);
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
