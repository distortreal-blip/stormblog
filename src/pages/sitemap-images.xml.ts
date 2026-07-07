import { getCollection } from 'astro:content';
import { SITE_URL } from '../consts';
import { getPostPath } from '../utils/blog';

const xmlEscape = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

export async function GET() {
	const posts = await getCollection('blog');
	const urls = posts
		.filter((post) => post.data.heroImage)
		.map((post) => {
			const pageUrl = new URL(getPostPath(post.id), SITE_URL).href;
			const imageUrl = `${SITE_URL}/og/${post.id}.webp`;
			const title = xmlEscape(post.data.title);
			const caption = xmlEscape(
				post.data.imageAlt ??
					`${post.data.title} — иллюстрация к статье Storm Cloud Blog, категория ${post.data.category}`,
			);
			return `<url>
  <loc>${pageUrl}</loc>
  <image:image>
    <image:loc>${imageUrl}</image:loc>
    <image:title>${title}</image:title>
    <image:caption>${caption}</image:caption>
  </image:image>
</url>`;
		})
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}
