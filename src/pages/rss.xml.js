import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../consts';
import { sortPostsByDate } from '../utils/blog';

export async function GET(context) {
	const posts = sortPostsByDate(await getCollection('blog'));

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		xmlns: {
			media: 'http://search.yahoo.com/mrss/',
		},
		customData: `<language>ru-ru</language>`,
		items: posts.map((post) => {
			const imageUrl = post.data.heroImage ? `${SITE_URL}/og/${post.id}.webp` : `${SITE_URL}/og-default.jpg`;
			return {
				title: post.data.title,
				description: post.data.description,
				pubDate: post.data.pubDate,
				link: `/blog/${post.id}/`,
				categories: [post.data.category],
				customData: `<media:content url="${imageUrl}" medium="image" width="1200" height="630" />`,
				enclosure: {
					url: imageUrl,
					type: 'image/webp',
					length: 0,
				},
			};
		}),
	});
}
