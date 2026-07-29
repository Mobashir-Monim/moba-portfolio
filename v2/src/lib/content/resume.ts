import type { Resume } from '$lib/types/resume';
import { prose } from './prose';

export const resume: Resume = {
	slug: 'resume',
	name: 'Résumé',
	description: prose('resume'),
	file: '/resume.pdf',
	filename: 'Mobashir Monim - Resume.pdf'
};
