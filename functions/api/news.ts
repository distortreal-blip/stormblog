interface NewsItem {
	title: string;
	url: string;
	source: string;
	publishedAt: string;
}

interface FeedConfig {
	name: string;
	url: string;
}

const FEEDS: FeedConfig[] = [
	{ name: 'Хабр', url: 'https://habr.com/ru/rss/articles/?fl=ru' },
	{ name: 'Хабр DevOps', url: 'https://habr.com/ru/rss/hub/devops/all/' },
	{ name: 'IXBT', url: 'https://www.ixbt.com/export/news.rss' },
];

const LIMIT = 8;
const CACHE_TTL = 3600;

function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': `public, max-age=${CACHE_TTL}, stale-while-revalidate=86400`,
		},
	});
}

function stripCdata(value: string) {
	return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function decodeHtml(value: string) {
	return value
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ');
}

function extractTag(block: string, tag: string) {
	const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
	if (!match) return '';
	return decodeHtml(stripCdata(match[1]).replace(/<[^>]+>/g, '').trim());
}

function extractLink(block: string) {
	const hrefMatch = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
	if (hrefMatch) return hrefMatch[1].trim();

	const linkTag = extractTag(block, 'link');
	if (linkTag.startsWith('http')) return linkTag;

	const guid = extractTag(block, 'guid');
	if (guid.startsWith('http')) return guid;

	return '';
}

function parseRss(xml: string, source: string): NewsItem[] {
	const items: NewsItem[] = [];
	const isAtom = /<feed[\s>]/i.test(xml);

	if (isAtom) {
		const entries = xml.split(/<entry[\s>]/i).slice(1);
		for (const entry of entries) {
			const block = entry.split(/<\/entry>/i)[0] ?? '';
			const title = extractTag(block, 'title');
			const url = extractLink(block);
			const publishedAt = extractTag(block, 'published') || extractTag(block, 'updated');
			if (title && url) items.push({ title, url, source, publishedAt });
		}
		return items;
	}

	const chunks = xml.split(/<item[\s>]/i).slice(1);
	for (const chunk of chunks) {
		const block = chunk.split(/<\/item>/i)[0] ?? '';
		const title = extractTag(block, 'title');
		const url = extractLink(block);
		const publishedAt = extractTag(block, 'pubDate');
		if (title && url) items.push({ title, url, source, publishedAt });
	}

	return items;
}

function parseDate(value: string) {
	const time = Date.parse(value);
	return Number.isNaN(time) ? 0 : time;
}

function normalizeUrl(url: string) {
	try {
		const parsed = new URL(url);
		parsed.search = '';
		parsed.hash = '';
		return parsed.href.replace(/\/$/, '');
	} catch {
		return url.split('?')[0]?.split('#')[0] ?? url;
	}
}

export const onRequest: PagesFunction = async () => {
	try {
		const results = await Promise.all(
			FEEDS.map(async (feed) => {
				try {
					const response = await fetch(feed.url, {
						headers: {
							'User-Agent': 'StormCloudBlog/1.0 (+https://blog.stormnetcloud.com)',
							Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
						},
						cf: { cacheTtl: CACHE_TTL, cacheEverything: true },
					});

					if (!response.ok) return [] as NewsItem[];
					const xml = await response.text();
					return parseRss(xml, feed.name);
				} catch {
					return [] as NewsItem[];
				}
			}),
		);

		const seen = new Set<string>();
		const items = results
			.flat()
			.filter((item) => {
				const key = normalizeUrl(item.url);
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			})
			.sort((a, b) => parseDate(b.publishedAt) - parseDate(a.publishedAt))
			.slice(0, LIMIT);

		return json({ items, updatedAt: new Date().toISOString() });
	} catch {
		return json({ items: [], updatedAt: new Date().toISOString(), error: 'fetch_failed' }, 500);
	}
};
