import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, '../src/content/blog');
const updatedDate = '2026-07-13';

let patched = 0;

for (const slug of fs.readdirSync(blogDir)) {
	const file = path.join(blogDir, slug, 'index.md');
	if (!fs.existsSync(file)) continue;

	let content = fs.readFileSync(file, 'utf8');
	if (/^updatedDate:/m.test(content)) continue;

	content = content.replace(/^(pubDate: .+)$/m, `$1\nupdatedDate: ${updatedDate}`);
	fs.writeFileSync(file, content, 'utf8');
	patched++;
}

console.log(`Added updatedDate: ${updatedDate} to ${patched} articles`);
