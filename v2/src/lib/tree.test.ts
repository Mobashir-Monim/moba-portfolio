import { describe, expect, test } from 'bun:test';
import { about } from './content/about';
import { caseStudies } from './content/case-studies';
import { experiences } from './content/experiences';
import { projectList, projects } from './content/projects';
import { byHref, caseStudyOf, childrenOf, node, nodes, root, summary } from './tree';

const all = Object.values(nodes);

describe('shape', () => {
	test('every child id resolves to a node', () => {
		for (const record of all)
			for (const child of record.children ?? []) expect(nodes[child]).toBeDefined();
	});

	test('root ids resolve', () => {
		for (const id of root) expect(nodes[id]).toBeDefined();
	});

	test('folders hold children and documents do not', () => {
		for (const record of all)
			if (record.kind === 'folder') expect(record.children).toBeDefined();
			else expect(record.children).toBeUndefined();
	});

	test('nothing lists itself as its own child', () => {
		for (const record of all) expect(record.children ?? []).not.toContain(record.id);
	});

	test('every node is reachable from the root', () => {
		const seen = new Set<string>();
		const walk = (id: string) => {
			if (seen.has(id)) return;
			seen.add(id);
			for (const child of nodes[id].children ?? []) walk(child);
		};
		root.forEach(walk);
		expect(seen.size).toBe(all.length);
	});
});

describe('routes', () => {
	test('every href is absolute and unique', () => {
		const hrefs = all.map((record) => record.href);
		for (const href of hrefs) expect(href).toMatch(/^\/[a-z0-9/-]*$/);
		expect(new Set(hrefs).size).toBe(hrefs.length);
	});

	test('a document href ends in its own id', () => {
		for (const record of all)
			if (record.kind === 'document') expect(record.href.endsWith(`/${record.id}`)).toBe(true);
	});
});

// The sidebar renders these directly, so a zero or a malformed date shows up on screen.
describe('filesystem details', () => {
	test('every node has a size, and a folder is at least as big as its contents', () => {
		for (const record of all) {
			expect(record.size).toBeGreaterThan(0);
			const contained = childrenOf(record.id).reduce((total, child) => total + child.size, 0);
			expect(record.size).toBeGreaterThanOrEqual(contained);
		}
	});

	test('every modified date is a sortable `YYYY-MM`', () => {
		for (const record of all) expect(record.modified).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
	});
});

describe('derivation', () => {
	test('every project is a document under Projects, behind the studies folder', () => {
		const listed = nodes.projects.children ?? [];
		expect(listed).toEqual(['case-studies', ...Object.keys(projects)]);
		for (const project of projectList) expect(nodes[project.slug].kind).toBe('document');
	});

	test('a case study is a document in its own folder, dated by the work it is about', () => {
		expect(nodes['case-studies'].children).toEqual(caseStudies.map((study) => study.slug));

		for (const study of caseStudies) {
			const record = nodes[study.slug];
			expect(record.kind).toBe('document');
			expect(record.href).toBe(`/projects/case-studies/${study.slug}`);
			// The write-up dates to the job the work was done under, not to when it was written.
			expect(record.modified).toBe(nodes[study.project.slug].modified);
		}
	});

	test('a project finds its study, and a project without one finds nothing', () => {
		expect(caseStudyOf('billing-engine')).toBe(nodes['billing-engine-case-study']);
		expect(caseStudyOf('lightsaml')).toBeUndefined();
		expect(caseStudyOf('nope')).toBeUndefined();
	});

	test('an experience is a folder of exactly the work done there', () => {
		for (const experience of experiences) {
			const record = nodes[experience.slug];
			expect(record.kind).toBe('folder');
			expect(record.name).toBe(experience.company.name);
			expect(record.children).toEqual(experience.projects.map((project) => project.slug));
		}
	});

	test('a project is one node, listed by both its experience and Projects', () => {
		const inBoth = 'billing-engine';
		expect(nodes['gymrevenue-software-engineer'].children).toContain(inBoth);
		expect(nodes.projects.children).toContain(inBoth);
		expect(all.filter((record) => record.id === inBoth)).toHaveLength(1);
	});

	test('a project inherits the end date of the job it was built under', () => {
		expect(nodes['billing-engine'].modified).toBe('2023-08');
	});
});

describe('lookup', () => {
	test('an unknown id is undefined rather than a throw', () => {
		expect(node('nope')).toBeUndefined();
		expect(childrenOf('nope')).toEqual([]);
	});

	test('a document has no children', () => {
		expect(childrenOf('billing-engine')).toEqual([]);
	});

	// The catch-all route is the only route file for content, so this map is the route table.
	test('every href resolves back to the node that owns it', () => {
		for (const record of all) expect(byHref(record.href)).toBe(record);
	});

	test('an unknown path is undefined, which is what the route turns into a 404', () => {
		expect(byHref('/nope')).toBeUndefined();
		expect(byHref('/')).toBeUndefined();
	});
});

describe('bodies', () => {
	test('every node carries the content its route renders', () => {
		expect(nodes.about.type).toBe('about');
		expect(nodes['billing-engine'].type).toBe('project');
		expect(nodes['bsc-computer-science'].type).toBe('degree');
		expect(nodes['blockchain-land-registry'].type).toBe('publication');
		expect(nodes['certified-scrum-master'].type).toBe('certification');
		expect(nodes['gymrevenue-software-engineer'].type).toBe('experience');
		expect(nodes['billing-engine-case-study'].type).toBe('case-study');
		for (const id of [
			'projects',
			'case-studies',
			'attainments',
			'degrees',
			'publications',
			'certifications'
		])
			expect(nodes[id].type).toBe('index');
	});

	test('a body carries the same object the collection holds', () => {
		const record = nodes['billing-engine'];
		expect(record.type === 'project' && record.data).toBe(projects['billing-engine']);
	});
});

describe('summary', () => {
	test('every node has one, capped for a meta description', () => {
		for (const record of all) {
			expect(summary(record).length).toBeGreaterThan(0);
			expect(summary(record).length).toBeLessThanOrEqual(156);
		}
	});

	test('a truncated summary never cuts mid-word', () => {
		const full = about.description[0];
		const short = summary(nodes.about);
		expect(short.endsWith('…')).toBe(true);

		const body = short.slice(0, -1);
		expect(full.startsWith(body)).toBe(true);
		// The character the cut landed on is the space, so no word was split across it.
		expect(full[body.length]).toBe(' ');
	});

	test('an index folder says what it holds', () => {
		// Twenty-one projects and the folder the studies sit in.
		expect(summary(nodes.projects)).toContain('22 items');
	});
});
