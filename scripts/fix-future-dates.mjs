import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, '../src/content/blog');

/** Не публиковать даты «из будущего» — согласовано с реальной датой деплоя */
const TODAY = new Date('2026-07-07T12:00:00Z');

function formatDate(date) {
	return date.toISOString().slice(0, 10);
}

function shiftFutureDate(dateStr) {
	const date = new Date(`${dateStr}T12:00:00Z`);
	if (date <= TODAY) return dateStr;

	const daysAhead = Math.round((date.getTime() - TODAY.getTime()) / 86_400_000);
	const shifted = new Date(TODAY);
	shifted.setUTCDate(shifted.getUTCDate() - daysAhead);
	return formatDate(shifted);
}

let pubFixed = 0;
let updatedRemoved = 0;
let updatedFixed = 0;

for (const slug of fs.readdirSync(blogDir)) {
	const file = path.join(blogDir, slug, 'index.md');
	if (!fs.existsSync(file)) continue;

	let content = fs.readFileSync(file, 'utf8');
	let changed = false;

	const pubMatch = content.match(/^pubDate:\s*(\d{4}-\d{2}-\d{2})$/m);
	if (pubMatch) {
		const next = shiftFutureDate(pubMatch[1]);
		if (next !== pubMatch[1]) {
			content = content.replace(/^pubDate:\s*.+$/m, `pubDate: ${next}`);
			pubFixed++;
			changed = true;
		}
	}

	if (/^updatedDate:\s*2026-07-13$/m.test(content)) {
		content = content.replace(/^updatedDate:\s*2026-07-13\r?\n/m, '');
		updatedRemoved++;
		changed = true;
	} else {
		const updMatch = content.match(/^updatedDate:\s*(\d{4}-\d{2}-\d{2})$/m);
		if (updMatch) {
			const next = shiftFutureDate(updMatch[1]);
			if (next !== updMatch[1]) {
				content = content.replace(/^updatedDate:\s*.+$/m, `updatedDate: ${next}`);
				updatedFixed++;
				changed = true;
			}
		}
	}

	if (changed) {
		fs.writeFileSync(file, content, 'utf8');
	}
}

console.log(`Fixed future pubDate: ${pubFixed}`);
console.log(`Removed fake updatedDate 2026-07-13: ${updatedRemoved}`);
console.log(`Fixed future updatedDate: ${updatedFixed}`);
