import type { CaseStudy } from '$lib/types/case-study';
import type { Project } from '$lib/types/project';
import { projects } from './projects';
import { prose, proseSections } from './prose';

/**
 * The narrative behind six of the twenty-one projects. Not every project has a story in it, and a
 * case study written for a project that does not is a feature list with headings on.
 *
 * The record is almost entirely derived: the slug follows from the project's, the prose follows
 * from the slug, and the project itself is carried rather than copied. What is left to author is
 * `content/prose/case-studies.md`, which is the whole point of ledger #32.
 */
function study(project: Project): CaseStudy {
	const slug = `${project.slug}-case-study`;

	return {
		slug,
		// Repeats "Case Study" against a folder already called that, and deliberately: this is the
		// window title and the `<title>`, both of which are read with no folder in sight.
		name: `${project.name} Case Study`,
		description: prose(slug),
		project,
		sections: proseSections(slug)
	};
}

/**
 * Reading order, which is the catalogue's own order filtered down rather than a second ranking to
 * maintain. It is also the order the previous and next links walk.
 */
export const caseStudies: CaseStudy[] = [
	study(projects['billing-engine']),
	study(projects['cli-dev-tool']),
	study(projects['bout-v2']),
	study(projects.busso),
	study(projects['land-reg']),
	study(projects['user-validator'])
];

/** Where a study sits in the reading order, for the pager. */
export function neighbours(slug: string): { previous?: CaseStudy; next?: CaseStudy } {
	const at = caseStudies.findIndex((study) => study.slug === slug);
	// Not found would otherwise read as "before the first", and hand back the first as `next`.
	if (at === -1) return {};
	return { previous: caseStudies[at - 1], next: caseStudies[at + 1] };
}
