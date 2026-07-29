import { describe, expect, test } from 'bun:test';
import { contrast } from './contrast';

/**
 * The token contract, enforced against app.css itself rather than against a copy of it.
 *
 * "Colour contrast passes WCAG AA in every one of the themes, in both dark and light" is a
 * non-negotiable in CLAUDE.md. Eyeballing 24 skin/theme/mode combinations is not a control,
 * so this parses the real stylesheet and checks every pair that carries text or meaning.
 *
 * Failures are collected into a list and asserted empty, so a break names every offending pair
 * and its measured ratio instead of stopping at the first one.
 */

const css = await Bun.file(new URL('../app.css', import.meta.url)).text();

const SKINS = ['modern', 'retro', 'glass'] as const;
const THEMES = ['ferrite', 'phosphor', 'halide', 'selenium'] as const;
const MODES = ['light', 'dark'] as const;

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
	'--c-focus'
];

/**
 * Text pairs need 4.5:1 (WCAG 1.4.3 AA, normal text). Non-text pairs carry meaning without
 * carrying letterforms, so they need 3:1 (1.4.11). `--c-fg-3` is muted body copy and never
 * sits on the desktop ground, so `surface-0` is not one of its backgrounds.
 */
const PAIRS: [fg: string, bg: string, min: number][] = [
	...(['surface-0', 'surface-1', 'surface-2', 'surface-3'] as const).flatMap(
		(bg) =>
			[
				['fg-1', bg, 4.5],
				['fg-2', bg, 4.5]
			] as [string, string, number][]
	),
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
				if (/#[0-9a-f]{3,8}\b/i.test(value)) literals.push(`${skin} ${name}: ${value}`);
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
