import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, '../src/content/blog');
const seoFile = path.join(__dirname, '../src/data/seo.ts');

const CATEGORY_SLUGS = {
	VPS: 'vps',
	DevOps: 'devops',
	Linux: 'linux',
	Docker: 'docker',
	Безопасность: 'bezopasnost',
	Облака: 'oblaka',
	Разработка: 'razrabotka',
};

function parseFrontmatter(content) {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return null;

	const frontmatter = match[1];
	const pubDate = frontmatter.match(/^pubDate:\s*(.+)$/m)?.[1]?.trim();
	const updatedDate = frontmatter.match(/^updatedDate:\s*(.+)$/m)?.[1]?.trim();
	const category = frontmatter.match(/^category:\s*(.+)$/m)?.[1]?.trim();
	const dateValue = updatedDate || pubDate;

	if (!dateValue) return null;

	return {
		date: new Date(dateValue),
		category,
	};
}

function maxDate(current, candidate) {
	if (!candidate || Number.isNaN(candidate.getTime())) return current;
	if (!current || candidate > current) return candidate;
	return current;
}

function parseGuideSlugs() {
	const content = fs.readFileSync(seoFile, 'utf8');
	const guides = [];
	const blockPattern =
		/slug:\s*'([^']+)'[\s\S]*?articleSlugs:\s*\[([\s\S]*?)\]/g;

	for (const match of content.matchAll(blockPattern)) {
		const slug = match[1];
		const articles = [...match[2].matchAll(/'([a-z0-9-]+)'/g)].map((item) => item[1]);
		guides.push({ slug, articles });
	}

	return guides;
}

/** pathname (with trailing slash) → Date */
export function buildLastmodMap() {
	const map = new Map();
	const articleDates = new Map();
	const categoryDates = new Map();
	let latestDate = null;

	for (const slug of fs.readdirSync(blogDir)) {
		const file = path.join(blogDir, slug, 'index.md');
		if (!fs.existsSync(file)) continue;

		const parsed = parseFrontmatter(fs.readFileSync(file, 'utf8'));
		if (!parsed) continue;

		const { date, category } = parsed;
		articleDates.set(slug, date);
		map.set(`/blog/${slug}/`, date);
		latestDate = maxDate(latestDate, date);

		if (category && CATEGORY_SLUGS[category]) {
			const categorySlug = CATEGORY_SLUGS[category];
			categoryDates.set(categorySlug, maxDate(categoryDates.get(categorySlug), date));
		}
	}

	for (const [categorySlug, date] of categoryDates) {
		map.set(`/blog/category/${categorySlug}/`, date);
	}

	for (const guide of parseGuideSlugs()) {
		let guideDate = null;
		for (const articleSlug of guide.articles) {
			guideDate = maxDate(guideDate, articleDates.get(articleSlug));
		}
		if (guideDate) {
			map.set(`/blog/guide/${guide.slug}/`, guideDate);
		}
	}

	if (latestDate) {
		for (const pathname of ['/', '/blog/', '/about/', '/author/', '/tools/']) {
			map.set(pathname, latestDate);
		}
	}

	return map;
}
