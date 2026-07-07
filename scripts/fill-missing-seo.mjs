import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, '../src/content/blog');
const seoFile = path.join(__dirname, '../src/data/seo.ts');

const CATEGORY_RELATED = {
	VPS: ['choose-vps', 'vps-first-steps', 'razvernut-sayt-na-vps-2026', 'ssl-letsencrypt-vps', 'nginx-ili-caddy', 'cloudflare-i-vps'],
	DevOps: ['docker-compose-vps', 'nginx-ili-caddy', 'ssl-letsencrypt-vps', 'grafana-prometheus-vps', 'backup-vps-3-2-1', 'github-actions-cicd'],
	Linux: ['ubuntu-24-04-pervaya-nastroyka-vps', 'systemd-linux-servisy', 'journalctl-logi-linux-vps', 'linux-vps-dlya-novichka', 'zashchita-vps-ot-vzloma', 'vscode-ssh-vps'],
	Docker: ['docker-compose-vps', 'portainer-docker-vps', 'docker-multi-stage-builds', 'nginx-ili-caddy', 'backup-vps-3-2-1', 'grafana-prometheus-vps'],
	'Безопасность': ['zashchita-vps-ot-vzloma', 'fail2ban-ot-bruteforce-vps', 'nftables-firewall-vps', 'ssl-letsencrypt-vps', 'wireguard-vpn-na-vps', 'crowdsec-zashchita-vps'],
	Облака: ['choose-vps', 'cloudflare-i-vps', 'reduce-vps-costs', 'vps-evropa-ili-rossiya', 'pochasovaya-arenda-vps', 'hosting-to-vps'],
	Разработка: ['junior-developer-2026', 'pet-projects-for-job', 'github-actions-cicd', 'vscode-ssh-vps', 'idea-to-service-evening', 'learn-programming-faster'],
};

function parseArticle(filePath) {
	const content = fs.readFileSync(filePath, 'utf8');
	return {
		title: content.match(/^title:\s*"(.+)"$/m)?.[1] ?? '',
		description: content.match(/^description:\s*"(.+)"$/m)?.[1] ?? '',
		category: content.match(/^category:\s*(.+)$/m)?.[1]?.trim() ?? 'VPS',
	};
}

function escapeStr(s) {
	return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function generateFaq(slug, meta) {
	const { title, description, category } = meta;
	const shortTitle = title.split(':')[0].split('—')[0].trim();
	return [
		{
			question: `Для чего нужна статья «${shortTitle}»?`,
			answer: description.slice(0, 280) + (description.length > 280 ? '…' : ''),
		},
		{
			question: `Подходит ли материал про ${shortTitle.toLowerCase()} для VPS в 2026?`,
			answer: `Да. Статья в категории «${category}» актуальна для self-hosted и облачных VPS: пошаговые команды, типичные ошибки и ссылки на смежные гайды Storm Cloud Blog.`,
		},
	];
}

function generateLinks(slug, category, allSlugs) {
	const pool = (CATEGORY_RELATED[category] ?? CATEGORY_RELATED.VPS).filter(
		(s) => s !== slug && allSlugs.includes(s),
	);
	if (pool.length >= 6) return pool.slice(0, 6);
	const extra = allSlugs.filter((s) => s !== slug && !pool.includes(s)).slice(0, 6 - pool.length);
	return [...pool, ...extra].slice(0, 6);
}

function formatFaqEntry(slug, items) {
	const lines = items.map(
		(item) => `\t\t{\n\t\t\tquestion: '${escapeStr(item.question)}',\n\t\t\tanswer: '${escapeStr(item.answer)}',\n\t\t},`,
	);
	return `\t'${slug}': [\n${lines.join('\n')}\n\t],`;
}

function formatLinksEntry(slug, links) {
	return `\t'${slug}': [\n${links.map((l) => `\t\t'${l}',`).join('\n')}\n\t],`;
}

const seo = fs.readFileSync(seoFile, 'utf8');
const faqPart = seo.split('export const RECOMMENDED_LINKS')[0];
const recPart = seo.split('export const RECOMMENDED_LINKS')[1].split('export const GUIDES')[0];

const allSlugs = fs
	.readdirSync(blogDir)
	.filter((d) => fs.existsSync(path.join(blogDir, d, 'index.md')))
	.sort();

const missingFaq = allSlugs.filter((s) => !faqPart.includes(`'${s}':`));
const missingRec = allSlugs.filter((s) => !recPart.includes(`'${s}':`));

if (missingFaq.length === 0 && missingRec.length === 0) {
	console.log('All articles already have FAQ and RECOMMENDED_LINKS');
	process.exit(0);
}

console.log('Missing FAQ:', missingFaq.length);
console.log('Missing RECOMMENDED_LINKS:', missingRec.length);

let newSeo = seo;

if (missingFaq.length > 0) {
	const faqEntries = missingFaq.map((slug) => {
		const meta = parseArticle(path.join(blogDir, slug, 'index.md'));
		return formatFaqEntry(slug, generateFaq(slug, meta));
	});
	newSeo = newSeo.replace(
		/\n};\n\n\/\*\* Ручная перелинковка/,
		`,\n${faqEntries.join('\n')}\n};\n\n/** Ручная перелинковка`,
	);
}

if (missingRec.length > 0) {
	const recEntries = missingRec.map((slug) => {
		const meta = parseArticle(path.join(blogDir, slug, 'index.md'));
		return formatLinksEntry(slug, generateLinks(slug, meta.category, allSlugs));
	});
	newSeo = newSeo.replace(
		/\n};\n\nexport const GUIDES/,
		`,\n${recEntries.join('\n')}\n};\n\nexport const GUIDES`,
	);
}

fs.writeFileSync(seoFile, newSeo, 'utf8');
console.log('Updated src/data/seo.ts');
