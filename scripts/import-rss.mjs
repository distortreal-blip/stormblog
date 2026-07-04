import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const rssPath =
	'C:/Users/User/.cursor/projects/C-Users-User-AppData-Local-Temp-ce3ca676-01af-48f6-a6d7-7a54d697e59b/agent-tools/63077408-c720-4e1e-9ebb-bff3906a9317.txt';
const xml = fs.readFileSync(rssPath, 'utf8');
const outDir = path.join(projectRoot, 'src/content/blog');

const slugMap = {
	'Когда сайту пора переезжать с обычного хостинга на VPS': 'hosting-to-vps',
	'Что сделать сразу после запуска VPS': 'vps-first-steps',
	'VPS или обычный хостинг: что выбрать для сайта и проекта': 'vps-vs-hosting',
	'Когда VPS нужен всего на пару часов': 'hourly-vps',
	'Как правильно выбрать VPS и не переплатить за лишнее': 'choose-vps',
};

function decodeEntities(s) {
	return s
		.replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"');
}

function formatCodeBlock(code) {
	return code
		.replace(/(?<=RAM|GB|NVMe|\.)(?=[A-ZА-Я])/g, '\n')
		.replace(/(?<=[а-я])(?=Telegram|Docker|Тестовый|База|CPU —|RAM —|SSD|Трафик|Локация|сколько|что|режится|есть|Достаточно|Хватит|Какая|Есть|Можно|Нужно)/g, '\n')
		.trim();
}

function htmlToMd(html) {
	let t = html;
	t = t.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
		const cleaned = formatCodeBlock(decodeEntities(code.replace(/<[^>]+>/g, '')));
		return `\n\n\`\`\`\n${cleaned}\n\`\`\`\n\n`;
	});
	t = t.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n');
	t = t.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n');
	t = t.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => `\n\n${c.trim()}\n`);
	t = t.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
	t = t.replace(/<\/?ul[^>]*>/gi, '\n');
	t = t.replace(/<\/?ol[^>]*>/gi, '\n');
	t = t.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
	t = t.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
	t = t.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
	t = t.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
	t = t.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
	t = t.replace(/<br\s*\/?>/gi, '\n');
	t = t.replace(/<hr\s*\/?>/gi, '\n\n---\n\n');
	t = t.replace(/<figure[\s\S]*?<\/figure>/gi, '');
	t = t.replace(/<img[^>]*>/gi, '');
	t = t.replace(/<[^>]+>/g, '');
	t = decodeEntities(t);
	t = t.replace(/\n{3,}/g, '\n\n').trim();
	return t;
}

const demoFiles = [
	'first-post.md',
	'markdown-style-guide.md',
	'second-post.md',
	'third-post.md',
	'using-mdx.mdx',
];

for (const file of demoFiles) {
	const p = path.join(outDir, file);
	if (fs.existsSync(p)) fs.unlinkSync(p);
}

const items = xml.split('<item>').slice(1);

for (const item of items) {
	const title =
		item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
		item.match(/<title>(.*?)<\/title>/)?.[1];
	const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
	const content = item.match(
		/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/,
	)?.[1];
	const descRaw = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1];
	let description = '';
	if (descRaw) {
		description = decodeEntities(descRaw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).slice(
			0,
			200,
		);
	}

	const slug = slugMap[title] ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
	const md = htmlToMd(content || '');
	const date = new Date(pubDate).toISOString().slice(0, 10);
	const firstParagraph = md.split('\n\n').find((block) => block && !block.startsWith('#')) ?? '';
	const cleanDescription = description || firstParagraph.slice(0, 180).trim();
	const frontmatter = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(cleanDescription)}
pubDate: ${date}
---

${md}
`;

	fs.writeFileSync(path.join(outDir, `${slug}.md`), frontmatter, 'utf8');
	console.log(`Wrote ${slug}.md (${md.length} chars)`);
}
