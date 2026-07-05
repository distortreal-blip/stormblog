// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Storm Cloud Блог';
export const SITE_DESCRIPTION =
	'Практические руководства, обзоры и инструкции о VPS, серверах, DevOps, разработке и облачной инфраструктуре.';
export const SITE_KEYWORDS =
	'VPS, аренда сервера, облачный сервер, DevOps, инфраструктура, безопасность сервера, почасовая аренда VPS, Storm Cloud, программирование, junior разработчик, pet project, искусственный интеллект, Cursor, ChatGPT, Claude, Linux, Docker, настройка сервера, облачная инфраструктура, IT блог, разработка';
export const SITE_URL = 'https://blog.stormnetcloud.com';
export const MAIN_SITE_URL = 'https://stormnetcloud.com/';
export const INSTAGRAM_URL = 'https://www.instagram.com/stormnet_cloud';
export const TIKTOK_URL = 'https://www.tiktok.com/@stormnetcloud';
export const TELEGRAM_URL = 'https://t.me/stormnetofficial';
export const OG_IMAGE = `${SITE_URL}/favicon.svg`;
export const YANDEX_METRIKA_ID = 110407455;

export const SITE_AUTHOR_NAME = 'Редакция Storm Cloud';
export const SITE_AUTHOR_URL = `${SITE_URL}/author/`;
export const SITE_ORG_NAME = 'Storm Cloud';
export const SITE_ORG_URL = MAIN_SITE_URL;

/** Giscus: включите Discussions в GitHub-репо и заполните ID на https://giscus.app */
export const GISCUS_ENABLED = false;
export const GISCUS_REPO = 'distortreal-blip/stormblog';
export const GISCUS_REPO_ID = '';
export const GISCUS_CATEGORY = 'Announcements';
export const GISCUS_CATEGORY_ID = '';

export const BLOG_CATEGORIES = [
	{ slug: 'vps', label: 'VPS' },
	{ slug: 'devops', label: 'DevOps' },
	{ slug: 'linux', label: 'Linux' },
	{ slug: 'docker', label: 'Docker' },
	{ slug: 'bezopasnost', label: 'Безопасность' },
	{ slug: 'oblaka', label: 'Облака' },
	{ slug: 'razrabotka', label: 'Разработка' },
] as const;

export type BlogCategorySlug = (typeof BLOG_CATEGORIES)[number]['slug'];
export type BlogCategoryLabel = (typeof BLOG_CATEGORIES)[number]['label'];

export const BLOG_CATEGORY_LABELS = BLOG_CATEGORIES.map((category) => category.label) as [
	BlogCategoryLabel,
	...BlogCategoryLabel[],
];
