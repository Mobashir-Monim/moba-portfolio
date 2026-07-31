import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync } from 'node:fs';
import { contrast } from './contrast';
import { inks, SLOTS as WALL_SLOTS, bands } from './wallpapers/bands';
import { SHADE_STOPS } from '../../scripts/gen-palette';

/**
 * The token contract, enforced against app.css itself rather than against a copy of it.
 *
 * "Colour contrast passes WCAG AA in every one of the themes, in both dark and light" is a
 * non-negotiable in the spec. Eyeballing 24 skin/theme/mode combinations is not a control,
 * so this parses the real stylesheet and checks every pair that carries text or meaning.
 *
 * Failures are collected into a list and asserted empty, so a break names every offending pair
 * and its measured ratio instead of stopping at the first one.
 */

const css = await Bun.file(new URL('../app.css', import.meta.url)).text();
const html = await Bun.file(new URL('../app.html', import.meta.url)).text();
const boot = await Bun.file(new URL('./components/Boot.svelte', import.meta.url)).text();
const wallpaper = await Bun.file(new URL('./components/Wallpaper.svelte', import.meta.url)).text();
const staticDir = new URL('../../static/', import.meta.url);
/** The art is inlined rather than fetched, so it is source rather than a static asset. */
const drawnDir = new URL('./wallpapers/', import.meta.url);

const SKINS = ['modern', 'retro', 'glass'] as const;
const THEMES = ['ferrite', 'phosphor', 'cyanotype', 'anthotype'] as const;
const MODES = ['light', 'dark'] as const;
/** The slots a wallpaper's folder actually fills, in the order the scene draws them. */
function slotsOf(dir: URL, name: string): string[] {
	const files = readdirSync(new URL(`${name}/`, dir));
	return WALL_SLOTS.filter((slot) => files.includes(`${slot}.svg`));
}

/** Every drawn wallpaper, which is every folder of inlined art and nothing else. */
const DRAWN = readdirSync(drawnDir, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name);

/** How long a drawn scene's ink ramp has to be, read off the folder it ships. */
const rampLength = (name: string) => inks(slotsOf(drawnDir, name).length);

