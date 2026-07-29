import { sitemap } from '$lib/seo';

/**
 * Prerendered like everything else, so this is a static file at build time and no Worker runs to
 * serve it. The body is built in `$lib/seo` rather than here, because a route handler is not
 * testable and the URL set is the one thing about a sitemap worth a test.
 */
export const prerender = true;

export function GET() {
	return new Response(sitemap(), {
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
}
