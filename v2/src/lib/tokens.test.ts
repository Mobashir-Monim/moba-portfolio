import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync } from 'node:fs';
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
const html = await Bun.file(new URL('../app.html', import.meta.url)).text();
const staticDir = new URL('../../static/', import.meta.url);

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
