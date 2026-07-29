import type { Project } from './project';

/**
 * One heading and the paragraphs under it. Generic on purpose: the five headings a case study uses
 * are fixed by `content.test.ts` rather than by five fields here, because the alternative is a
 * mapping table from heading text to field name, and the markdown already declares both the set
 * and the order.
 */
export type Section = {
	/** Anchor fragment, slugified from the title. Unique within a study. */
	id: string;
	title: string;
	paragraphs: string[];
};

/**
 * The narrative behind a project: problem, constraints, approach, outcome, and where there is one,
 * measured results.
 *
 * Distinct from the catalogue entry, which says what the thing is and what it does. This says why
 * it is shaped the way it is. It carries the `Project` rather than repeating any of it, so the two
 * cannot drift and the reader can link back to the entry it is a study of.
 */
export type CaseStudy = {
	/** The project's slug with `-case-study` on the end, which is also the route segment. */
	slug: string;
	name: string;
	/** The lead, and the one paragraph a search result or an answer engine quotes. */
	description: string[];
	project: Project;
	sections: Section[];
};
