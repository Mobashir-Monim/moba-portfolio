import type { Certification, Degree, Publication } from '$lib/types/attainment';
import { prose } from './prose';

export const degrees: Degree[] = [
	{
		slug: 'bsc-computer-science',
		name: 'BSc in Computer Science',
		description: prose('bsc-computer-science'),
		institution: 'Brac University',
		location: { city: 'Dhaka', country: 'Bangladesh' },
		start: '2016-01',
		end: '2019-12'
	}
];

export const publications: Publication[] = [
	{
		slug: 'blockchain-land-registry',
		name: 'Blockchain based Land Registry with Delegated Proof of Stake (DPoS) Consensus in Bangladesh',
		description: prose('blockchain-land-registry'),
		year: '2020',
		venue: '2020 IEEE Region 10 Symposium (TENSYMP)',
		url: 'https://ieeexplore.ieee.org/document/9230612',
		authors: [
			{ first: 'Mahbubul', middle: 'Alam', last: 'Majumdar' },
			{ first: 'Muhtasim', last: 'Shahriyer' },
			{ first: 'Mobashir', last: 'Monim' }
		]
	}
];

export const certifications: Certification[] = [
	{
		slug: 'certified-scrum-master',
		name: 'Certified Scrum Master',
		description: prose('certified-scrum-master'),
		issuer: 'Scrum Alliance',
		start: '2022-01',
		end: '2024-01'
	}
];
