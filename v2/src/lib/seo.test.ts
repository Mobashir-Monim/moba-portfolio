import { expect, test } from 'bun:test';
import { canonical, jsonLd, ldJson, robots, sitemap, SITE_URL } from './seo';
import { nodes } from './tree';

test('canonical is absolute for the root and for a node href', () => {
	expect(canonical('/')).toBe(`${SITE_URL}/`);
	expect(canonical('/projects/busso')).toBe(`${SITE_URL}/projects/busso`);
});

/** The escape is the point: a `<` that reaches a `<script>` body unescaped closes the tag. */
test('ldJson escapes every angle bracket and stays valid JSON', () => {
	const out = ldJson({ name: '</script><img onerror=alert(1)>' });
	expect(out).not.toInclude('<');
	expect(JSON.parse(out).name).toBe('</script><img onerror=alert(1)>');
});

test('jsonLd covers the types that are things and skips the ones that are not', () => {
	const person = jsonLd(nodes.about) as { '@type': string; sameAs: string[] };
	expect(person['@type']).toBe('Person');
	// mailto: is `email`, not a profile. A `sameAs` pointing at an inbox is a wrong claim.
	expect(person.sameAs.every((href) => href.startsWith('http'))).toBe(true);

	const project = Object.values(nodes).find((node) => node.type === 'project');
	expect((jsonLd(project!) as { '@type': string })['@type']).toBe('CreativeWork');

	const publication = Object.values(nodes).find((node) => node.type === 'publication');
	expect((jsonLd(publication!) as { '@type': string })['@type']).toBe('ScholarlyArticle');

	expect(jsonLd(nodes.projects)).toBeUndefined();
	const degree = Object.values(nodes).find((node) => node.type === 'degree');
	expect(jsonLd(degree!)).toBeUndefined();
});

/**
 * The sitemap and the route table are both the tree (2.6), so the only way they drift is if this
 * function stops walking it. Nothing else would notice: a short sitemap still validates.
 */
test('sitemap lists the root and every node exactly once, absolute', () => {
	const xml = sitemap();
	const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

	expect(new Set(locs).size).toBe(locs.length);
	expect(locs.length).toBe(Object.keys(nodes).length + 1);
	expect(locs).toContain(`${SITE_URL}/`);
	for (const node of Object.values(nodes)) expect(locs).toContain(`${SITE_URL}${node.href}`);
	expect(locs.every((loc) => loc.startsWith('https://'))).toBe(true);

	// No XML escaping is done, so nothing may need it.
	expect(locs.every((loc) => !/[&<>"']/.test(loc))).toBe(true);
	expect(
		[...xml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].every((m) => /^\d{4}-\d{2}$/.test(m[1]))
	).toBe(true);
});

test('robots names the sitemap absolutely and blocks nothing', () => {
	const text = robots();
	expect(text).toInclude(`Sitemap: ${SITE_URL}/sitemap.xml`);
	// A `Disallow:` with a path would be a rule; bare, it is the explicit allow-everything.
	expect(text).not.toMatch(/^Disallow: \S/m);
});
