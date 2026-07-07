import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, '../dist/sitemap-index.xml');
const imageSitemapUrl = 'https://blog.stormnetcloud.com/sitemap-images.xml';

if (!fs.existsSync(indexPath)) {
	console.warn('patch-sitemap-index: dist/sitemap-index.xml not found, skipping');
	process.exit(0);
}

let xml = fs.readFileSync(indexPath, 'utf8');

if (xml.includes(imageSitemapUrl)) {
	console.log('sitemap-index already includes image sitemap');
	process.exit(0);
}

const entry = `<sitemap><loc>${imageSitemapUrl}</loc></sitemap>`;
xml = xml.replace('</sitemapindex>', `${entry}</sitemapindex>`);
fs.writeFileSync(indexPath, xml, 'utf8');
console.log('Added sitemap-images.xml to sitemap-index.xml');
