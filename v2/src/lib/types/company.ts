import type { Location } from './common';

export type Company = {
	slug: string;
	name: string;
	description: string[];
	/** Resolved asset URL from a Vite import, so the filename carries a content hash. */
	logo: string;
	location: Location;
	industry: string;
	/** Bare host, no scheme. The one place a link is built from a value, and it is a display
	 *  string first: `gymrevenue.com` reads better under a logo than `https://gymrevenue.com`. */
	website?: string;
};
