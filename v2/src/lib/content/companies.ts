import amlLogo from '$lib/assets/logos/aml.png';
import bracuLogo from '$lib/assets/logos/bracu.png';
import eveneerLogo from '$lib/assets/logos/eveneer.png';
import gymrevenueLogo from '$lib/assets/logos/gymrevenue.png';
import techynafLogo from '$lib/assets/logos/techynaf.png';
import type { Company } from '$lib/types/company';
import { prose } from './prose';

/**
 * Keyed by slug, and the key is repeated in the record. That duplication is deliberate: it buys
 * `companies.gymrevenue` at every call site with no lookup helper, and `content.test.ts` asserts
 * the two never drift.
 */
export const companies = {
	gymrevenue: {
		slug: 'gymrevenue',
		name: 'GymRevenue',
		description: prose('gymrevenue'),
		logo: gymrevenueLogo,
		location: { city: 'Dallas', state: 'TX', country: 'USA' },
		industry: 'Software Development',
		website: 'gymrevenue.com'
	},
	bracu: {
		slug: 'bracu',
		name: 'Brac University',
		description: prose('bracu'),
		logo: bracuLogo,
		location: { city: 'Dhaka', country: 'Bangladesh' },
		industry: 'Higher Education',
		website: 'bracu.ac.bd'
	},
	techynaf: {
		slug: 'techynaf',
		name: 'Techynaf Technologies Limited',
		description: prose('techynaf'),
		logo: techynafLogo,
		location: { city: 'Dhaka', country: 'Bangladesh' },
		industry: 'Software Development',
		website: 'linkedin.com/company/techynaf-technologies'
	},
	eveneer: {
		slug: 'eveneer',
		name: 'Eveneer Solutions',
		description: prose('eveneer'),
		logo: eveneerLogo,
		location: { city: 'Sheridan', state: 'WY', country: 'USA' },
		industry: 'Software Development',
		website: 'eveneer.dev'
	},
	aml: {
		slug: 'aml',
		name: 'Abdul Monem Limited',
		description: prose('aml'),
		logo: amlLogo,
		location: { city: 'Dhaka', country: 'Bangladesh' },
		industry: 'Conglomerate',
		website: 'amlbd.com'
	}
} satisfies Record<string, Company>;

/** Widened to `Company`, for the same reason as `projectList`. */
export const companyList: Company[] = Object.values(companies);
