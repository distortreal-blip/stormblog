import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = 'C:/Users/User/Desktop/Статьи';
const blogRoot = path.join(__dirname, '../src/content/blog');

const articles = [
	{
		folder: 'Когда VPS нужен всего на пару часов',
		slug: 'hourly-vps',
		category: 'Облака',
		pubDate: '2026-07-04',
	},
	{
		folder: 'Когда сайту пора переезжать с обычного хостинга на VPS',
		slug: 'hosting-to-vps',
		category: 'VPS',
		pubDate: '2026-07-04',
	},
	{
		folder: 'Что сделать сразу после запуска VPS',
		slug: 'vps-first-steps',
		category: 'DevOps',
		pubDate: '2026-07-04',
	},
	{
		folder: '10 ошибок при выборе VPS, которые совершают почти все',
		slug: 'vps-mistakes',
		category: 'VPS',
		pubDate: '2026-07-05',
	},
	{
		folder: 'Как правильно выбрать VPS и не переплатить за лишнее',
		slug: 'choose-vps',
		category: 'VPS',
		pubDate: '2026-07-04',
	},
];

function findMdFile(folderPath) {
	return fs.readdirSync(folderPath).find((file) => file.endsWith('.md'));
}

function findCoverFile(folderPath) {
	return fs
		.readdirSync(folderPath)
		.find((file) => /\.(webp|jpe?g|png|avif)$/i.test(file));
}

function cleanBody(raw) {
	let body = raw.replace(/\r\n/g, '\n').trim();
	body = body.replace(/^#\s+.*\n+/, '');
	body = body.replace(/^#\s+Итог/gm, '## Итог');
	return body.trim();
}

function makeDescription(body) {
	const paragraph = body
		.split('\n\n')
		.map((part) =>
			part
				.replace(/^#+\s+/gm, '')
				.replace(/[-*]\s+/g, '')
				.replace(/`/g, '')
				.trim(),
		)
		.find((part) => part && !part.startsWith('---') && part.length > 40);

	return (paragraph ?? body.slice(0, 160)).replace(/\s+/g, ' ').slice(0, 180).trim();
}

for (const entry of fs.readdirSync(blogRoot)) {
	const full = path.join(blogRoot, entry);
	if (fs.statSync(full).isFile()) fs.unlinkSync(full);
	else if (fs.statSync(full).isDirectory()) fs.rmSync(full, { recursive: true, force: true });
}

for (const article of articles) {
	const folderPath = path.join(sourceRoot, article.folder);
	const mdName = findMdFile(folderPath);
	if (!mdName) throw new Error(`Missing markdown file in ${article.folder}`);

	const raw = fs.readFileSync(path.join(folderPath, mdName), 'utf8');
	const titleMatch = raw.match(/^#\s+(.+)$/m);
	const title = titleMatch?.[1]?.trim() ?? article.folder;
	const body = cleanBody(raw);
	const description = makeDescription(body);
	const outDir = path.join(blogRoot, article.slug);

	fs.mkdirSync(outDir, { recursive: true });

	const coverSource = findCoverFile(folderPath);
	let heroImageLine = '';

	if (coverSource) {
		fs.copyFileSync(path.join(folderPath, coverSource), path.join(outDir, 'cover.webp'));
		heroImageLine = 'heroImage: ./cover.webp\n';
	}

	const frontmatter = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
pubDate: ${article.pubDate}
category: ${article.category}
${heroImageLine}---

${body}
`;

	fs.writeFileSync(path.join(outDir, 'index.md'), frontmatter, 'utf8');
	console.log(`Wrote ${article.slug}${coverSource ? ' + cover.webp' : ''}`);
}
