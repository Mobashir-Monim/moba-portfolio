import type { Project } from '$lib/types/project';
import { companies } from './companies';
import { prose } from './prose';
import { SKILLS } from './skills';

/**
 * Stacks that whole groups of projects share, named once. Twenty-one projects listing twelve
 * skills each inline is two hundred lines that say four things.
 */
const GYMREVENUE = [
	SKILLS.php,
	SKILLS.laravel,
	SKILLS.typescript,
	SKILLS.vue,
	SKILLS.graphql,
	SKILLS.html,
	SKILLS.css,
	SKILLS.tailwind,
	SKILLS.architecture,
	SKILLS.development,
	SKILLS.requirements,
	SKILLS.scrum
];

const LARAVEL_BOOTSTRAP = [
	SKILLS.php,
	SKILLS.laravel,
	SKILLS.javascript,
	SKILLS.html,
	SKILLS.css,
	SKILLS.bootstrap,
	SKILLS.architecture,
	SKILLS.development,
	SKILLS.requirements
];

const TECHYNAF = [...LARAVEL_BOOTSTRAP, SKILLS.aws];

const BRACU = [
	SKILLS.javascript,
	SKILLS.react,
	SKILLS.html,
	SKILLS.css,
	SKILLS.bootstrap,
	SKILLS.architecture,
	SKILLS.development,
	SKILLS.scrum
];

/**
 * Keyed by slug in display order, same contract as `companies`. Prose is in
 * `content/prose/projects.md`; what stays here is structure, which is the whole point of
 * ledger #32.
 */
