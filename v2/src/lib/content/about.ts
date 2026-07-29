import type { About } from '$lib/types/about';
import { prose } from './prose';
import { SKILLS } from './skills';

export const about: About = {
	slug: 'about',
	name: 'About Me',
	person: { first: 'Mobashir', last: 'Monim' },
	title: 'Senior Full Stack Engineer',
	description: prose('about'),
	location: { city: 'Remote', country: 'USA' },

	// Ordered by where you would actually want to be reached, not alphabetically.
	socials: [
		{ label: 'github', href: 'https://github.com/mobashir-monim' },
		{ label: 'linkedin', href: 'https://www.linkedin.com/in/mobashir-monim/' },
		{ label: 'email', href: 'mailto:mobashirmonim@gmail.com' },
		{ label: 'twitter', href: 'https://twitter.com/M_Monim' },
		{ label: 'facebook', href: 'https://www.facebook.com/mobashir.monim' }
	],

	// The whole catalogue. A hand-maintained second list is a list that goes stale, and the old
	// site's had already lost one entry to that.
	skills: Object.values(SKILLS)
};
