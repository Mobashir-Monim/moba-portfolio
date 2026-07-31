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
 * A Svelte `transition:` directive is the first, and it is not a hedge: Svelte 5 runs every one of
 * them through the Web Animations API, which Chrome's Animation domain reports as `WebAnimation`
 * beside the `CSSTransition` entries the same page produces. A stylesheet does not reach a WAAPI
 * animation at all, so `animation-duration: 1ms !important` buys exactly nothing against a
 * directive, and the only thing that caps one is the component asking `prefersReducedMotion` and
 * handing over a zero. `WindowFrame` is the only one that does today, which is precisely why this
 * is worth holding: the next one will be written by copying a component that had no directive to
 * copy the check from.
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

	/**
	 * Not reduced motion, but the same failure shape and it belongs with its neighbours: a wrong
	 * answer here changes nothing a compiler, a linter, or a test would notice, and only shows up as
	 * an animation quietly not happening.
	 *
	 * A Svelte 5 transition is local by default, so it plays only when the state change happened in
	 * its own block. Everything animated in this codebase lives in a component that a parent block
	 * adds and removes, which is the case local skips, and 2.14 was exactly that: the window's open
	 * and close played nothing for as long as the modifier was missing, while minimize and restore
	 * worked because those flip the `{#if}` directly. Weakening this is a real decision; make it on
	 * purpose and write down why.
	 */
	test('every transition directive is global', () => {
		const local = sources
			.flatMap(([path, source]) =>
				[
					...markup(source).matchAll(/(?:^|\s)((?:transition|in|out):[a-zA-Z_$][\w$]*(?:\|\w+)*)/g)
				].map(([, directive]) => `${path}: ${directive}`)
			)
			.filter((entry) => !entry.includes('|global'));

		expect(local).toEqual([]);
	});

	test('nothing scrolls smoothly from script', () => {
		const guilty = sources
			.filter(([, source]) => /behaviou?r\s*:\s*['"]smooth['"]/.test(stripped(source)))
			.map(([path]) => path);

		expect(guilty).toEqual([]);
	});

	/**
	 * Ledger #23, and the reason it is asserted rather than trusted: it had already come back.
	 *
	 * The old site put `transition-all duration-300` on `body` and most of its children, which
	 * animates layout properties and makes every state change a reflow. `CLAUDE.md` answers with a
	 * hard rule, "Transition specific properties. Never `transition-all`", and 6.7's walk found
	 * `transition: all` in the dock, the title bar, the window controls and the desktop icon.
	 *
	 * None of those was as bad as the original, since each sat on one small element rather than on
	 * `body`. That is exactly why it survived: nothing looked wrong, so nothing looked at it. A
	 * rule with no test is a comment.
	 *
	 * `all` is the only value forbidden. Listing several properties is the point, and a wrapped
	 * shorthand puts each on its own line, so the check is per line and matches the keyword rather
	 * than the declaration.
	 */
	test('no transition animates `all`', () => {
		const guilty = sources.flatMap(([path, source]) =>
			stripped(source)
				.split('\n')
				.map((line, i) => [line, i] as const)
				.filter(
					([line]) =>
						/\btransition-all\b/.test(line) ||
						/\btransition(-property)?\s*:\s*all\b/.test(line) ||
						// The wrapped shorthand: `transition:` on one line, `all …,` on the next.
						/^\s*all\s+var\(--dur|^\s*all\s+\d/.test(line)
				)
				.map(([line, i]) => `${path}:${i + 1} ${line.trim().slice(0, 60)}`)
		);

		expect(guilty).toEqual([]);
	});
});