/** `--name: value;` pairs from the block opened by `selector` at the start of a line. */
function block(selector: string): Record<string, string> {
	const open = new RegExp(`^${selector.replace(/[.[\]']/g, '\\$&')} \\{$`, 'm');
	const start = css.search(open);
	if (start === -1) throw new Error(`app.css has no \`${selector}\` block`);
	const body = css.slice(start, css.indexOf('\n}', start));
	const out: Record<string, string> = {};
	for (const [, name, value] of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[name] = value.trim();
	return out;
}

const palette = (theme: string, mode: (typeof MODES)[number]) =>
	block(`${mode === 'dark' ? '.dark' : ''}[data-theme='${theme}']`);

const skinTokens = (skin: string) => block(`[data-skin='${skin}']`);

const COLOUR_TOKENS = [
	'--c-surface-0',
	'--c-surface-1',
	'--c-surface-2',
	'--c-surface-3',
	'--c-fg-1',
	'--c-fg-2',
	'--c-fg-3',
	'--c-line',
	'--c-line-strong',
	'--c-accent',
	'--c-accent-hover',
	'--c-on-accent',
	'--c-select',
	'--c-on-select',
	'--c-focus',
	...SHADE_STOPS.map((stop) => `--c-shade-${stop}`)
];

/**
 * Text pairs need 4.5:1 (WCAG 1.4.3 AA, normal text). Non-text pairs carry meaning without
 * carrying letterforms, so they need 3:1 (1.4.11).
 *
 * `--c-fg-3` was exempt from `surface-0` here until 6.2, on the stated grounds that muted body
 * copy never sits on the desktop ground. The exemption was false and this file is the reason it
 * survived: a plain content route paints `surface-0` on `html` and puts the breadcrumb and every
 * content header's meta line straight onto it, at 4.06:1, on 45 of 46 routes. axe found it; this
 * list had excused it. One token, two contexts, and `surface-0` is the page ground as much as it
 * is the desktop's.
 *
 * The lesson generalises past this one pair: an exemption written as a sentence about intent is
 * only as true as the call sites, and nothing here reads the call sites.
 */
const PAIRS: [fg: string, bg: string, min: number][] = [
	...(['surface-0', 'surface-1', 'surface-2', 'surface-3'] as const).flatMap(
		(bg) =>
			[
				['fg-1', bg, 4.5],
				['fg-2', bg, 4.5],
				['fg-3', bg, 4.5]
			] as [string, string, number][]
	),
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
	['focus', 'surface-3', 3],
	// The shade contract, and the reason the ramp splits where it does. 50 to 400 are background
	// stops and must carry body copy; 600 to 950 are foreground stops and must be readable on
	// every surface a window is made of; 500 is neither, so it is held to 3:1 and belongs on a
	// rule, an icon, or a meter fill rather than under text. `surface-0` is out of the text half
	// for the same reason `fg-3` is: it is the desktop ground, and no text stop sits on it.
	...[50, 100, 200, 300, 400].map((s) => ['fg-1', `shade-${s}`, 4.5] as [string, string, number]),
	...[600, 700, 800, 900, 950].flatMap((s) =>
		(['surface-1', 'surface-2', 'surface-3'] as const).map(
			(bg) => [`shade-${s}`, bg, 4.5] as [string, string, number]
		)
	),
	['shade-500', 'surface-1', 3],
	['shade-500', 'surface-2', 3],
	['shade-500', 'surface-3', 3]
];

describe('theme blocks own colour', () => {
	test('every theme defines every colour token as hex, in both polarities', () => {
		const missing: string[] = [];
		for (const theme of THEMES) {
			for (const mode of MODES) {
				const ramp = palette(theme, mode);
				for (const token of COLOUR_TOKENS) {
					if (!/^#[0-9a-f]{6}$/.test(ramp[token] ?? '')) {
						missing.push(`${theme} ${mode} ${token} = ${ramp[token] ?? '(unset)'}`);
					}
				}
			}
		}
		expect(missing).toEqual([]);
	});

	test('a theme never sets a shape token', () => {
		const strays: string[] = [];
		for (const theme of THEMES) {
			for (const mode of MODES) {
				for (const name of Object.keys(palette(theme, mode))) {
					if (!name.startsWith('--c-')) strays.push(`${theme} ${mode} ${name}`);
				}
			}
		}
		expect(strays).toEqual([]);
	});

	test('every theme passes WCAG AA on every pair, in both polarities', () => {
		const failures: string[] = [];
		for (const theme of THEMES) {
			for (const mode of MODES) {
				const ramp = palette(theme, mode);
				for (const [fg, bg, min] of PAIRS) {
					const ratio = contrast(ramp[`--c-${fg}`], ramp[`--c-${bg}`]);
					if (ratio < min) {
						failures.push(
							`${theme} ${mode}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1`
						);
					}
				}
			}
		}
		expect(failures).toEqual([]);
	});
});

/**
 * The shade ramp is a ramp, which is a stronger claim than "eleven colours are declared". Two
 * things make it one, and neither is implied by the contrast pairs above: it has to be ordered,
 * and its two polarities have to run in opposite directions, because the whole reason it is
 * semantic rather than absolute is so a call site never writes a `dark:` variant to flip an index.
 */
describe('the shade ramp', () => {
	/** Monotone in relative luminance. `contrast` against black is strictly increasing in it. */
	const level = (hex: string) => contrast(hex, '#000000');

	test('each ramp is strictly ordered, away from its own ground in both polarities', () => {
		const wrong: string[] = [];
		for (const theme of THEMES) {
			for (const mode of MODES) {
				const ramp = palette(theme, mode);
				const levels = SHADE_STOPS.map((stop) => level(ramp[`--c-shade-${stop}`]));
				for (let i = 1; i < levels.length; i++) {
					// Light mode darkens as the index rises, dark mode lightens. Either way the ramp
					// is walking away from the ground, which is what the index is supposed to mean.
					const ordered = mode === 'dark' ? levels[i] > levels[i - 1] : levels[i] < levels[i - 1];
					if (!ordered) {
						wrong.push(
							`${theme} ${mode}: shade-${SHADE_STOPS[i]} does not continue the ramp past shade-${SHADE_STOPS[i - 1]}`
						);
					}
				}
			}
		}
		expect(wrong).toEqual([]);
	});

	test('600 is the accent and 700 is its hover, so the ramp continues the palette', () => {
		const drift: string[] = [];
		for (const theme of THEMES) {
			for (const mode of MODES) {
				const ramp = palette(theme, mode);
				for (const [stop, token] of [
					[600, '--c-accent'],
					[700, '--c-accent-hover']
				] as const) {
					if (ramp[`--c-shade-${stop}`] !== ramp[token]) {
						drift.push(
							`${theme} ${mode}: shade-${stop} is ${ramp[`--c-shade-${stop}`]}, ${token} is ${ramp[token]}`
						);
					}
				}
			}
		}
		expect(drift).toEqual([]);
	});

	test('every stop reaches Tailwind, so the ramp is usable as a utility', () => {
		const bridge = block('@theme inline');
		for (const stop of SHADE_STOPS) {
			expect(bridge[`--color-shade-${stop}`]).toBe(`var(--c-shade-${stop})`);
		}
	});
});

describe('skin blocks own shape', () => {
	const reference = Object.keys(skinTokens('modern')).sort();

	test('the shape contract is non-trivial', () => {
		expect(reference.length).toBeGreaterThan(20);
	});

	test('every skin defines exactly the same token set, so a gap is a hole not a fallback', () => {
		for (const skin of SKINS) expect(Object.keys(skinTokens(skin)).sort()).toEqual(reference);
	});

	test('a skin never hardcodes a colour, it references a theme token', () => {
		const literals: string[] = [];
		for (const skin of SKINS) {
			for (const [name, value] of Object.entries(skinTokens(skin))) {
				// Shadow recipes carry their own black alpha. That is a shape recipe, not a palette.
				if (name.startsWith('--elev-')) continue;
				// A bare keyword is the same defect as a hex, and the wallpaper is where one would
				// be reached for: an absolute black reads as depth in the light palettes and as
				// nothing at all in the dark ones.
				if (/#[0-9a-f]{3,8}\b|\b(black|white)\b/i.test(value)) {
					literals.push(`${skin} ${name}: ${value}`);
				}
			}
		}
		expect(literals).toEqual([]);
	});
});

/**
 * The accent budget is skin-owned and resolves to different theme tokens per skin, so these
 * are the pairs that genuinely vary across all 24 skin/theme/mode combinations.
 */
describe('accent budget across all 24 combinations', () => {
	/** Resolve a skin token of the exact form `var(--c-foo)`. Anything else is not a flat colour. */
	const flat = (value: string | undefined) => value?.match(/^var\((--c-[\w-]+)\)$/)?.[1];

	test('every skin points --ring at a resolvable theme token', () => {
		for (const skin of SKINS) expect(flat(skinTokens(skin)['--ring'])).toBeDefined();
	});

	test('the focus ring reaches 3:1 against every surface it can land on', () => {
		const failures: string[] = [];
		for (const skin of SKINS) {
			const ring = flat(skinTokens(skin)['--ring'])!;
			for (const theme of THEMES) {
				for (const mode of MODES) {
					const ramp = palette(theme, mode);
					for (const bg of ['--c-surface-0', '--c-surface-1', '--c-surface-2']) {
						const ratio = contrast(ramp[ring], ramp[bg]);
						if (ratio < 3) {
							failures.push(`${skin}/${theme}/${mode}: ring on ${bg} is ${ratio.toFixed(2)}:1`);
						}
					}
				}
			}
		}
		expect(failures).toEqual([]);
	});

	/**
	 * The info sidebar's heading is the one place outside the title bar where a skin may spend
	 * accent on text, so it is the one place that can quietly drop below the text threshold.
	 * `--c-accent` is only guaranteed 3:1 against a surface by the pair table above.
	 */
	test('the info sidebar heading reaches 4.5:1 on the panel it sits on', () => {
		const failures: string[] = [];
		for (const skin of SKINS) {
			const fg = flat(skinTokens(skin)['--sidebar-title-fg']);
			expect(fg).toBeDefined();
			for (const theme of THEMES) {
				for (const mode of MODES) {
					const ramp = palette(theme, mode);
					const ratio = contrast(ramp[fg!], ramp['--c-surface-2']);
					if (ratio < 4.5) {
						failures.push(
							`${skin}/${theme}/${mode}: --sidebar-title-fg is ${ratio.toFixed(2)}:1, needs 4.5:1`
						);
					}
				}
			}
		}
		expect(failures).toEqual([]);
	});

	test('title bar text reaches 4.5:1 on its own background', () => {
		const failures: string[] = [];
		const skipped: string[] = [];
		for (const skin of SKINS) {
			const tokens = skinTokens(skin);
			for (const [fgName, bgName] of [
				['--titlebar-fg', '--titlebar-bg'],
				['--titlebar-fg-idle', '--titlebar-bg-idle']
			]) {
				const fg = flat(tokens[fgName]);
				const bg = flat(tokens[bgName]);
				if (!fg || !bg) {
					// glass paints its title bar as a gradient over a color-mix, which needs a CSS
					// engine to resolve. Verified by eye in /styleguide, not here.
					skipped.push(`${skin} ${fgName} on ${bgName}`);
					continue;
				}
				for (const theme of THEMES) {
					for (const mode of MODES) {
						const ramp = palette(theme, mode);
						const ratio = contrast(ramp[fg], ramp[bg]);
						if (ratio < 4.5) {
							failures.push(
								`${skin}/${theme}/${mode}: ${fgName} on ${bgName} is ${ratio.toFixed(2)}:1`
							);
						}
					}
				}
			}
		}
		expect(failures).toEqual([]);
		// Only glass is allowed to be unresolvable. If another skin shows up here, the accent
		// budget has grown a hole the test cannot see.
		expect(skipped.every((s) => s.startsWith('glass'))).toBe(true);
	});
});

/**
 * The wallpaper axis. A wallpaper is geometry, a skin is how the scene is lit, and the ink ramp is
 * the one place the two meet, so this is where the meeting is checked.
 *
 * What sits on a band is the desktop icon's glyph, and nothing else: the label and the heading
 * carry a `--c-surface-1` chip, which the pair table above already guarantees. See the note in
 * Desktop.svelte for why that chip is not optional. A glyph is non-text, so 1.4.11's 3:1 is its
 * bar, and it is the whole of what these colours have to clear.
 */
describe('the wallpaper is a background, so it answers to the contrast contract', () => {
	/**
	 * `color-mix(in srgb, var(--c-a) N%, var(--c-b))`, resolved against one theme ramp. Both
	 *  sides are opaque hex, so a plain per-channel lerp is the whole of sRGB mixing.
	 */
	function mix(recipe: string, ramp: Record<string, string>): string {
		const m = recipe.match(/^color-mix\(in srgb, var\((--[\w-]+)\) (\d+)%, var\((--[\w-]+)\)\)$/);
		if (!m) throw new Error(`not a resolvable two-token sRGB mix: ${recipe}`);
		const [, a, pct, b] = m;
		const p = +pct / 100;
		const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
		const out = [0, 1, 2].map((i) => Math.round(ch(ramp[a], i) * p + ch(ramp[b], i) * (1 - p)));
		return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
	}

	/**
	 * One folder per wallpaper, named for the wallpaper, holding one file per slot named for the
	 * slot. That is the shape every wallpaper added from here on takes, and it is worth a test
	 * rather than a note because the failure mode is a slow one: a generator writes one file to the
	 * old flat path, nothing breaks, and the convention is half-kept from then on. Every plane needs
	 * a face, so `far`, `mid`, and `near` are the floor; reliefs are the scene's own business.
	 */
	test('every wallpaper is a folder of slot-named files, and every plane has a face', () => {
		const wrong: string[] = [];
		for (const entry of readdirSync(drawnDir, { withFileTypes: true })) {
			// The root holds this convention's own module beside the folders it describes.
			if (!entry.isDirectory()) {
				if (entry.name.endsWith('.ts')) continue;
				wrong.push(`lib/wallpapers/${entry.name} is a file, not a wallpaper folder`);
				continue;
			}
			const files = readdirSync(new URL(`${entry.name}/`, drawnDir));
			// `far` and `near` are the floor, not all three.
			//
			// `Wallpaper.svelte` argues for three planes, "because two have no middle: distance is
			// read from how many planes stand between the eye and the horizon". That argument is
			// about depth carried by *scale*, and it binds a landscape, where each plane is its own
			// subject at its own size. It does not bind a scene that spends one scale across every
			// plane and buys its depth from the ink ramp and the skin's haze instead, which
			// `circuit-bottom` and `hive` already do and which `circuit-streak` arrived as: one
			// drawing of wiring at two weights, exported as two layers.
			//
			// A back and a front is still a gap the eye can measure. One plane is not, and a folder
			// with a `mid` and no `far` is the half-kept convention this test exists to catch.
			for (const face of ['far', 'near']) {
				if (!files.includes(`${face}.svg`))
					wrong.push(`lib/wallpapers/${entry.name} has no ${face}.svg`);
			}
			for (const file of files) {
				if (file.startsWith(`${entry.name}-`)) {
					wrong.push(`lib/wallpapers/${entry.name}/${file} repeats its folder in its name`);
				}
			}
		}
		expect(wrong).toEqual([]);
	});

	/**
	 * A drawn wallpaper paints itself, so the thing that can silently break is the handoff rather
	 * than the file list: a band draws with `var(--wall-band-crest)` and `var(--wall-band-base)`,
	 * and if it is ever referenced through `url()` instead of inlined, those resolve in the band's
	 * own document, find nothing, and the band disappears. That failure is invisible in the source
	 * and total on the screen, so both halves are checked here: the file paints with the two tokens,
	 * and `Wallpaper.svelte` reaches it through a glob wide enough to include it.
	 */
	test('every drawn band paints with the band tokens and is reachable by the glob', async () => {
		const broken: string[] = [];
		// The one string that has to hold for the whole folder: a glob over the drawn root, eager,
		// as text. Any of the three missing and every band silently stops being inlined.
		const glob = wallpaper.match(
			/import\.meta\.glob\(\s*'\.\.\/wallpapers\/\*\/\*\.svg',\s*\{([^}]*)\}/
		);
		if (!glob) broken.push('Wallpaper.svelte does not glob the drawn wallpaper folder');
		else {
			for (const part of ["query: '?raw'", "import: 'default'", 'eager: true']) {
				if (!glob[1].includes(part)) broken.push(`the glob is not \`${part}\``);
			}
		}

		for (const name of DRAWN) {
			for (const slot of slotsOf(drawnDir, name)) {
				const path = `${name}/${slot}.svg`;
				const svg = await Bun.file(new URL(path, drawnDir)).text();
				for (const token of ['--wall-band-crest', '--wall-band-base']) {
					if (!svg.includes(`var(${token})`)) broken.push(`${path} does not paint with ${token}`);
				}
				// The id is scoped by nothing, unlike the file name, so it carries the wallpaper too.
				if (!svg.includes(`id="${name}-${slot}"`)) {
					broken.push(`${path} does not scope its gradient id`);
				}
			}
		}
		expect(broken).toEqual([]);
	});

	/** One ink stop as hex: either a shade token outright or a two-token mix of two of them. */
	function ink(
		name: string,
		i: number,
		mode: (typeof MODES)[number],
		ramp: Record<string, string>
	): string {
		const tokens = block(`${mode === 'dark' ? '.dark' : ''}[data-wallpaper='${name}']`);
		const recipe = tokens[`--wall-ink-${i}`];
		if (!recipe) throw new Error(`${name} ${mode} never declares --wall-ink-${i}`);
		const direct = recipe.match(/^var\((--c-shade-\d+)\)$/);
		return direct ? ramp[direct[1]] : mix(recipe, ramp);
	}

	/**
	 * The ink ramp answers to the same 3:1 the nine mask shades do, and for the same reason: the
	 * desktop's icon glyphs sit directly on it. `grove` reaches this on its own route, through nine
	 * ink stops rather than through the plane tokens, so `wallRamp` above says nothing about it.
	 *
	 * The failure this catches is specific. Take the ramp's full width instead of its background
	 * half and one end of the scene lands on a foreground stop, which is built to fail against
	 * `--c-fg-1`. The reversal then puts that end at the sky in one polarity and at the near forest
	 * in the other, so the glyphs go unreadable in exactly one of light and dark, which is the half
	 * nobody is looking at while they tune the other.
	 */
	test('a drawn ink ramp holds the icon glyph at 3:1, in all eight theme and polarity pairs', () => {
		const failures: string[] = [];
		for (const name of DRAWN) {
			for (const theme of THEMES) {
				for (const mode of MODES) {
					const ramp = palette(theme, mode);
					for (let i = 1; i <= rampLength(name); i++) {
						const ratio = contrast(ramp['--c-fg-1'], ink(name, i, mode, ramp));
						if (ratio < 3) {
							failures.push(`${name} ${theme}/${mode}: fg-1 on ink-${i} is ${ratio.toFixed(2)}:1`);
						}
					}
				}
			}
		}
		expect(failures).toEqual([]);
	});

	/**
	 * Depth is an ordering, and this is the one it has to be: palest at `1`, darkest at `9`, in both
	 * polarities. Absolute, not relative to the ground, because that is the whole reason the ink
	 * ramp exists rather than the bands reading `--c-shade-*` directly. Reading a landscape is
	 * reading that the near thing is darker than the far one, and it is darker at noon and at
	 * midnight; a scene that let the ramp's own polarity through would come out inside-out in dark,
	 * with the foreground the palest thing on the screen.
	 *
	 * Luminance rather than a mix of hue and lightness, because `950` in one polarity and `50` in
	 * the other are different colours and only their lightness is being claimed here.
	 */
	test('a drawn ink ramp runs palest to darkest in both polarities', () => {
		const failures: string[] = [];
		for (const name of DRAWN) {
			for (const theme of THEMES) {
				for (const mode of MODES) {
					const ramp = palette(theme, mode);
					// Contrast against black is monotone in luminance, so it orders without a second helper.
					const lit = Array.from({ length: rampLength(name) }, (_, i) =>
						contrast('#000000', ink(name, i + 1, mode, ramp))
					);
					lit.forEach((l, i) => {
						if (i > 0 && l >= lit[i - 1]) {
							failures.push(
								`${name} ${theme}/${mode}: ink-${i + 1} at ${l.toFixed(3)} is no darker than ink-${i} at ${lit[i - 1].toFixed(3)}`
							);
						}
					});
				}
			}
		}
		expect(failures).toEqual([]);
	});

	/**
	 * The chain the bands read the ink ramp through, checked against the folder each scene actually
	 * ships rather than against a table restating it. Each band's crest is the ink its predecessor
	 * ended on, which is what makes the bands one gradient instead of seven; a break in that chain
	 * is a hard edge in the wash that no band's silhouette accounts for.
	 *
	 * The length is the part that cannot be seen by looking, and it is the one the scenes no longer
	 * agree on: the ramp is as long as the art needs, so `app.css` has to declare exactly one stop
	 * per band plus the sky's two. One short and the foreground band reads a stop that was never
	 * declared, resolves to nothing, and paints black; one long and the ramp's darkest end is never
	 * spent, which is a scene quietly shallower than the one it was tuned as. Neither shows up
	 * anywhere but on the screen, so both are checked against the folder rather than a number.
	 */
	test('a drawn scene fills the ink chain end to end, one band per step', () => {
		const wrong: string[] = [];
		for (const name of DRAWN) {
			const chain = bands(slotsOf(drawnDir, name));
			let previous = 2;
			for (const { slot, crest, base } of chain) {
				if (crest !== previous)
					wrong.push(`${name}/${slot} starts at ink ${crest}, not ${previous}`);
				if (base !== crest + 1) wrong.push(`${name}/${slot} spans ink ${crest} to ${base}`);
				previous = base;
			}
			for (const mode of MODES) {
				const tokens = block(`${mode === 'dark' ? '.dark' : ''}[data-wallpaper='${name}']`);
				const declared = Object.keys(tokens).filter((t) => /^--wall-ink-\d+$/.test(t)).length;
				if (declared !== previous) {
					wrong.push(
						`${name} ${mode} declares ${declared} ink stops, and its chain ends at ${previous}`
					);
				}
			}
		}
		expect(wrong).toEqual([]);
	});

	/**
	 * The switch, which is the one thing a drawn scene cannot declare for itself. Every scene's
	 * bands are in the DOM at once so that changing wallpaper cannot flash, and each offers a
	 * `--wall-show-<name>` that only its own block in `app.css` answers. Unanswered, the scene is
	 * shipped, inlined, and invisible, with nothing anywhere to say why.
	 */
	test('every drawn scene is switched on by its own block', () => {
		const wrong: string[] = [];
		for (const name of DRAWN) {
			const tokens = block(`[data-wallpaper='${name}']`);
			if (tokens[`--wall-show-${name}`] !== 'flex') {
				wrong.push(`${name} never sets --wall-show-${name}: flex`);
			}
			if (!wallpaper.includes('var(--wall-show-{scene.name}, none)')) {
				wrong.push('Wallpaper.svelte does not offer --wall-show-<name>');
			}
		}
		expect(wrong).toEqual([]);
	});

	/**
	 * Every axis crosses the pre-paint boundary, and each one fails silently in its own way. A
	 * stale roster means the saved choice is rejected as unknown and the visitor who made it
	 * quietly gets the default back on the next load. A stale default means the site's dress
	 * depends on which copy of it the browser reached first.
	 *
	 * The `<html>` attributes are the third copy and the one with no other witness: they are what
	 * a visitor with JavaScript off sees, and nothing in a dev session ever reads them, because
	 * the script overwrites all three before the first paint. Drift there is invisible until a
	 * crawler or a reader with scripting disabled arrives dressed differently from everyone else.
	 *
	 * Appearance has only two copies. `auto` and `dark` both resolve to the same class, so there
	 * is no attribute for it to be a third.
	 */
	const AXES = [
		{ axis: 'skin', roster: 'SKINS', attr: 'data-skin' },
		{ axis: 'theme', roster: 'THEMES', attr: 'data-theme' },
		{ axis: 'wallpaper', roster: 'WALLPAPERS', attr: 'data-wallpaper' },
		{ axis: 'appearance', roster: 'APPEARANCES', attr: null }
	] as const;

	for (const { axis, roster, attr } of AXES) {
		test(`the allowed ${axis} values and the default are the same on every side of app.html`, async () => {
			const module = await Bun.file(new URL('./appearance.svelte.ts', import.meta.url)).text();
			// Whitespace-tolerant, because the rosters are long enough now that the formatter wraps
			// the call across four lines and a one-line pattern would fail on a reformat rather than
			// on a defect.
			const inScript = html.match(
				new RegExp(`pick\\(\\s*'mobos\\.${axis}',\\s*\\[([^\\]]+)\\],\\s*'([\\w-]+)'\\s*\\)`)
			);
			expect(inScript).not.toBeNull();

			const names = (s: string) => [...s.matchAll(/'([\w-]+)'/g)].map(([, v]) => v);
			const inModule = module.match(new RegExp(`${roster} = \\[([^\\]]+)\\]`))!;
			expect(names(inScript![1])).toEqual(names(inModule[1]));

			const fallback = module.match(new RegExp(`\\b${axis}: '([\\w-]+)'`))![1];
			expect(inScript![2]).toBe(fallback);

			if (attr) expect(html).toContain(`${attr}="${fallback}"`);
		});
	}
});

/**
 * The pre-paint script decides three display axes and, now, whether the boot sequence runs at
 * all. It cannot import, so its storage key and its attribute are copies of the ones
 * `Boot.svelte` reads and writes. A drift is invisible in the worst way: the boot screen would
 * simply play on every single load, forever, and nothing would error.
 */
describe('the boot flag crosses the pre-paint boundary intact', () => {
	test('the session key is the same string on both sides', () => {
		const inHtml = html.match(/sessionStorage\.getItem\('([^']+)'\)/)?.[1];
		const inComponent = boot.match(/const KEY = '([^']+)'/)?.[1];
		expect(inHtml).toBeDefined();
		expect(inComponent).toBe(inHtml);
	});

	test('the attribute set before paint is the one the component shows and clears on', () => {
		expect(html).toContain('el.dataset.boot');
		expect(boot).toContain(':global(html[data-boot])');
		expect(boot).toContain("removeAttribute('data-boot')");
	});
});

