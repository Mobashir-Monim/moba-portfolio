import { robots } from '$lib/seo';

/**
 * An endpoint rather than a file in `static/`, for the one reason a four-line text file is worth
 * a route: it names the sitemap, the sitemap URL is absolute by spec, and a static file cannot
 * import `SITE_URL`. Prerendered, so this is still a static file by the time it is served.
 */
export const prerender = true;

export function GET() {
	return new Response(robots(), {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
}
