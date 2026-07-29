import aboutMd from './prose/about.md?raw';
import attainmentsMd from './prose/attainments.md?raw';
import companiesMd from './prose/companies.md?raw';
import experiencesMd from './prose/experiences.md?raw';
import projectsMd from './prose/projects.md?raw';

/**
 * Prose lives in markdown, not in TypeScript. Ledger #32: the old site's
 * `src/lib/data/projects.ts` was 642 lines, most of it paragraphs, and editing a sentence meant
 * editing a source module.
 *
 * Exactly two pieces of markdown are honoured. `## key` opens an entry, and a blank line
 * separates paragraphs. Nothing here renders inline syntax, so nothing here needs a parser and
 * no dependency is added to get one. Everything before the first `## ` is a file header for
 * whoever opens it next, and is dropped.
 *
 * Keys are one flat namespace across all five files, because the directory tree already
 * requires every slug in the site to be unique and a second namespace would only be a second
 * place for them to disagree.
 */

const ENTRIES = new Map<string, string[]>();

function index(source: string, file: string): void {
	// `slice(1)` drops the file header. A source with no `## ` at all yields nothing, which the
	// coverage test in `content.test.ts` catches as a missing key rather than as silence.
	for (const block of source.split(/^## /m).slice(1)) {
		const nl = block.indexOf('\n');
		const key = (nl === -1 ? block : block.slice(0, nl)).trim();
		const body = nl === -1 ? '' : block.slice(nl + 1);

		if (ENTRIES.has(key)) throw new Error(`Duplicate prose key "${key}" in ${file}`);

		ENTRIES.set(
			key,
			body
				.split(/\n[ \t]*\n/)
				// Unwrap: a paragraph hard-wrapped across source lines is still one paragraph.
				.map((p) => p.trim().replace(/\s*\n\s*/g, ' '))
				.filter(Boolean)
		);
	}
}

index(aboutMd, 'about.md');
index(attainmentsMd, 'attainments.md');
index(companiesMd, 'companies.md');
index(experiencesMd, 'experiences.md');
index(projectsMd, 'projects.md');

/**
 * Throws rather than returning empty, so a slug that drifts away from its prose is a build
 * failure at prerender time and not a document that renders with a heading and nothing under it.
 */
export function prose(key: string): string[] {
	const found = ENTRIES.get(key);
	if (!found || found.length === 0) throw new Error(`No prose for "${key}"`);
	return found;
}

/** Every key that exists, so the coverage test can catch prose nothing claims. */
export const proseKeys: string[] = [...ENTRIES.keys()];
