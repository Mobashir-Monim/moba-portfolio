import { about } from './content/about';
import { certifications, degrees, publications } from './content/attainments';
import { experiences } from './content/experiences';
import { projectList } from './content/projects';
import { resume } from './content/resume';
import { SITE_MODIFIED, type Kind } from './os';
import type { About } from './types/about';
import type { Certification, Degree, Publication } from './types/attainment';
import type { YearMonth } from './types/common';
import type { Experience } from './types/experience';
import type { Project } from './types/project';
import type { Resume } from './types/resume';

/**
 * The directory tree, derived from the content collections rather than maintained beside them.
 * The old site hand-wrote a parallel `directory-contents.ts` that listed every item a second
 * time, so adding a project meant editing two files and forgetting the second was silent.
 *
 * A flat record, not a nested structure. Windows address nodes by id (`WindowRecord.history` is
 * a stack of these strings, ledger #9), so the lookup a window needs every render has to be a
 * key access and not a walk.
 */

type Base = {
	/** Unique across the whole tree. Doubles as the window id and as the content slug. */
	id: string;
	name: string;
	kind: Kind;
	href: string;
	/**
	 * Bytes, for the info sidebar. Invented, in that no file exists, but never arbitrary: it is
	 * the real byte length of the item's own copy, so it is stable across builds and a longer
	 * write-up genuinely reads as a bigger file.
	 */
	size: number;
	/** `YYYY-MM`. A folder takes the newest date beneath it. */
	modified: YearMonth;
	/** Ids in display order. Documents have none, which is what makes them documents. */
	children?: string[];
};

/**
 * What the node actually holds, carried on the node itself rather than in a second map keyed by
 * the same ids. `NodeContent` switches on `type` and gets `data` narrowed for free, which is the
 * whole reason the shell and the plain routes can share one component.
 *
 * `index` is a folder that holds things but says nothing of its own: Projects, Attainments, and
 * the three attainment folders under it.
 */
export type Body =
	| { type: 'about'; data: About }
	| { type: 'resume'; data: Resume }
	| { type: 'experience'; data: Experience }
	| { type: 'project'; data: Project }
	| { type: 'degree'; data: Degree }
	| { type: 'publication'; data: Publication }
	| { type: 'certification'; data: Certification }
	| { type: 'index' };

export type Node = Base & Body;

const encoder = new TextEncoder();

function bytes(parts: string[]): number {
	return parts.reduce((total, part) => total + encoder.encode(part).length, 0);
}

const draft: Record<string, Node> = {};
const byPath = new Map<string, Node>();

function add(node: Node): string {
	// A collision here means two content items claim one slug, which would make one of them
	// unreachable and the other's window open the wrong thing. Fail the build, not the page.
	if (draft[node.id]) throw new Error(`Duplicate tree id "${node.id}"`);
	if (byPath.has(node.href)) throw new Error(`Duplicate tree href "${node.href}"`);
	draft[node.id] = node;
	byPath.set(node.href, node);
	return node.id;
}

function sizeOf(children: string[]): number {
	return children.reduce((total, child) => total + draft[child].size, 0);
}

/** Children must already exist: a folder's size and date are read off them, not declared. */
function index(id: string, name: string, href: string, children: string[]): string {
	return add({
		type: 'index',
		id,
		name,
		kind: 'folder',
		href,
		children,
		size: sizeOf(children),
		modified: children.reduce(
			(latest, child) => (draft[child].modified > latest ? draft[child].modified : latest),
			SITE_MODIFIED
		)
	});
}

// --- Documents -------------------------------------------------------------------------------

add({
	type: 'about',
	data: about,
	id: about.slug,
	name: about.name,
	kind: 'document',
	href: '/about',
	size: bytes(about.description),
	modified: SITE_MODIFIED
});

/**
 * The one document that is also a file. Its size is the page's own framing and not the CV, since
 * the CV itself is assembled from records that already count as their own nodes; counting them
 * twice would make this the largest file on a site where size means length of copy.
 */
add({
	type: 'resume',
	data: resume,
	id: resume.slug,
	name: resume.name,
	kind: 'document',
	href: '/resume',
	size: bytes(resume.description),
	modified: SITE_MODIFIED
});