export const projects = {
	'billing-engine': {
		slug: 'billing-engine',
		name: 'Billing Engine',
		description: prose('billing-engine'),
		features: [
			'Support for multiple payment processor vendors',
			'Support for multiple card, ACH or cash payments',
			'Recurring payments and billing',
			'Automated payment retries',
			'Manual payment retries',
			'Late fee calculation',
			'Automated late fee calculation',
			'Invoice generation',
			'Payment status tracking',
			'Payment attempts tracking',
			'Location based sales tax application',
			'Automated sales tax update'
		],
		kind: 'module',
		source: 'closed',
		company: companies.gymrevenue,
		skills: GYMREVENUE
	},

	'inventory-management': {
		slug: 'inventory-management',
		name: 'Inventory Management',
		description: prose('inventory-management'),
		features: [
			'Support for product categories, product and inventory for analytics',
			'Support for inventory cost analytics',
			'Support for inventory sales analytics',
			'Support for inventory profit analytics'
		],
		kind: 'module',
		source: 'closed',
		company: companies.gymrevenue,
		skills: GYMREVENUE
	},

	'point-of-sale': {
		slug: 'point-of-sale',
		name: 'Point of Sale',
		description: prose('point-of-sale'),
		features: [
			'Discounts management',
			'Sales return and refund',
			'Subscription sales',
			'Services sales',
			'Inventory sales'
		],
		kind: 'module',
		source: 'closed',
		company: companies.gymrevenue,
		skills: GYMREVENUE
	},

	'service-agreements': {
		slug: 'service-agreements',
		name: 'Service Agreements',
		description: prose('service-agreements'),
		features: [
			'Agreement template builder',
			'Agreement management',
			'Contract template management',
			'Billing dates management',
			'Annual dues management',
			'Enrollment fee management'
		],
		kind: 'module',
		source: 'closed',
		company: companies.gymrevenue,
		skills: GYMREVENUE
	},

	'calendar-and-scheduling': {
		slug: 'calendar-and-scheduling',
		name: 'Calendar and Scheduling',
		description: prose('calendar-and-scheduling'),
		features: [
			'Calendar and event management',
			'Class, task, event and service scheduling',
			'Attendee management',
			'Event type management'
		],
		kind: 'module',
		source: 'closed',
		company: companies.gymrevenue,
		skills: GYMREVENUE
	},

	'cli-dev-tool': {
		slug: 'cli-dev-tool',
		name: 'CLI Dev Tool',
		description: prose('cli-dev-tool'),
		features: ['Code generation', 'Customizable templates', 'Parameterization', 'Consistency'],
		kind: 'module',
		source: 'closed',
		company: companies.gymrevenue,
		skills: [
			SKILLS.php,
			SKILLS.laravel,
			SKILLS.vue,
			SKILLS.graphql,
			SKILLS.architecture,
			SKILLS.development,
			SKILLS.requirements,
			SKILLS.scrum
		]
	},

	bout: {
		slug: 'bout',
		name: 'Bout',
		description: prose('bout'),
		features: [
			'Feature access permissioning system',
			'Evaluation analysis and distribution tool',
			'Evaluation results analysis',
			'Student information store',
			'Course and section management'
		],
		kind: 'software',
		source: 'open',
		company: companies.eveneer,
		url: 'https://github.com/Mobashir-Monim/bout',
		skills: [...LARAVEL_BOOTSTRAP, SKILLS.react, SKILLS.aws, SKILLS.scrum]
	},

	'bout-v2': {
		slug: 'bout-v2',
		name: 'Bout V2',
		description: prose('bout-v2'),
		features: [
			'Feature access permissioning system',
			'Evaluation analysis and distribution tool',
			'Evaluation results analysis',
			'Student information store',
			'Course and section management',
			'Evaluation collection management',
			'Anonymous evaluation collection',
			'Form builder tool for evaluation collection',
			'Thesis registration management'
		],
		kind: 'software',
		source: 'open',
		company: companies.eveneer,
		url: 'https://github.com/Mobashir-Monim/bout2-frontend',
		skills: [
			SKILLS.php,
			SKILLS.laravel,
			SKILLS.javascript,
			SKILLS.react,
			SKILLS.html,
			SKILLS.css,
			SKILLS.tailwind,
			SKILLS.firestore,
			SKILLS.aws,
			SKILLS.architecture,
			SKILLS.development,
			SKILLS.requirements,
			SKILLS.scrum
		]
	},

	blober: {
		slug: 'blober',
		name: 'Blober',
		description: prose('blober'),
		features: [
			'Randomized question from a select question pool for timed tests',
			'Randomized question from a select question pool for assignments',
			'Randomized question for practice'
		],
		kind: 'software',
		source: 'open',
		company: companies.eveneer,
		url: 'https://github.com/Mobashir-Monim/blober',
		skills: [...LARAVEL_BOOTSTRAP, SKILLS.vue, SKILLS.aws, SKILLS.scrum]
	},

	busso: {
		slug: 'busso',
		name: 'BuSSO',
		description: prose('busso'),
		features: [
			'Supports SAML based authentication',
			'Supports OIDC based authentication',
			'Access logs',
			'Data change logs',
			'Email based access control',
			'Role based access control',
			'Service provider management'
		],
		kind: 'software',
		source: 'open',
		company: companies.eveneer,
		url: 'https://github.com/Mobashir-Monim/bracu-sso',
		skills: [...LARAVEL_BOOTSTRAP, SKILLS.aws, SKILLS.scrum]
	},

	lightsaml: {
		slug: 'lightsaml',
		name: 'LightSaml',
		description: prose('lightsaml'),
		features: [
			'Basic SAML 2.0 data model classes',
			'Serialization and deserialization to and from XML with XML security',
			'Certificate support',
			'Message encapsulation to bindings'
		],
		kind: 'package',
		source: 'open',
		company: companies.eveneer,
		url: 'https://github.com/Mobashir-Monim/lightsaml',
		skills: [SKILLS.php, SKILLS.architecture, SKILLS.development]
	},

	beep: {
		slug: 'beep',
		name: 'Beep',
		description: prose('beep'),
		features: [
			'IoT based empty spot detection',
			'Self subscription and booking',
			'Automated payment for services availed'
		],
		kind: 'software',
		source: 'closed',
		skills: [...LARAVEL_BOOTSTRAP, SKILLS.aws, SKILLS.scrum]
	},

	'land-reg': {
		slug: 'land-reg',
		name: 'Land Reg',
		description: prose('land-reg'),
		features: [
			'Land owner verification',
			'Blockchain network management',
			'Land registration',
			'Land ownership transfer',
			'Block generation using Council Protocol'
		],
		kind: 'research',
		source: 'open',
		url: 'https://github.com/Mobashir-Monim/land-reg',
		skills: [...LARAVEL_BOOTSTRAP, SKILLS.blockchain, SKILLS.cryptography, SKILLS.scrum]
	},

	'mongol-tori': {
		slug: 'mongol-tori',
		name: 'Mongol Tori',
		description: prose('mongol-tori'),
		features: [
			'Sponsor management',
			'Faculty advisor management',
			'Blog and photo gallery',
			'Team members management'
		],
		kind: 'software',
		source: 'open',
		url: 'https://github.com/Mobashir-Monim/mongol-tori',
		skills: [...LARAVEL_BOOTSTRAP, SKILLS.scrum]
	},

	ecube: {
		slug: 'ecube',
		name: 'Ecube',
		description: prose('ecube'),
		features: [
			'Event registration and ticket sales',
			'Equipment rental services',
			'Product sales',
			'Sales analytics',
			'Delivery tracking'
		],
		kind: 'software',
		source: 'closed',
		company: companies.techynaf,
		skills: TECHYNAF
	},

	connect: {
		slug: 'connect',
		name: 'Connect',
		description: prose('connect'),
		features: [
			'Application collection',
			'Document management',
			'Scoring and evaluation',
			'Reporting and analysis'
		],
		kind: 'software',
		source: 'closed',
		company: companies.techynaf,
		skills: TECHYNAF
	},

	huddle: {
		slug: 'huddle',
		name: 'Huddle',
		description: prose('huddle'),
		features: [
			'Shift scheduling',
			'Time and attendance',
			'Employee records',
			'Leave management',
			'Employee self-service'
		],
		kind: 'software',
		source: 'closed',
		company: companies.techynaf,
		skills: TECHYNAF
	},

	alfred: {
		slug: 'alfred',
		name: 'Alfred',
		description: prose('alfred'),
		features: [
			'Requisition creation',
			'Approval workflow',
			'Budget tracking',
			'Status tracking',
			'Reporting and analytics',
			'Document management',
			'User access control'
		],
		kind: 'software',
		source: 'closed',
		company: companies.techynaf,
		skills: [...LARAVEL_BOOTSTRAP, SKILLS.react]
	},

	'user-validator': {
		slug: 'user-validator',
		name: 'User Validator',
		description: prose('user-validator'),
		features: [
			'Name based similarity indexing',
			'Weighted multi-factored validation',
			'Factor and weight customization'
		],
		kind: 'software',
		source: 'closed',
		company: companies.bracu,
		skills: BRACU
	},

	'lms-usage-report-generator': {
		slug: 'lms-usage-report-generator',
		name: 'LMS Usage Report Generator',
		description: prose('lms-usage-report-generator'),
		features: [],
		kind: 'software',
		source: 'closed',
		company: companies.bracu,
		skills: BRACU
	},

	'automated-course-management-scripts': {
		slug: 'automated-course-management-scripts',
		name: 'Automated Course Management Scripts',
		description: prose('automated-course-management-scripts'),
		features: [],
		kind: 'software',
		source: 'closed',
		company: companies.bracu,
		skills: [SKILLS.javascript, SKILLS.architecture, SKILLS.development, SKILLS.scrum]
	}
} satisfies Record<string, Project>;

export type ProjectId = keyof typeof projects;

/**
 * The same objects, widened to `Project`. `satisfies` keeps each entry's literal type so that
 * `projects.busso` is checked against the real keys, but that also means the union from
 * `Object.values` has no `url` on the members that lack one. Everything that iterates reads this
 * instead; everything that names one project reads the record.
 */
export const projectList: Project[] = Object.values(projects);
