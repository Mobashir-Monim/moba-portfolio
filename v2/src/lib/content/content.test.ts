import { describe, expect, test } from 'bun:test';
import { about } from './about';
import { certifications, degrees, publications } from './attainments';
import { caseStudies, neighbours } from './case-studies';
import { companies, companyList } from './companies';
import { experiences } from './experiences';
import { projectList, projects } from './projects';
import { proseKeys } from './prose';
import { resume } from './resume';

/** Every item in the site, whatever collection it came from. */
const items = [
	about,
	resume,
	...companyList,
	...experiences,
	...projectList,
	...caseStudies,
	...degrees,
	...publications,
	...certifications
];

describe('slugs', () => {
	test('a keyed collection repeats its key in the record, and the two agree', () => {
		for (const [key, company] of Object.entries(companies)) expect(company.slug).toBe(key);
		for (const [key, project] of Object.entries(projects)) expect(project.slug).toBe(key);
	});

	test('are unique across every collection', () => {
		const slugs = items.map((item) => item.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	test('are URL-safe, so a slug is also a route segment', () => {
		for (const item of items) expect(item.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});
});

/**
 * The pairing between a slug and its `## key` in markdown is the one link in the content layer
 * that no type can check. `prose()` throws on a missing key at import time, so this side of it
 * is already covered; what is left is prose nobody reads, which is silent.
 */
describe('prose', () => {
	test('every item has some', () => {
		for (const item of items) expect(item.description.length).toBeGreaterThan(0);
	});

	test('no entry sits in a markdown file unclaimed', () => {
		const claimed = new Set(items.map((item) => item.slug));
		expect(proseKeys.filter((key) => !claimed.has(key))).toEqual([]);
	});

	test('paragraphs are trimmed and unwrapped', () => {
		for (const item of items)
			for (const paragraph of item.description) {
				expect(paragraph).toBe(paragraph.trim());
				expect(paragraph).not.toContain('\n');
			}
	});
});

describe('references', () => {
	test('every project an experience lists is in the projects collection', () => {
		const known = new Set(projectList.map((project) => project.slug));
		for (const experience of experiences)
			for (const project of experience.projects) expect(known.has(project.slug)).toBe(true);
	});

	test('an experience holds the same object the collection does, not a copy', () => {
		const gymrevenue = experiences.find((e) => e.slug === 'gymrevenue-software-engineer');
		expect(gymrevenue?.projects[0]).toBe(projects['billing-engine']);
	});

	test('every project carries at least one skill', () => {
		for (const project of projectList) expect(project.skills.length).toBeGreaterThan(0);
	});

	// Only open source has somewhere to link to, and a closed project with a URL is a leak.
	test('a URL implies open source', () => {
		for (const project of projectList) if (project.url) expect(project.source).toBe('open');
	});
});

/**
 * The five headings are what makes a case study one rather than a feature list with headings on,
 * and nothing in the type system holds them: the sections are parsed out of markdown, so a
 * misspelled or reordered heading would ship as a section titled exactly that.
 */
describe('case studies', () => {
	const HEADINGS = ['Problem', 'Constraints', 'Approach', 'Outcome', 'Results'];
	/** Results is the one that may be missing, because it is the one that needs a number. */
	const REQUIRED = HEADINGS.slice(0, 4);

	test('every study is of a project in the catalogue, and no project has two', () => {
		const slugs = caseStudies.map((study) => study.project.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		for (const study of caseStudies) expect(projectList.includes(study.project)).toBe(true);
	});

	test('a slug is its project, so the pairing cannot be got wrong twice', () => {
		for (const study of caseStudies) expect(study.slug).toBe(`${study.project.slug}-case-study`);
	});

	test('sections are drawn from the canonical set and stay in that order', () => {
		for (const study of caseStudies) {
			const titles = study.sections.map((section) => section.title);
			expect(titles).toEqual(HEADINGS.filter((heading) => titles.includes(heading)));
		}
	});

	test('every study carries the four sections that are not optional', () => {
		for (const study of caseStudies) {
			const titles = study.sections.map((section) => section.title);
			for (const heading of REQUIRED) expect(titles).toContain(heading);
		}
	});

	test('every section has prose under it, or the heading is the whole content', () => {
		for (const study of caseStudies)
			for (const section of study.sections) expect(section.paragraphs.length).toBeGreaterThan(0);
	});

	// The reader builds a fragment link per section, prefixed with the study's slug.
	test('section ids are URL-safe and unique within a study', () => {
		for (const study of caseStudies) {
			const ids = study.sections.map((section) => section.id);
			expect(new Set(ids).size).toBe(ids.length);
			for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
		}
	});

	test('the pager walks the reading order and stops at both ends', () => {
		const first = caseStudies[0];
		const last = caseStudies.at(-1)!;

		expect(neighbours(first.slug).previous).toBeUndefined();
		expect(neighbours(first.slug).next).toBe(caseStudies[1]);
		expect(neighbours(last.slug).next).toBeUndefined();
		// An unknown slug is nowhere in the order, not before the first one.
		expect(neighbours('nope')).toEqual({});
	});
});

describe('links', () => {
	test('socials are absolute, and email is a mailto', () => {
		for (const social of about.socials)
			expect(social.href).toMatch(social.label === 'email' ? /^mailto:/ : /^https:\/\//);
	});

	test('a company website is a bare host, so nothing double-schemes it', () => {
		// `companyList`, not `Object.values`: the collection is `satisfies`, so its values keep
		// their literal types and a company with no `website` has no such property to read.
		for (const company of companyList)
			if (company.website) expect(company.website).not.toMatch(/^https?:\/\//);
	});

	test('project and publication URLs carry a scheme', () => {
		for (const project of projectList) if (project.url) expect(project.url).toMatch(/^https:\/\//);
		for (const publication of publications) expect(publication.url).toMatch(/^https:\/\//);
	});
});

describe('dates', () => {
	const dated = [
		...experiences.map((e) => [e.start, e.end] as const),
		...degrees.map((d) => [d.start, d.end] as const),
		...certifications.map((c) => [c.start, c.end] as const)
	];

	test('are sortable `YYYY-MM`, which is why they are strings', () => {
		for (const [start, end] of dated) {
			expect(start).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
			if (end) expect(end).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
		}
	});

	test('never end before they start', () => {
		for (const [start, end] of dated) if (end) expect(end >= start).toBe(true);
	});
});