/**
 * A project's date is the end of the job it was built under, which is the only honest date the
 * content carries. Ongoing work and the projects built outside any job fall back to the site's.
 */
const projectModified = new Map<string, YearMonth>();
for (const experience of experiences)
	for (const project of experience.projects)
		projectModified.set(project.slug, experience.end ?? SITE_MODIFIED);

for (const project of projectList)
	add({
		type: 'project',
		data: project,
		id: project.slug,
		name: project.name,
		kind: 'document',
		href: `/projects/${project.slug}`,
		size: bytes([...project.description, ...project.features]),
		modified: projectModified.get(project.slug) ?? SITE_MODIFIED
	});

for (const degree of degrees)
	add({
		type: 'degree',
		data: degree,
		id: degree.slug,
		name: degree.name,
		kind: 'document',
		href: `/attainments/degrees/${degree.slug}`,
		size: bytes(degree.description),
		modified: degree.end ?? degree.start
	});

for (const publication of publications)
	add({
		type: 'publication',
		data: publication,
		id: publication.slug,
		name: publication.name,
		kind: 'document',
		href: `/attainments/publications/${publication.slug}`,
		size: bytes(publication.description),
		modified: `${publication.year}-01`
	});

for (const certification of certifications)
	add({
		type: 'certification',
		data: certification,
		id: certification.slug,
		name: certification.name,
		kind: 'document',
		href: `/attainments/certifications/${certification.slug}`,
		size: bytes(certification.description),
		modified: certification.start
	});

// --- Folders ---------------------------------------------------------------------------------

/**
 * An experience is the one folder that also has something to say, so it carries its own body and
 * its route renders that prose above the grid of work. Named for the company, because that is
 * what a reader scans a CV for; the role is the first line of the document inside.
 */
const experienceIds = experiences.map((experience) => {
	const children = experience.projects.map((project) => project.slug);
	return add({
		type: 'experience',
		data: experience,
		id: experience.slug,
		name: experience.company.name,
		kind: 'folder',
		href: `/experience/${experience.slug}`,
		children,
		size: bytes(experience.description) + sizeOf(children),
		modified: experience.end ?? SITE_MODIFIED
	});
});

const attainmentIds = [
	index(
		'degrees',
		'Degrees',
		'/attainments/degrees',
		degrees.map((degree) => degree.slug)
	),
	index(
		'publications',
		'Publications',
		'/attainments/publications',
		publications.map((publication) => publication.slug)
	),
	index(
		'certifications',
		'Certifications',
		'/attainments/certifications',
		certifications.map((certification) => certification.slug)
	)
];

/**
 * Root order, which is the order the desktop draws. Deliberately not alphabetical: it opens on
 * who I am and closes on the paperwork.
 */
export const root: string[] = [
	about.slug,
	resume.slug,
	index('experience', 'Experience', '/experience', experienceIds),
	index(
		'projects',
		'Projects',
		'/projects',
		projectList.map((project) => project.slug)
	),
	index('attainments', 'Attainments', '/attainments', attainmentIds)
];

export const nodes: Readonly<Record<string, Node>> = draft;

export function node(id: string): Node | undefined {
	return draft[id];
}

/** The catch-all route's whole job: a path back to the node that owns it. */
export function byHref(href: string): Node | undefined {
	return byPath.get(href);
}

/** Empty for a document, and for an id that does not exist. Callers render a grid either way. */
export function childrenOf(id: string): Node[] {
	return (draft[id]?.children ?? []).map((child) => draft[child]);
}

/** Search engines truncate around here anyway, and a cut mid-word looks like a bug. */
const SUMMARY_MAX = 155;

/**
 * One line for a meta description and for a link preview. Index folders have no prose of their
 * own, so they say what they contain rather than saying nothing.
 */
export function summary(target: Node): string {
	const text =
		target.type === 'index'
			? `${target.name}: ${target.children?.length ?? 0} item${target.children?.length === 1 ? '' : 's'} in the ${about.person.first} ${about.person.last} portfolio.`
			: target.data.description[0];

	if (text.length <= SUMMARY_MAX) return text;
	const cut = text.lastIndexOf(' ', SUMMARY_MAX);
	return `${text.slice(0, cut > 0 ? cut : SUMMARY_MAX)}…`;
}
