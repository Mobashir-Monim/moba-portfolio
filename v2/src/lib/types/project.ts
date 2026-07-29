import type { Company } from './company';
import type { Skill } from './skill';

export type ProjectKind = 'research' | 'software' | 'module' | 'package';

/** Whether the source is public. Half of these were built for clients and are not. */
export type ProjectSource = 'open' | 'closed';

export type Project = {
	slug: string;
	name: string;
	description: string[];
	features: string[];
	kind: ProjectKind;
	source: ProjectSource;
	/** Absent for the ones built outside any job. */
	company?: Company;
	/** Repository or product URL. Only ever set when `source` is `open`. */
	url?: string;
	skills: Skill[];
};
