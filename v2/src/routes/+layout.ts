// Whole site is static content. Every route prerenders unless it explicitly opts out
// (the mail send endpoint will set `prerender = false`).
export const prerender = true;
