import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, '../src/content/blog');
const ogDir = path.join(__dirname, '../public/og');
const siteUrl = 'https://blog.stormnetcloud.com';

/** slug → { title, description, imageUrl } for sitemap / RSS */
export async function buildArticleImageMap() {
	fs.mkdirSync(ogDir, { recursive: true });
	const map = new Map();

	for (const slug of fs.readdirSync(blogDir)) {
		const dir = path.join(blogDir, slug);
		const mdFile = path.join(dir, 'index.md');
		const coverFile = path.join(dir, 'cover.webp');
		if (!fs.existsSync(mdFile)) continue;

		const content = fs.readFileSync(mdFile, 'utf8');
		const title = content.match(/^title:\s*"(.+)"$/m)?.[1] ?? slug;
		const description = content.match(/^description:\s*"(.+)"$/m)?.[1] ?? title;

		if (fs.existsSync(coverFile)) {
			const out = path.join(ogDir, `${slug}.webp`);
			await sharp(coverFile)
				.resize(1200, 630, { fit: 'cover' })
				.webp({ quality: 88 })
				.toFile(out);
			map.set(slug, {
				title,
				description,
				imageUrl: `${siteUrl}/og/${slug}.webp`,
			});
		}
	}

	return map;
}

const isMain =
	process.argv[1] &&
	path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
	const map = await buildArticleImageMap();
	console.log(`Generated ${map.size} article OG images in public/og/`);
}
