import { Glob } from 'bun';
import { describe, expect, test } from 'bun:test';

/**
 * The reduced-motion contract.
 *
 * Almost all of it is one blanket rule in `app.css`, and a blanket rule is exactly the kind of
 * thing that looks permanent and is not: it holds until something animates from JavaScript, which
 * the media query cannot see. So the rule itself is asserted here, and so are the two escape
 * hatches out of it.
 *
 * A Svelte `transition:` directive is the first, and the reason is that it has two compilations. A
 * transition that returns a `css` function becomes a real CSS animation and the blanket rule does
 * reach it; one that returns a `tick` function runs in script and the rule reaches nothing. Which
 * of the two a directive is cannot be read at the call site, so the only safe rule is that a
 * component with a directive also asks `prefersReducedMotion` and hands over a zero. `WindowFrame`
 * is the only one that does today, which is precisely why this is worth holding: the next one will
 * be written by copying a component that had no directive to copy the check from.
 *
 * `scrollIntoView({ behavior: 'smooth' })` is the second, and it is the sharper of the two because
 * it looks like it obeys CSS and does not. The option overrides `scroll-behavior` rather than
 * deferring to it, so the `scroll-behavior: auto !important` in the blanket rule buys nothing
 * against it. `Terminal.svelte` already calls `scrollIntoView`, one argument away from being wrong.
 *
 * Reduced motion means instant, not slower, so nothing here accepts a shortened duration as a pass.
 */

const root = new URL('../', import.meta.url).pathname;

const sources = await Promise.all(
	[...new Glob('**/*.{svelte,ts,css}').scanSync(root)]
		.filter((path) => !path.endsWith('.test.ts'))
		.map(async (path) => [path, await Bun.file(root + path).text()] as const)
);

/**
 * Both searches are for something written, not something described. Every file here documents its
 * own motion decisions in prose, and a comment naming the call it deliberately does not make would
 * otherwise read as making it.
 */
const stripped = (source: string) =>
	source
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/(?<!:)\/\/.*$/gm, '');

/** Directives live in markup, so the `<style>` block is not part of that search either. */
const markup = (source: string) => stripped(source).replace(/<style[\s\S]*?<\/style>/g, '');

/**
 * `transition:scale`, never `transition: width 200ms`. The directive takes an identifier with no
 * space after the colon; the CSS property never does.
 */
const DIRECTIVE = /(?:^|\s)(?:transition|in|out|animate):[a-zA-Z_$]/;

describe('the blanket rule', () => {
	const css = sources.find(([path]) => path === 'app.css')?.[1] ?? '';
	const block = css.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/)?.[0] ?? '';

	test('exists', () => {
		expect(block).not.toBe('');
	});

	// Duration alone is half of it: a delay is the page still taking time over a change that has
	// already been asked to be instant.
	test.each([
		'animation-duration',
		'animation-delay',
		'animation-iteration-count',
		'transition-duration',
		'transition-delay',
		'scroll-behavior'
	])('caps %s', (property) => {
		expect(block).toContain(`${property}:`);
	});

	test('every declaration wins the cascade', () => {
		const declarations = [...block.matchAll(/^\t{2}[a-z-]+:.*$/gm)].map(([line]) => line.trim());
		expect(declarations.filter((line) => !line.includes('!important'))).toEqual([]);
	});
});

describe('motion the rule cannot reach', () => {
	test('a Svelte transition directive comes with the check', () => {
		const guilty = sources
			.filter(([, source]) => DIRECTIVE.test(markup(source)))
			.filter(([, source]) => !source.includes('prefersReducedMotion'))
			.map(([path]) => path);

		expect(guilty).toEqual([]);
	});

	test('the check is still worth having', () => {
		// If nothing uses a directive any more, the test above passes vacuously and stops meaning
		// anything. It should fail loudly and be deleted rather than quietly guard nothing.
		expect(sources.filter(([, source]) => DIRECTIVE.test(markup(source)))).not.toBeEmpty();
	});

	test('nothing scrolls smoothly from script', () => {
		const guilty = sources
			.filter(([, source]) => /behaviou?r\s*:\s*['"]smooth['"]/.test(stripped(source)))
			.map(([path]) => path);

		expect(guilty).toEqual([]);
	});
});
