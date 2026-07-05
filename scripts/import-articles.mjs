import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.join(__dirname, '../src/content/blog');

const vpsSourceRoot = 'C:/Users/User/Desktop/Статьи';
const itSourceRoot = 'C:/Users/User/Desktop/Статьи/IT';

const vpsArticles = [
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

const itArticles = [
	{
		folder: '10 pet-проектов, которые реально помогут найти работу',
		slug: 'pet-projects-for-job',
		category: 'Разработка',
		pubDate: '2026-07-05',
	},
	{
		folder: 'Cursor, Claude Code или ChatGPT что выбрать программисту в 2026 году',
		slug: 'cursor-claude-chatgpt-2026',
		category: 'Разработка',
		pubDate: '2026-07-05',
	},
	{
		folder: 'Как научиться программировать быстрее и не выгореть',
		slug: 'learn-programming-faster',
		category: 'Разработка',
		pubDate: '2026-07-05',
	},
	{
		folder: 'Как не потерять код во время разработки 10 правил, которые должен знать каждый программист',
		slug: 'dont-lose-code-rules',
		category: 'DevOps',
		pubDate: '2026-07-05',
	},
	{
		folder: 'Как превратить идею в работающий сервис за один вечер',
		slug: 'idea-to-service-evening',
		category: 'Облака',
		pubDate: '2026-07-05',
	},
	{
		folder: 'Как программисты используют ИИ каждый день 15 реальных сценариев',
		slug: 'ai-for-programmers-daily',
		category: 'Разработка',
		pubDate: '2026-07-05',
	},
	{
		folder: 'Ошибки, которые совершают почти все начинающие разработчики',
		slug: 'beginner-dev-mistakes',
		category: 'Разработка',
		pubDate: '2026-07-05',
	},
	{
		folder: 'Почему большинство pet-проектов так и не доходят до релиза',
		slug: 'pet-projects-no-release',
		category: 'Разработка',
		pubDate: '2026-07-05',
	},
	{
		folder: 'Почему хороший программист сегодня больше читает документацию, чем пишет код',
		slug: 'read-docs-not-code',
		category: 'Разработка',
		pubDate: '2026-07-05',
	},
	{
		folder: 'Что должен знать junior-разработчик в 2026 году',
		slug: 'junior-developer-2026',
		category: 'Разработка',
		pubDate: '2026-07-05',
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

function slugify(text) {
	return text
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
}

function parseSource(raw) {
	let content = raw.replace(/\r\n/g, '\n').trim();
	let sourceTitle = '';
	let sourceDescription = '';

	if (content.startsWith('---')) {
		const end = content.indexOf('\n---', 3);
		if (end !== -1) {
			const yaml = content.slice(3, end).trim();
			const titleMatch = yaml.match(/^title:\s*(.+)$/m);
			const descMatch = yaml.match(/^description:\s*(.+)$/m);
			if (titleMatch) sourceTitle = titleMatch[1].replace(/^["']|["']$/g, '').trim();
			if (descMatch) sourceDescription = descMatch[1].replace(/^["']|["']$/g, '').trim();
			content = content.slice(end + 4).trim();
		}
	}

	const headingMatch = content.match(/^#\s+(.+)$/m);
	const title = sourceTitle || headingMatch?.[1]?.trim() || '';
	content = content.replace(/^#\s+.*\n+/, '');
	content = content.replace(/^#\s+Итог/gm, '## Итог');

	return { title, description: sourceDescription, body: content.trim() };
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

function importArticle({ folder, slug, category, pubDate }, sourceRoot) {
	const folderPath = path.join(sourceRoot, folder);
	const mdName = findMdFile(folderPath);
	if (!mdName) throw new Error(`Missing markdown file in ${folder}`);

	const raw = fs.readFileSync(path.join(folderPath, mdName), 'utf8');
	const { title: parsedTitle, description: parsedDescription, body } = parseSource(raw);
	const title = parsedTitle || folder;
	const description = parsedDescription || makeDescription(body);
	const finalSlug = slug ?? slugify(title);
	const outDir = path.join(blogRoot, finalSlug);

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
pubDate: ${pubDate}
category: ${category}
${heroImageLine}---

${body}
`;

	fs.writeFileSync(path.join(outDir, 'index.md'), frontmatter, 'utf8');
	console.log(`Wrote ${finalSlug}${coverSource ? ' + cover.webp' : ''}`);
}

for (const entry of fs.readdirSync(blogRoot)) {
	const full = path.join(blogRoot, entry);
	if (fs.statSync(full).isFile()) fs.unlinkSync(full);
	else if (fs.statSync(full).isDirectory()) fs.rmSync(full, { recursive: true, force: true });
}

for (const article of vpsArticles) {
	importArticle(article, vpsSourceRoot);
}

for (const article of itArticles) {
	importArticle(article, itSourceRoot);
}

console.log(`Done: ${vpsArticles.length + itArticles.length} articles`);
