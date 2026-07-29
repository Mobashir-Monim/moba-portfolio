import type { Section } from '$lib/types/case-study';
import aboutMd from './prose/about.md?raw';
import attainmentsMd from './prose/attainments.md?raw';
import caseStudiesMd from './prose/case-studies.md?raw';
import companiesMd from './prose/companies.md?raw';
import experiencesMd from './prose/experiences.md?raw';
import projectsMd from './prose/projects.md?raw';
import resumeMd from './prose/resume.md?raw';

/**
 * Prose lives in markdown, not in TypeScript. Ledger #32: the old site's
 * `src/lib/data/projects.ts` was 642 lines, most of it paragraphs, and editing a sentence meant
 * editing a source module.
 *
 * Exactly three pieces of markdown are honoured. `## key` opens an entry, `### heading` opens a
 * section inside one, and a blank line separates paragraphs. Nothing here renders inline syntax,
 * so nothing here needs a parser and no dependency is added to get one. Everything before the
 * first `## ` is a file header for whoever opens it next, and is dropped.
 *
 * Sections arrived with the case studies (4.2), which are the only entries that have any: a
 * project write-up is one run of paragraphs, a case study is five headed passages that the reader
 * builds its contents list from. Every other file splits into a lead and no sections, which is
 * byte for byte what it parsed to before.
 *
 * Keys are one flat namespace across all six files, because the directory tree already
 * requires every slug in the site to be unique and a second namespace would only be a second
 * place for them to disagree.
 */

const ENTRIES = new Map<string, string[]>();
const SECTIONS = new Map<string, Section[]>();

/** A blank line ends a paragraph; a hard wrap inside one does not. */
function paragraphs(body: string): string[] {
	return body
		.split(/\n[ \t]*\n/)
		.map((p) => p.trim().replace(/\s*\n\s*/g, ' '))
		.filter(Boolean);
}

/** Splits a `## ` or `### ` block into its heading and everything under it. */
function split(block: string): [string, string] {
	const nl = block.indexOf('\n');
	return nl === -1 ? [block.trim(), ''] : [block.slice(0, nl).trim(), block.slice(nl + 1)];
}

function index(source: string, file: string): void {
	// `slice(1)` drops the file header. A source with no `## ` at all yields nothing, which the
	// coverage test in `content.test.ts` catches as a missing key rather than as silence.
	for (const block of source.split(/^## /m).slice(1)) {
		const [key, body] = split(block);

		if (ENTRIES.has(key)) throw new Error(`Duplicate prose key "${key}" in ${file}`);

		// The lead is whatever precedes the first heading, which for five of the six files is the
		// whole body.
		const [lead, ...headed] = body.split(/^### /m);

		ENTRIES.set(key, paragraphs(lead));
		SECTIONS.set(
			key,
			headed.map((chunk) => {
				const [title, under] = split(chunk);
				return {
					id: title
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, '-')
						.replace(/^-|-$/g, ''),
					title,
					paragraphs: paragraphs(under)
				};
			})
		);
	}
}

index(aboutMd, 'about.md');
index(caseStudiesMd, 'case-studies.md');
index(attainmentsMd, 'attainments.md');
index(companiesMd, 'companies.md');
index(experiencesMd, 'experiences.md');
index(projectsMd, 'projects.md');
index(resumeMd, 'resume.md');

/**
 * Throws rather than returning empty, so a slug that drifts away from its prose is a build
 * failure at prerender time and not a document that renders with a heading and nothing under it.
 */
export function prose(key: string): string[] {
	const found = ENTRIES.get(key);
	if (!found || found.length === 0) throw new Error(`No prose for "${key}"`);
	return found;
}

/**
 * The headed passages under a key, in the order they are written. Throws for the same reason
 * `prose` does: a case study with no sections is a case study that failed to parse, and the
 * reader would draw an empty contents list rather than say so.
 */
export function proseSections(key: string): Section[] {
	const found = SECTIONS.get(key);
	if (!found || found.length === 0) throw new Error(`No prose sections for "${key}"`);
	return found;
}

/** Every key that exists, so the coverage test can catch prose nothing claims. */
export const proseKeys: string[] = [...ENTRIES.keys()];
