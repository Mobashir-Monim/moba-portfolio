import type { Location, PersonName, Social } from './common';
import type { Skill } from './skill';

export type About = {
	slug: string;
	/** What the desktop icon reads. The person's name is `person`, and they are not the same. */
	name: string;
	person: PersonName;
	title: string;
	/** One entry per paragraph. Authored in `content/prose/about.md`, never here (ledger #32). */
	description: string[];
	location: Location;
	socials: Social[];
	skills: Skill[];
};
