import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { nodes } from '../tree';
import { resume } from './resume';

/**
 * The one link on this site that points at a file rather than at a route, so nothing else can
 * catch it going stale: rename or drop `static/resume.pdf` and the build still succeeds, the page
 * still renders, and the download quietly 404s.
 */
describe('the résumé PDF', () => {
	test('exists in static/, at the path the record points at', () => {
		expect(resume.file.startsWith('/')).toBe(true);
		expect(existsSync(new URL(`../../../static${resume.file}`, import.meta.url))).toBe(true);
	});

	test('is saved under a name a person would recognise in a downloads folder', () => {
		expect(resume.filename).toMatch(/\.pdf$/);
		expect(resume.filename).toContain('Mobashir Monim');
	});
});

test('the résumé is a document at /resume, so the catch-all prerenders it', () => {
	const node = nodes[resume.slug];
	expect(node.kind).toBe('document');
	expect(node.href).toBe('/resume');
	expect(node.type === 'resume' && node.data).toBe(resume);
});
