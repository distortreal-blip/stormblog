import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.join(__dirname, '../src/content/blog');

async function convertFolder(articleDir) {
	const pngPath = path.join(articleDir, 'cover.png');
	const webpPath = path.join(articleDir, 'cover.webp');
	const indexPath = path.join(articleDir, 'index.md');

	if (!fs.existsSync(pngPath)) return null;

	await sharp(pngPath)
		.resize(1200, 630, { fit: 'cover', position: 'centre' })
		.webp({ quality: 82 })
		.toFile(webpPath);

	if (fs.existsSync(indexPath)) {
		const md = fs.readFileSync(indexPath, 'utf8');
		fs.writeFileSync(
			indexPath,
			md.replace(/heroImage:\s*\.\/cover\.png/g, 'heroImage: ./cover.webp'),
			'utf8',
		);
	}

	fs.unlinkSync(pngPath);
	return path.basename(articleDir);
}

const converted = [];

for (const entry of fs.readdirSync(blogRoot)) {
	const full = path.join(blogRoot, entry);
	if (!fs.statSync(full).isDirectory()) continue;
	const slug = await convertFolder(full);
	if (slug) converted.push(slug);
}

console.log(`Converted ${converted.length} covers to WebP:`);
converted.forEach((slug) => console.log(`  - ${slug}`));
