import type { Experience } from '$lib/types/experience';
import { companies } from './companies';
import { projects } from './projects';
import { prose } from './prose';

/**
 * An array, not a keyed record, because this is the only collection whose order is meaningful:
 * it is what the Experiences folder lists, current work first.
 */
export const experiences: Experience[] = [
	{
		slug: 'eveneer-tech-wizard',
		role: 'Founder and Full Stack Engineer',
		company: companies.eveneer,
		start: '2018-12',
		description: prose('eveneer-tech-wizard'),
		projects: [
			projects.bout,
			projects['bout-v2'],
			projects.blober,
			projects.busso,
			projects.lightsaml
		]
	},
	{
		// KroDev has no project children, the way `aml-technology-advisor` has none: the work
		// there is not a catalogue of named systems, and an invented one would be worse than an
		// empty folder.
		slug: 'krodev-senior-software-engineer',
		role: 'Senior Software Engineer',
		company: companies.krodev,
		start: '2023-10',
		end: '2024-10',
		description: prose('krodev-senior-software-engineer'),
		projects: []
	},
	{
		slug: 'gymrevenue-software-engineer',
		role: 'Senior Software Engineer',
		company: companies.gymrevenue,
		start: '2022-11',
		end: '2023-08',
		description: prose('gymrevenue-software-engineer'),
		projects: [
			projects['billing-engine'],
			projects['point-of-sale'],
			projects['inventory-management'],
			projects['service-agreements'],
			projects['calendar-and-scheduling'],
			projects['cli-dev-tool']
		]
	},
	{
		slug: 'bracu-lecturer',
		role: 'Lecturer and Software Developer',
		company: companies.bracu,
		start: '2020-01',
		end: '2023-05',
		description: prose('bracu-lecturer'),
		projects: [
			projects['user-validator'],
			projects['lms-usage-report-generator'],
			projects['automated-course-management-scripts']
		]
	},
	{
		slug: 'techynaf-backend-developer',
		role: 'Backend Developer',
		company: companies.techynaf,
		start: '2016-12',
		end: '2019-07',
		description: prose('techynaf-backend-developer'),
		projects: [projects.connect, projects.alfred, projects.huddle, projects.ecube]
	},
	{
		slug: 'aml-technology-advisor',
		role: 'Technology Advisor',
		company: companies.aml,
		start: '2022-06',
		end: '2022-11',
		description: prose('aml-technology-advisor'),
		projects: []
	}
];