/**
 * Typography, and specifically the four-way duplication it creates.
 *
 * A web font is named in `app.css` twice, once in an `@font-face` and once in the skin that uses
 * it, and a third time in the preload map inside `app.html`, which cannot import. Nothing but a
 * test ties those together, and a stale preload is invisible: the page still renders, it just
 * fetches the wrong file or fetches nothing and falls back. So the parse below is the contract.
 */
describe('web fonts', () => {
	const FAMILY_TOKENS = ['--ff-ui', '--ff-body', '--ff-mono'] as const;

	/** Every `@font-face` in app.css, keyed by family name. */
	const faces = Object.fromEntries(
		[...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => {
			const family = body.match(/font-family:\s*'([^']+)'/)?.[1];
			if (!family) throw new Error('an @font-face in app.css declares no quoted font-family');
			return [
				family,
				{
					url: body.match(/src:\s*url\('([^']+)'\)/)?.[1] ?? '',
					display: body.match(/font-display:\s*([\w-]+);/)?.[1] ?? ''
				}
			];
		})
	);

	/** The preload map from the pre-paint script, `{ skin: url }`. */
	const preloads = Object.fromEntries(
		[
			...(html.match(/const SKIN_FONT = \{([^}]*)\}/)?.[1] ?? '').matchAll(/(\w+):\s*'([^']+)'/g)
		].map(([, skin, url]) => [skin, url])
	);

	/** Declared families this skin's family tokens actually reference. */
	const familiesUsedBy = (skin: string) =>
		Object.keys(faces).filter((family) =>
			FAMILY_TOKENS.some((token) =>
				new RegExp(`(^|,\\s*)'?${family}'?(\\s*,|$)`).test(skinTokens(skin)[token] ?? '')
			)
		);

	test('the parse found something, so a silent regex break cannot pass this suite', () => {
		expect(Object.keys(faces).length).toBeGreaterThan(0);
	});

	test('no font is shipped that no skin uses, and every used font has a system fallback', () => {
		const problems: string[] = [];
		const used = new Set(SKINS.flatMap(familiesUsedBy));
		for (const family of Object.keys(faces)) {
			if (!used.has(family)) problems.push(`${family} has an @font-face but no skin uses it`);
		}
		// Something has to render during the swap window, so the custom family is never alone.
		for (const skin of SKINS) {
			for (const token of FAMILY_TOKENS) {
				const stack = (skinTokens(skin)[token] ?? '').split(',').map((s) => s.trim());
				if (stack.length === 1 && faces[stack[0].replace(/'/g, '')]) {
					problems.push(`${skin} ${token} is a web font with nothing behind it`);
				}
			}
		}
		expect(problems).toEqual([]);
	});

	test('every font declares a font-display that cannot blank text', () => {
		// The default is `auto`, which most browsers treat as `block`: up to 3s of invisible text.
		const bad = Object.entries(faces)
			.filter(([, face]) => !['swap', 'fallback', 'optional'].includes(face.display))
			.map(([family, face]) => `${family}: font-display is ${face.display || '(unset)'}`);
		expect(bad).toEqual([]);
	});

	test('the preload map in app.html matches the skins and URLs in app.css', () => {
		// The map holds one URL per skin, so a skin on two web fonts would preload only one of
		// them and the comparison below would quietly agree. Rule that out first.
		for (const skin of SKINS) expect(familiesUsedBy(skin).length).toBeLessThan(2);

		const expected = Object.fromEntries(
			SKINS.flatMap((skin) => familiesUsedBy(skin).map((family) => [skin, faces[family].url]))
		);
		expect(preloads).toEqual(expected);
	});

	test('every declared font file, and a licence for it, exists in static/', () => {
		const missing = Object.values(faces)
			.map((face) => face.url)
			.filter((url) => !existsSync(new URL(`.${url}`, staticDir)));
		expect(missing).toEqual([]);

		// Self-hosting an OFL face requires shipping its licence. Fonts are only added here.
		const fonts = readdirSync(new URL('fonts/', staticDir));
		expect(fonts.some((f) => /licen|OFL/i.test(f))).toBe(true);
	});
});
