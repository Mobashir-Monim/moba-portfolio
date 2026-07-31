import { describe, expect, test } from 'bun:test';
import { about } from './content/about';
import { OS_NAME, OS_VERSION } from './os';
import { PERSON } from './seo';

/**
 * The share card, held to the strings it is a picture of.
 *
 * `scripts/og.svg` is hand-drawn, and `static/og.png` is baked from it by the recipe in its own
 * `<desc>`. That is two copies of every word on the card and nothing in the build reads either,
 * so a rename lands everywhere except here: the card shipped a whole phase reading `Mnemos`,
 * in the old default dress, while `Head.svelte` was already promising `mobOS` in `og:image:alt`.
 *
 * What is checkable in text is the wording. The PNG cannot be, so the SVG stands in for it and
 * the file says to re-bake. The dress cannot be either, since a hex here is a token value copied
 * by hand and comparing it to `app.css` would only prove the copy was taken, not that the right
 * block was read.
 */

const svg = await Bun.file(new URL('../../scripts/og.svg', import.meta.url)).text();

/** Text nodes only. A `<title>`, a `<desc>`, and every `<text>` the card draws. */
const words = svg
	.replace(/<!--[\s\S]*?-->/g, '')
	.replace(/<style>[\s\S]*?<\/style>/g, '')
	.replace(/<[^>]*>/g, '\n')
	.split('\n')
	.map((line) => line.trim())
	.filter(Boolean);

describe('the share card says what the site says', () => {
	test('the wordmark is the OS name, not whatever it was called last', () => {
		expect(words).toContain(OS_NAME);
	});

	test('the version line matches the OS version', () => {
		expect(words).toContain(`Version ${OS_VERSION}`);
	});

	test.each([
		['the person', PERSON],
		['the title', about.title]
	])('%s on the card is the one `og:image:alt` promises', (_, value) => {
		expect(words).toContain(value);
	});
});

describe('the card can be baked at all', () => {
	/*
	 * An XML comment may not contain two consecutive hyphens, which a token name is made of. Get
	 * that wrong and Chrome screenshots its own parser error page: the bake reports bytes written
	 * and the card ships as a red box of error text. It looks exactly like a successful bake.
	 */
	test('no comment carries a double hyphen', () => {
		const offenders = [...svg.matchAll(/<!--[\s\S]*?-->/g)]
			.map((m) => m[0])
			.filter((comment) => comment.slice(4, -3).includes('--'));
		expect(offenders).toEqual([]);
	});

	test('the font it sets the wordmark in is on disk', async () => {
		const src = svg.match(/url\('([^']+\.woff2)'\)/)?.[1];
		expect(src).toBeString();
		const file = Bun.file(new URL(`../../scripts/${src}`, import.meta.url));
		expect(await file.exists()).toBe(true);
	});

	test('the baked PNG is there for `og:image` to point at', async () => {
		expect(await Bun.file(new URL('../../static/og.png', import.meta.url)).exists()).toBe(true);
	});
});
