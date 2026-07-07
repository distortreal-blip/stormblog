import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, '../src/content/blog');
const output = path.join(__dirname, '../public/sitemap-images.xml');
const siteUrl = 'https://blog.stormnetcloud.com';

const xmlEscape = (value) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

function parseArticle(filePath) {
	const content = fs.readFileSync(filePath, 'utf8');
	const title = content.match(/^title:\s*"(.+)"$/m)?.[1] ?? '';
	const category = content.match(/^category:\s*(.+)$/m)?.[1]?.trim() ?? 'VPS';
	const imageAlt = content.match(/^imageAlt:\s*"(.+)"$/m)?.[1];
	const hasCover = fs.existsSync(path.join(path.dirname(filePath), 'cover.webp'));
	return { title, category, imageAlt, hasCover };
}

const urls = [];

for (const slug of fs.readdirSync(blogDir).sort()) {
	const mdFile = path.join(blogDir, slug, 'index.md');
	if (!fs.existsSync(mdFile)) continue;

	const { title, category, imageAlt, hasCover } = parseArticle(mdFile);
	if (!hasCover) continue;

	const pageUrl = `${siteUrl}/blog/${slug}/`;
	const imageUrl = `${siteUrl}/og/${slug}.webp`;
	const caption =
		imageAlt ?? `${title} — иллюстрация к статье Storm Cloud Blog, категория ${category}`;

	urls.push(`<url>
  <loc>${pageUrl}</loc>
  <image:image>
    <image:loc>${imageUrl}</image:loc>
    <image:title>${xmlEscape(title)}</image:title>
    <image:caption>${xmlEscape(caption)}</image:caption>
  </image:image>
</url>`);
}

const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`;

fs.writeFileSync(output, body, 'utf8');
console.log(`Generated ${output} (${urls.length} URLs)`);
