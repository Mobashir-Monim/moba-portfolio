import { expect, test } from 'bun:test';
import { canonical, graph, ldJson, PERSON, robots, sitemap, SITE_URL } from './seo';
import { nodes } from './tree';

type Graph = { '@context': string; '@graph': Record<string, unknown>[] };

function nodesOf(value: object): Record<string, unknown>[] {
	return (value as Graph)['@graph'];
}

function typed(value: object, type: string): Record<string, unknown> | undefined {
	return nodesOf(value).find((entry) => entry['@type'] === type);
}

/** Walks a graph, calling back on every object in it however deeply nested. */
function walk(value: unknown, visit: (entry: Record<string, unknown>) => void): void {
	if (Array.isArray(value)) for (const item of value) walk(item, visit);
	else if (value && typeof value === 'object') {
		visit(value as Record<string, unknown>);
		for (const item of Object.values(value)) walk(item, visit);
	}
}

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

/**
 * The whole reason 2.12 exists: 2.7 emitted a standalone, anonymous `Person` per page, so a
 * crawler saw one person per URL. Every page has to name the same two nodes or it is not a graph.
 */
test('every page carries the one Person and the one WebSite', () => {
	for (const page of [graph(), ...Object.values(nodes).map((node) => graph(node))]) {
		expect(typed(page, 'Person')?.['@id']).toBe(`${SITE_URL}/#person`);
		expect(typed(page, 'WebSite')?.['@id']).toBe(`${SITE_URL}/#website`);
		expect(typed(page, 'Person')?.name).toBe(PERSON);
	}
});

/**
 * A reference to an `@id` no node defines is a dangling edge: the consumer is told the project has
 * an author and given nowhere to look. A node defines an `@id` when it carries a `@type` beside
 * it; a bare `{'@id': ...}` is the reference form.
 */
test('no page references an @id it does not also define', () => {
	for (const node of [undefined, ...Object.values(nodes)]) {
		const page = graph(node);
		const defined = new Set<string>();
		const used = new Set<string>();

		walk(page, (entry) => {
			const id = entry['@id'];
			if (typeof id !== 'string') return;
			used.add(id);
			if (entry['@type']) defined.add(id);
		});

		for (const id of used)
			expect({ page: node?.id ?? '/', id, defined: defined.has(id) }).toEqual({
				page: node?.id ?? '/',
				id,
				defined: true
			});
	}
});

/** One organization, one `@id`. Brac University is an employer and the degree institution. */
test('an organization has one id and one type however the site reaches it', () => {
	const seen = new Map<string, unknown>();

	walk(graph(nodes['bsc-computer-science']), (entry) => {
		const id = entry['@id'];
		if (typeof id !== 'string' || !id.startsWith(`${SITE_URL}/#org-`)) return;
		// Same id, same claim. Two types for one organization is the drift this catches.
		if (seen.has(id)) expect(entry['@type']).toBe(seen.get(id) as string);
		seen.set(id, entry['@type']);
	});

	// Reached through `alumniOf`, through `hasCredential`'s `recognizedBy`, and through `worksFor`.
	expect(seen.get(`${SITE_URL}/#org-bracu`)).toBe('EducationalOrganization');
});

test('the breadcrumb walks the href and ends on the page itself', () => {
	const trail = typed(graph(nodes['bsc-computer-science']), 'BreadcrumbList');
	const items = trail!.itemListElement as { position: number; item: string }[];

	expect(items.map((item) => item.item)).toEqual([
		`${SITE_URL}/`,
		`${SITE_URL}/attainments`,
		`${SITE_URL}/attainments/degrees`,
		`${SITE_URL}/attainments/degrees/bsc-computer-science`
	]);

	// The root has no trail of its own, and a one-item breadcrumb is noise.
	expect(typed(graph(), 'BreadcrumbList')).toBeUndefined();
});

test('every node breadcrumb starts at the root, ends on itself, and is positioned from one', () => {
	for (const node of Object.values(nodes)) {
		const items = typed(graph(node), 'BreadcrumbList')!.itemListElement as {
			position: number;
			item: string;
		}[];
		expect(items.map((item) => item.position)).toEqual(items.map((_, index) => index + 1));
		expect(items[0].item).toBe(`${SITE_URL}/`);
		expect(items.at(-1)!.item).toBe(canonical(node.href));
		// Every segment of every href on this site is a node, so no trail has a gap in it.
		expect(items.length).toBe(node.href.split('/').filter(Boolean).length + 1);
	}
});

test('an index folder is a CollectionPage listing exactly its children', () => {
	const page = typed(graph(nodes.projects), 'CollectionPage');
	const list = page!.mainEntity as { numberOfItems: number; itemListElement: { url: string }[] };

	expect(list.numberOfItems).toBe(nodes.projects.children!.length);
	expect(list.itemListElement.map((item) => item.url)).toEqual(
		nodes.projects.children!.map((id) => canonical(nodes[id].href))
	);
});

test('every node type resolves to the type that describes it', () => {
	const typesOf = (id: string) => nodesOf(graph(nodes[id])).map((entry) => entry['@type']);

	// The Person is the entity `/about` is about, and it is in the graph already.
	expect(typesOf('about')).toEqual(['Person', 'WebSite', 'BreadcrumbList']);
	// A CV is a page about a person, and the person is the one already in the graph.
	expect(typesOf('resume')).toContain('ProfilePage');
	expect(typesOf('bsc-computer-science')).toContain('EducationalOccupationalCredential');
	expect(typesOf('certified-scrum-master')).toContain('EducationalOccupationalCredential');
	expect(typesOf('blockchain-land-registry')).toContain('ScholarlyArticle');
	expect(typesOf('projects')).toContain('CollectionPage');
	expect(typesOf('busso')).toContain('CreativeWork');
	// An experience page is the employer; the employment is a dated role on the Person.
	expect(typesOf('gymrevenue-software-engineer')).toContain('Organization');
});

/** `worksFor` bare is a present-tense claim. A finished job needs the dates that say otherwise. */
test('every job is a dated role and only the current one lacks an end', () => {
	const roles = typed(graph(), 'Person')!.worksFor as {
		'@type': string;
		startDate: string;
		endDate?: string;
	}[];

	expect(roles.length).toBeGreaterThan(1);
	expect(roles.every((role) => role['@type'] === 'OrganizationRole')).toBe(true);
	expect(roles.every((role) => /^\d{4}-\d{2}$/.test(role.startDate))).toBe(true);
	expect(roles.filter((role) => !role.endDate).length).toBe(1);
});

/** The co-author who is me is the same person as everywhere else, or the graph gained a twin. */
test('a publication credits the site owner by reference and everyone else by name', () => {
	const authors = typed(graph(nodes['blockchain-land-registry']), 'ScholarlyArticle')!
		.author as Record<string, unknown>[];

	expect(authors.filter((author) => author['@id'] === `${SITE_URL}/#person`).length).toBe(1);
	expect(authors.some((author) => author['@type'] === 'Person' && author.name !== PERSON)).toBe(
		true
	);
});

/** 2.7 derived `modified` per node and then dropped it on the floor. */
test('every page whose entity is a dated thing carries the tree date', () => {
	for (const node of Object.values(nodes)) {
		// `/about` is the Person, and an experience page is the employer. Neither is dated.
		if (node.type === 'about' || node.type === 'experience') continue;
		expect(nodesOf(graph(node)).at(-1)!.dateModified).toBe(node.modified);
	}
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
