import type { YearMonth } from './common';
import type { Company } from './company';
import type { Project } from './project';

export type Experience = {
	slug: string;
	role: string;
	company: Company;
	start: YearMonth;
	/** Absent means current. */
	end?: YearMonth;
	description: string[];
	/**
	 * The same objects the projects collection holds, not copies. Companies do not point back at
	 * experiences, so the graph stays acyclic. Ledger #9 was a cycle, but it was a cycle in
	 * *state*; static data referencing shared objects is what a module graph is for.
	 */
	projects: Project[];
};
