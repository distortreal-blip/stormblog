import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist');
const site = 'https://blog.stormnetcloud.com';
const key = process.env.INDEXNOW_KEY || 'stormblogindexnow2026';
const keyFile = path.join(__dirname, '../public', `${key}.txt`);

if (!fs.existsSync(keyFile)) {
	fs.writeFileSync(keyFile, key, 'utf8');
	console.log('Created IndexNow key file:', keyFile);
}

function collectSitemapFiles(dir) {
	const files = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectSitemapFiles(fullPath));
		} else if (/^sitemap.*\.xml$/i.test(entry.name)) {
			files.push(fullPath);
		}
	}
	return files;
}

function extractUrlsFromSitemap(xml) {
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

const sitemapFiles = collectSitemapFiles(distDir);
if (sitemapFiles.length === 0) {
	console.warn('IndexNow: no sitemap files in dist/, skipping ping');
	process.exit(0);
}

const urls = [...new Set(sitemapFiles.flatMap((file) => extractUrlsFromSitemap(fs.readFileSync(file, 'utf8'))))];

if (urls.length === 0) {
	console.warn('IndexNow: no URLs found, skipping ping');
	process.exit(0);
}

const payload = {
	host: new URL(site).host,
	key,
	keyLocation: `${site}/${key}.txt`,
	urlList: urls.slice(0, 10_000),
};

const response = await fetch('https://api.indexnow.org/indexnow', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json; charset=utf-8' },
	body: JSON.stringify(payload),
});

if (response.ok || response.status === 202) {
	console.log(`IndexNow: submitted ${payload.urlList.length} URLs (${response.status})`);
} else {
	const body = await response.text();
	console.warn(`IndexNow: ping failed ${response.status}`, body);
}
