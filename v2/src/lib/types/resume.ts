/**
 * The one document on this site that is also a file you can take away with you.
 *
 * It holds no career data of its own. Everything a CV says is already a collection: the summary
 * is `about`, the jobs are `experiences`, the paperwork is `attainments`. A second copy here
 * would be the old site's `directory-contents.ts` again, a parallel list that goes stale in
 * silence. So this type is the page's own framing plus a pointer at the PDF, and the body is
 * assembled at render time from what already exists.
 */
export type Resume = {
	slug: string;
	name: string;
	/** Authored in `content/prose/resume.md`, never here (ledger #32). */
	description: string[];
	/** Absolute path under `static/`. The download, not the page. */
	file: string;
	/** What the browser saves it as. The served filename is a cache key and reads like one. */
	filename: string;
};
