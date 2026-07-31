import { expect, test } from 'bun:test';
import { LIGHTHOUSE } from './lighthouse';

/**
 * The audit numbers System Info prints.
 *
 * `lighthouse.ts` is machine-written by `scripts/audit.ts` and read by exactly one component, so
 * nothing else on the way from the report to the screen ever looks at it. The category keys are
 * already held by the type system, since `SystemInfo.svelte` labels them through a
 * `Record<keyof typeof LIGHTHOUSE.scores, string>`, which is why nothing here re-checks those.
 *
 * What is left is the part a type cannot see: whether the values are scores at all, and whether
 * the window is still reading them rather than a number somebody typed in. That second one is the
 * whole reason 4.5 deferred this instead of shipping a hardcoded 100.
 */

test('every category carries a whole score in range', () => {
	const entries = Object.entries(LIGHTHOUSE.scores);
	expect(entries.length).toBe(4);
	for (const [key, score] of entries) {
		expect(Number.isInteger(score), `${key} is not a whole number`).toBe(true);
		expect(score, `${key} is out of range`).toBeGreaterThanOrEqual(0);
		expect(score, `${key} is out of range`).toBeLessThanOrEqual(100);
	}
});

test('the reading says what it is a reading of', () => {
	expect(LIGHTHOUSE.measured).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	expect(Number.isNaN(Date.parse(LIGHTHOUSE.measured))).toBe(false);
	expect(LIGHTHOUSE.route).toStartWith('/');
	expect(LIGHTHOUSE.preset.length).toBeGreaterThan(0);
});

/**
 * The one that matters. A score is the easiest number on the site to quietly improve by typing,
 * and the window's own copy promises nothing in it was. So the component has to reach these
 * through the generated module and must not contain a score-shaped literal of its own.
 */
test('System Info reads the generated module and writes no score itself', async () => {
	const src = await Bun.file(
		new URL('./components/apps/SystemInfo.svelte', import.meta.url)
	).text();

	expect(src).toInclude("from '$lib/lighthouse'");
	expect(src).toInclude('LIGHTHOUSE.scores');

	// `n / 100` is how a score reaches the screen, so any such literal in the source is one that
	// bypassed the module. The template's own `${score} / 100` is an interpolation, not a literal.
	const literals = src.match(/\b\d{1,3}\s*\/\s*100\b/g) ?? [];
	expect(literals).toEqual([]);
});
