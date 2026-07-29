import type { Skill } from '$lib/types/skill';

/**
 * The skill catalogue, keyed. Every reference elsewhere is `SKILLS.laravel`, so a skill's name
 * is written once and a typo is a type error rather than a second entry that renders beside the
 * first. The old site exported twenty-three separate `new Skill(...)` constants for this.
 */
export const SKILLS = {
	php: { name: 'PHP', kind: 'language' },
	python: { name: 'Python', kind: 'language' },
	javascript: { name: 'JavaScript', kind: 'language' },
	typescript: { name: 'TypeScript', kind: 'language' },
	react: { name: 'ReactJS', kind: 'technical' },
	vue: { name: 'VueJS', kind: 'technical' },
	svelte: { name: 'Svelte', kind: 'technical' },
	laravel: { name: 'Laravel', kind: 'technical' },
	graphql: { name: 'GraphQL', kind: 'technical' },
	html: { name: 'HTML', kind: 'technical' },
	css: { name: 'CSS', kind: 'technical' },
	tailwind: { name: 'Tailwind', kind: 'technical' },
	bootstrap: { name: 'Bootstrap 5', kind: 'technical' },
	capacitor: { name: 'Capacitor', kind: 'technical' },
	aws: { name: 'AWS', kind: 'technical' },
	firestore: { name: 'Firestore', kind: 'technical' },
	blockchain: { name: 'Blockchain', kind: 'technical' },
	cryptography: { name: 'Cryptography', kind: 'technical' },
	architecture: { name: 'Software Architecture', kind: 'technical' },
	development: { name: 'Software Development', kind: 'technical' },
	requirements: { name: 'Requirement Analysis', kind: 'general' },
	scrum: { name: 'Scrum Master', kind: 'general' },
	mentoring: { name: 'Mentoring and Teaching', kind: 'general' }
} satisfies Record<string, Skill>;

export type SkillId = keyof typeof SKILLS;
