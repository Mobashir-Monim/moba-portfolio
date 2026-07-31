import { describe, expect, test } from 'bun:test';
import { SKINS } from './appearance.svelte';
import { BRAND, BRAND_NAMES, CHROME, CHROME_NAMES } from './icons';

/**
 * The icon contract. Path data is hand-authored, so the failure mode is a typo that still
 * parses: a glyph that draws off canvas, a variant that silently repeats another skin's shape,
 * a skin added to the set with no icons behind it.
 *
 * Rendering cannot be asserted here, so this covers the three things that are checkable in
 * text: the map is complete, the syntax is legal, and the component still lists every skin.
 */

const icon = await Bun.file(new URL('./components/Icon.svelte', import.meta.url)).text();

/** SVG path commands, per the spec. Anything else means a stray character in the data. */
const LEGAL = /^M[\sMmLlHhVvCcSsQqTtAaZz\d.,\-+eE]*$/;

describe('chrome glyphs are skin-owned', () => {
	test('every glyph defines every skin, so a gap is a hole not a fallback', () => {
		const missing: string[] = [];
		for (const name of CHROME_NAMES) {
			for (const skin of SKINS) {
				if (!CHROME[name][skin]?.trim()) missing.push(`${name}/${skin}`);
			}
		}
		expect(missing).toEqual([]);
	});

	test('the set covers the chrome glyphs the spec names', () => {
		expect(CHROME_NAMES).toEqual([
			'folder',
			'folder-open',
			'document',
			'document-open',
			'close',
			'minimize',
			'chevron',
			'apps',
			'view-icon',
			'view-list',
			'view-column',
			'view-gallery',
			'app',
			'terminal',
			'sysinfo',
			'snake',
			'tiles',
			'mines',
			'calculator',
			'settings'
		]);
	});

	test('no two skins share a glyph, which would mean a copy-paste, not a variant', () => {
		const duplicates: string[] = [];
		for (const name of CHROME_NAMES) {
			const seen = new Set<string>();
			for (const skin of SKINS) {
				const d = CHROME[name][skin];
				if (seen.has(d)) duplicates.push(`${name}/${skin}`);
				seen.add(d);
			}
		}
		expect(duplicates).toEqual([]);
	});

	test('every path is legal syntax and starts at an absolute move', () => {
		const bad: string[] = [];
		for (const name of CHROME_NAMES) {
			for (const skin of SKINS) {
				if (!LEGAL.test(CHROME[name][skin])) bad.push(`${name}/${skin}`);
			}
		}
		expect(bad).toEqual([]);
	});

	/**
	 * Absolute coordinates only: relative segments would need a real path parser to place, and
	 * a typo big enough to matter almost always lands in an absolute pair. Catches `M9.5 5.5
	 * 165 12` where `16.5` was meant.
	 */
	test('no absolute coordinate escapes the 24-unit grid', () => {
		const strays: string[] = [];
		for (const name of CHROME_NAMES) {
			for (const skin of SKINS) {
				for (const [, command, args] of CHROME[name][skin].matchAll(
					/([MLHVCSQTA])([^MmLlHhVvCcSsQqTtAaZz]*)/g
				)) {
					// An arc's first five arguments are radii, rotation, and flags, not coordinates.
					const numbers = (args.match(/-?\d*\.?\d+/g) ?? []).map(Number);
					const coords = command === 'A' ? numbers.slice(5) : numbers;
					for (const n of coords) {
						if (n < 0 || n > 24) strays.push(`${name}/${skin}: ${command} ${n}`);
					}
				}
			}
		}
		expect(strays).toEqual([]);
	});
});

describe('brand marks are single-variant', () => {
	test('every mark carries a viewBox and a legal path', () => {
		const bad: string[] = [];
		for (const name of BRAND_NAMES) {
			const { box, d } = BRAND[name];
			if (!/^-?\d+ -?\d+ \d+ \d+$/.test(box)) bad.push(`${name}: viewBox is "${box}"`);
			if (!LEGAL.test(d)) bad.push(`${name}: illegal path data`);
		}
		expect(bad).toEqual([]);
	});

	test('a brand name never collides with a chrome name', () => {
		expect(BRAND_NAMES.filter((n) => (CHROME_NAMES as string[]).includes(n))).toEqual([]);
	});
});

/**
 * Icon.svelte lists the three variants as literal elements rather than looping the skin list,
 * because Svelte prunes CSS selectors it cannot match against static markup and a `class={skin}`
 * loop would drop the rules that select them. That trade means a fourth skin is a manual edit,
 * so it gets a test rather than a comment.
 */
describe('Icon.svelte tracks the skin list', () => {
	test('the component renders and selects a path for every skin', () => {
		const unhandled = SKINS.filter(
			(skin) => !icon.includes(`class="${skin}"`) || !icon.includes(`path.${skin}`)
		);
		expect(unhandled).toEqual([]);
	});

	test('nothing but the skins gets a variant path', () => {
		const rendered = [...icon.matchAll(/<path class="([\w-]+)"/g)].map(([, c]) => c);
		expect(rendered.sort()).toEqual([...SKINS].sort());
	});
});
