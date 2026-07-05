import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blog = path.join(__dirname, '../src/content/blog');

const updatedDateSlugs = [
	'choose-vps',
	'hosting-to-vps',
	'hourly-vps',
	'vps-first-steps',
	'vps-mistakes',
];

for (const slug of updatedDateSlugs) {
	const file = path.join(blog, slug, 'index.md');
	let md = fs.readFileSync(file, 'utf8');
	if (!md.includes('updatedDate:')) {
		md = md.replace(/(pubDate: [^\n]+\n)/, '$1updatedDate: 2026-07-06\n');
		fs.writeFileSync(file, md);
		console.log('updatedDate:', slug);
	}
}

const tableInserts = {
	'cursor-claude-chatgpt-2026': `

---

## Сравнение инструментов

| Инструмент | Лучше всего для | Стоимость | Контекст проекта |
| --- | --- | --- | --- |
| Cursor | Ежедневная разработка в IDE | Подписка | Весь проект в редакторе |
| Claude Code | Сложный анализ и архитектура | Подписка/API | Большие кодовые базы |
| ChatGPT | Обучение и быстрые ответы | Free/Plus | Отдельные задачи и примеры |

`,
	'vps-ili-vds-raznitsa': `

---

## VPS vs VDS vs выделенный сервер

| Тип | Изоляция | Цена | Когда выбирать |
| --- | --- | --- | --- |
| VPS/VDS | Виртуальная | Низкая | Сайты, API, dev/stage |
| Dedicated | Физическая | Высокая | Высокая нагрузка, compliance |
| Shared hosting | Минимальная | Очень низкая | Простой сайт без root |

`,
	'desheviy-vps': `

---

## Дешёвый VPS: плюсы и минусы

| | Плюсы | Минусы |
| --- | --- | --- |
| Очень дешёвые тарифы | Низкий входной порог | Overselling, слабый CPU |
| Почасовая оплата | Платите только за время | Нужно следить за биллингом |
| Базовый VPS 1/1 | Хватит для тестов | Мало RAM для Docker/LLM |

`,
};

for (const [slug, block] of Object.entries(tableInserts)) {
	const file = path.join(blog, slug, 'index.md');
	let md = fs.readFileSync(file, 'utf8');
	const marker =
		slug === 'cursor-claude-chatgpt-2026'
			? '## Сравнение инструментов'
			: slug === 'vps-ili-vds-raznitsa'
				? 'VPS vs VDS vs выделенный сервер'
				: 'плюсы и минусы';
	if (!md.includes(marker)) {
		const heading = slug === 'cursor-claude-chatgpt-2026' ? '## Итоги' : '## Итог';
		md = md.replace(new RegExp(`\\n${heading}\\n`), `${block}\n${heading}\n`);
		fs.writeFileSync(file, md);
		console.log('table:', slug);
	}
}
