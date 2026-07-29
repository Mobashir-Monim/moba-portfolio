import type { Location, PersonName, YearMonth } from './common';

export type Degree = {
	slug: string;
	name: string;
	description: string[];
	institution: string;
	location: Location;
	start: YearMonth;
	end?: YearMonth;
};

export type Publication = {
	slug: string;
	name: string;
	/** The abstract. */
	description: string[];
	year: string;
	/** Conference or journal. */
	venue: string;
	url: string;
	/** In publication order, which is not alphabetical and is not mine to reorder. */
	authors: PersonName[];
};

export type Certification = {
	slug: string;
	name: string;
	description: string[];
	issuer: string;
	start: YearMonth;
	/** Certifications expire. Absent means it does not. */
	end?: YearMonth;
};
