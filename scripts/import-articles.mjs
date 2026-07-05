import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.join(__dirname, '../src/content/blog');

const vpsSourceRoot = 'C:/Users/User/Desktop/Статьи';
const itSourceRoot = 'C:/Users/User/Desktop/Статьи/IT';
const new10SourceRoot = 'C:/Users/User/Desktop/Статьи/New10';
const vpsSeoSourceRoot = 'C:/Users/User/Desktop/Статьи/VPS10';

const vpsArticles = [
	{
		folder: 'Когда VPS нужен всего на пару часов',
		slug: 'hourly-vps',
		category: 'Облака',
		pubDate: '2026-07-04',
		keywords: [
			'VPS на час',
			'почасовая аренда VPS',
			'временный сервер',
			'тестовый VPS',
			'аренда VPS',
			'Storm Cloud',
		],
	},
	{
		folder: 'Когда сайту пора переезжать с обычного хостинга на VPS',
		slug: 'hosting-to-vps',
		category: 'VPS',
		pubDate: '2026-07-04',
		keywords: [
			'переезд на VPS',
			'хостинг vs VPS',
			'миграция на VPS',
			'когда нужен VPS',
			'VPS',
			'Storm Cloud',
		],
	},
	{
		folder: 'Что сделать сразу после запуска VPS',
		slug: 'vps-first-steps',
		category: 'DevOps',
		pubDate: '2026-07-04',
		keywords: [
			'настройка VPS',
			'первый запуск VPS',
			'безопасность VPS',
			'SSH',
			'firewall',
			'DevOps',
		],
	},
	{
		folder: '10 ошибок при выборе VPS, которые совершают почти все',
		slug: 'vps-mistakes',
		category: 'VPS',
		pubDate: '2026-07-05',
		keywords: [
			'ошибки при выборе VPS',
			'как выбрать VPS',
			'VPS для новичков',
			'аренда VPS',
			'облачный сервер',
			'Storm Cloud',
		],
	},
	{
		folder: 'Как правильно выбрать VPS и не переплатить за лишнее',
		slug: 'choose-vps',
		category: 'VPS',
		pubDate: '2026-07-04',
		keywords: [
			'выбор VPS',
			'сравнение VPS',
			'аренда VPS',
			'облачный сервер',
			'VPS без переплаты',
			'Storm Cloud',
		],
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

const new10Articles = [
	{
		folder: 'Как развернуть Telegram-бота на VPS за 30 минут',
		slug: 'telegram-bot-vps',
		category: 'VPS',
		pubDate: '2026-07-06',
	},
	{
		folder: 'WordPress на VPS или хостинг что выбрать в 2026',
		slug: 'wordpress-vps-2026',
		category: 'VPS',
		pubDate: '2026-07-06',
	},
	{
		folder: 'Docker Compose на VPS первый проект с нуля',
		slug: 'docker-compose-vps',
		category: 'Docker',
		pubDate: '2026-07-06',
	},
	{
		folder: 'Мониторинг VPS Uptime Kuma Grafana и алерты в Telegram',
		slug: 'vps-monitoring',
		category: 'DevOps',
		pubDate: '2026-07-06',
	},
	{
		folder: 'Как уменьшить расходы на VPS и облако 12 рабочих способов',
		slug: 'reduce-vps-costs',
		category: 'Облака',
		pubDate: '2026-07-06',
	},
	{
		folder: 'Ollama на своём VPS локальные LLM без ChatGPT',
		slug: 'ollama-vps',
		category: 'Разработка',
		pubDate: '2026-07-06',
	},
	{
		folder: 'MCP для разработчиков что это и зачем подключать к Cursor',
		slug: 'mcp-for-developers',
		category: 'Разработка',
		pubDate: '2026-07-06',
	},
	{
		folder: 'GitHub Actions с нуля CI CD для pet-проекта',
		slug: 'github-actions-cicd',
		category: 'DevOps',
		pubDate: '2026-07-06',
	},
	{
		folder: 'VS Code SSH Remote разработка прямо на VPS',
		slug: 'vscode-ssh-vps',
		category: 'Разработка',
		pubDate: '2026-07-06',
	},
	{
		folder: 'n8n на своём VPS автоматизация без Zapier',
		slug: 'n8n-self-hosted',
		category: 'Облака',
		pubDate: '2026-07-06',
	},
];

const vpsSeoArticles = [
	{
		folder: 'Сервер на час когда VPS не нужен на месяц',
		slug: 'server-na-chas',
		category: 'Облака',
		pubDate: '2026-07-06',
	},
	{
		folder: 'Почасовая аренда VPS как работает и кому выгодна',
		slug: 'pochasovaya-arenda-vps',
		category: 'Облака',
		pubDate: '2026-07-06',
	},
	{
		folder: 'Что можно успеть сделать на VPS за 1 час',
		slug: 'chto-sdelat-na-vps-za-chas',
		category: 'VPS',
		pubDate: '2026-07-06',
	},
	{
		folder: 'Дешевый VPS где реально экономия а где ловушка',
		slug: 'desheviy-vps',
		category: 'VPS',
		pubDate: '2026-07-06',
	},
	{
		folder: 'VPS для программиста 10 задач для которых не нужен дорогой сервер',
		slug: 'vps-dlya-programmista',
		category: 'VPS',
		pubDate: '2026-07-06',
	},
	{
		folder: 'VPS для сайта когда обычного хостинга уже не хватает',
		slug: 'vps-dlya-sayta',
		category: 'VPS',
		pubDate: '2026-07-06',
	},
	{
		folder: 'VPS VDS в чем разница простыми словами',
		slug: 'vps-ili-vds-raznitsa',
		category: 'VPS',
		pubDate: '2026-07-06',
	},
	{
		folder: 'Linux VPS для новичка что сделать сразу после запуска',
		slug: 'linux-vps-dlya-novichka',
		category: 'Linux',
		pubDate: '2026-07-06',
	},
	{
		folder: 'VPS в Европе или России что выбрать для проекта',
		slug: 'vps-evropa-ili-rossiya',
		category: 'Облака',
		pubDate: '2026-07-06',
	},
	{
		folder: 'Почему аренда сервера на пару часов выгоднее месячной оплаты',
		slug: 'arenda-servera-na-paru-chasov',
		category: 'Облака',
		pubDate: '2026-07-06',
	},
];

function findMdFile(folderPath) {
	const files = fs.readdirSync(folderPath).filter((file) => file.endsWith('.md'));
	return files.find((file) => file === 'article.md') ?? files[0];
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

function parseKeywordsBlock(yaml) {
	const keywords = [];
	let inKeywords = false;

	for (const line of yaml.split('\n')) {
		if (/^keywords:\s*$/.test(line.trim())) {
			inKeywords = true;
			continue;
		}

		if (inKeywords) {
			const match = line.match(/^\s*-\s+(.+)$/);
			if (match) {
				keywords.push(match[1].replace(/^["']|["']$/g, '').trim());
				continue;
			}

			if (line.trim() && !/^\s/.test(line)) {
				break;
			}
		}
	}

	return keywords;
}

function parseSource(raw) {
	let content = raw.replace(/\r\n/g, '\n').trim();
	let sourceTitle = '';
	let sourceDescription = '';
	let sourceKeywords = [];

	if (content.startsWith('---')) {
		const end = content.indexOf('\n---', 3);
		if (end !== -1) {
			const yaml = content.slice(3, end).trim();
			const titleMatch = yaml.match(/^title:\s*(.+)$/m);
			const descMatch = yaml.match(/^description:\s*(.+)$/m);
			const keywordsMatch = yaml.match(/^keywords:\s*(.+)$/m);
			if (titleMatch) sourceTitle = titleMatch[1].replace(/^["']|["']$/g, '').trim();
			if (descMatch) sourceDescription = descMatch[1].replace(/^["']|["']$/g, '').trim();
			if (keywordsMatch) {
				const rawKeywords = keywordsMatch[1].replace(/^["']|["']$/g, '').trim();
				if (rawKeywords && !rawKeywords.startsWith('-')) {
					sourceKeywords = rawKeywords
						.split(',')
						.map((keyword) => keyword.trim())
						.filter(Boolean);
				}
			}
			if (!sourceKeywords.length) sourceKeywords = parseKeywordsBlock(yaml);
			content = content.slice(end + 4).trim();
		}
	}

	const headingMatch = content.match(/^#\s+(.+)$/m);
	const title = sourceTitle || headingMatch?.[1]?.trim() || '';
	content = content.replace(/^#\s+.*\n+/, '');
	content = content.replace(/^#\s+Итог/gm, '## Итог');

	return { title, description: sourceDescription, keywords: sourceKeywords, body: content.trim() };
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

function formatKeywordsYaml(keywords) {
	if (!keywords.length) return '';
	return `keywords:\n${keywords.map((keyword) => `  - ${JSON.stringify(keyword)}`).join('\n')}\n`;
}

async function copyCoverImage(folderPath, outDir) {
	const coverSource = findCoverFile(folderPath);
	if (!coverSource) return '';

	const sourcePath = path.join(folderPath, coverSource);
	const ext = path.extname(coverSource).toLowerCase();
	const webpPath = path.join(outDir, 'cover.webp');

	if (ext === '.webp') {
		fs.copyFileSync(sourcePath, webpPath);
	} else {
		await sharp(sourcePath)
			.resize(1200, 630, { fit: 'cover', position: 'centre' })
			.webp({ quality: 82 })
			.toFile(webpPath);
	}

	return 'heroImage: ./cover.webp\n';
}

async function importArticle({ folder, slug, category, pubDate, keywords: fallbackKeywords = [] }, sourceRoot) {
	const folderPath = path.join(sourceRoot, folder);
	const mdName = findMdFile(folderPath);
	if (!mdName) throw new Error(`Missing markdown file in ${folder}`);

	const raw = fs.readFileSync(path.join(folderPath, mdName), 'utf8');
	const { title: parsedTitle, description: parsedDescription, keywords: parsedKeywords, body } =
		parseSource(raw);
	const title = parsedTitle || folder;
	const description = parsedDescription || makeDescription(body);
	const keywords = parsedKeywords.length ? parsedKeywords : fallbackKeywords;
	const finalSlug = slug ?? slugify(title);
	const outDir = path.join(blogRoot, finalSlug);

	fs.mkdirSync(outDir, { recursive: true });

	const coverSource = findCoverFile(folderPath);
	const heroImageLine = await copyCoverImage(folderPath, outDir);

	const frontmatter = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
pubDate: ${pubDate}
category: ${category}
${formatKeywordsYaml(keywords)}${heroImageLine}---

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
	await importArticle(article, vpsSourceRoot);
}

for (const article of itArticles) {
	await importArticle(article, itSourceRoot);
}

for (const article of new10Articles) {
	await importArticle(article, new10SourceRoot);
}

for (const article of vpsSeoArticles) {
	await importArticle(article, vpsSeoSourceRoot);
}

console.log(
	`Done: ${vpsArticles.length + itArticles.length + new10Articles.length + vpsSeoArticles.length} articles`,
);
