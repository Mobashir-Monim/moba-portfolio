/**
 * The shapes more than one collection needs. Plain objects throughout: the spec rules out
 * the old site's `src/lib/models/` layer, eight classes that re-declared an interface and
 * assigned it in a constructor with no behavior (ledger #31).
 */

/**
 * `YYYY-MM`. A string rather than `{ month: 'Nov', year: '2022' }`, which is what the old site
 * stored, because that shape cannot be compared without a month lookup table and this one sorts
 * with `<`. The directory tree needs exactly that to give a folder the newest date under it.
 */
export type YearMonth = string;

export type Location = {
	city: string;
	state?: string;
	country: string;
};

export type PersonName = {
	first: string;
	middle?: string;
	last: string;
};

export type SocialLabel = 'github' | 'linkedin' | 'twitter' | 'facebook' | 'email';

export type Social = {
	label: SocialLabel;
	/** Absolute, including the `mailto:` for email. Nothing downstream builds a URL. */
	href: string;
};
