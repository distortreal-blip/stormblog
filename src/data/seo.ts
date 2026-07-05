export interface FaqItem {
	question: string;
	answer: string;
}

export interface GuideConfig {
	slug: string;
	title: string;
	description: string;
	intro: string;
	articleSlugs: string[];
	keywords: string[];
}

/** FAQ по slug статьи — показывается в конце + Schema.org FAQPage */
export const ARTICLE_FAQ: Record<string, FaqItem[]> = {
	'junior-developer-2026': [
		{
			question: 'Нужно ли знать Docker junior-разработчику?',
			answer:
				'Базовое понимание контейнеров и docker compose — да. Глубокий Kubernetes для первой работы обычно не требуется.',
		},
		{
			question: 'Можно ли найти работу без pet-проектов?',
			answer:
				'Сложнее, но возможно при сильном портфолио на работе или open source. Pet-проекты сильно повышают шансы junior.',
		},
		{
			question: 'Какой язык программирования выбрать в 2026 году?',
			answer:
				'Python или JavaScript для старта, Go или Java — если целитесь в backend. Главное — один язык до уверенного уровня.',
		},
	],
	'cursor-claude-chatgpt-2026': [
		{
			question: 'Стоит ли платить за Cursor вместо бесплатного ChatGPT?',
			answer:
				'Если пишете код каждый день — да. Cursor экономит время на навигации по проекту и правках в нескольких файлах.',
		},
		{
			question: 'Можно ли использовать только ChatGPT для разработки?',
			answer:
				'Да, для обучения и небольших задач. Для ежедневной работы с кодовой базой IDE с ИИ удобнее.',
		},
		{
			question: 'Claude Code или Cursor — что лучше?',
			answer:
				'Cursor — для ежедневной разработки в редакторе. Claude Code — для глубокого анализа архитектуры и сложных задач.',
		},
	],
	'docker-compose-vps': [
		{
			question: 'Нужен ли Docker на VPS для одного сайта?',
			answer:
				'Не обязательно. Docker оправдан при нескольких сервисах, микросервисах или когда важна одинаковая среда dev/prod.',
		},
		{
			question: 'Сколько RAM нужно для Docker Compose на VPS?',
			answer: 'Для 2–3 контейнеров достаточно 2 ГБ RAM. Для production с базой и кэшем — от 4 ГБ.',
		},
	],
	'pochasovaya-arenda-vps': [
		{
			question: 'Выгодна ли почасовая аренда VPS для постоянного сайта?',
			answer:
				'Нет. Для 24/7 проекта месячный тариф почти всегда дешевле. Почасовая модель — для тестов и временных задач.',
		},
		{
			question: 'Можно ли остановить VPS и не платить за простой?',
			answer:
				'Зависит от провайдера. У Storm Cloud почасовая оплата позволяет платить только за время работы сервера.',
		},
	],
	'vps-ili-vds-raznitsa': [
		{
			question: 'VPS и VDS — это одно и то же?',
			answer:
				'В России термины часто используют как синонимы. Технически оба — виртуальный сервер с выделенными ресурсами.',
		},
		{
			question: 'Что выбрать: VPS или выделенный сервер?',
			answer:
				'VPS/VDS — для большинства сайтов и приложений. Выделенный сервер — при высокой нагрузке и жёстких требованиях к изоляции.',
		},
	],
	'linux-vps-dlya-novichka': [
		{
			question: 'Какой дистрибутив Linux выбрать для первого VPS?',
			answer: 'Ubuntu LTS — самый популярный выбор для новичков: много документации и готовых инструкций.',
		},
		{
			question: 'Нужно ли сразу настраивать firewall?',
			answer: 'Да. UFW или iptables — одно из первых действий после создания сервера.',
		},
	],
	'ollama-vps': [
		{
			question: 'Сколько RAM нужно для Ollama на VPS?',
			answer: '7B модели — от 8 ГБ RAM. 13B — от 16 ГБ. Для CPU-only inference закладывайте запас.',
		},
		{
			question: 'Нужна ли GPU для Ollama?',
			answer: 'Не обязательно, но GPU сильно ускоряет ответы. На CPU модели работают медленнее, но стабильно.',
		},
	],
	'pet-projects-for-job': [
		{
			question: 'Сколько pet-проектов нужно для резюме junior?',
			answer: '2–3 законченных проекта с README, деплоем и чистым кодом лучше, чем десять недоделок.',
		},
		{
			question: 'Какие pet-проекты не стоит делать?',
			answer: 'Калькулятор, todo-list и клоны без уникальной логики редко выделяют кандидата.',
		},
	],
	'dont-lose-code-rules': [
		{
			question: 'Достаточно ли только GitHub для бэкапа кода?',
			answer: 'Git + push на remote — минимум. Для важных проектов добавьте второй remote или локальный бэкап.',
		},
	],
	'hosting-to-vps': [
		{
			question: 'Когда точно пора переезжать с хостинга на VPS?',
			answer: 'Когда не хватает root-доступа, нужен Docker, Redis, нестандартный софт или сайт упирается в лимиты хостинга.',
		},
	],
	'razvernut-sayt-na-vps-2026': [
		{
			question: 'Сколько времени нужно, чтобы развернуть сайт на VPS?',
			answer:
				'Простой статический сайт с Nginx и SSL — 40–60 минут. Приложение с Docker и базой данных — 2–4 часа при первом опыте.',
		},
		{
			question: 'Нужен ли домен для деплоя на VPS?',
			answer:
				'Нет, сайт можно открыть по IP. Но для production нужен домен и HTTPS — иначе страдают SEO и доверие пользователей.',
		},
		{
			question: 'Какой VPS выбрать для первого сайта?',
			answer:
				'Для лендинга или блога достаточно 1–2 GB RAM. Для WordPress или Docker — от 2–4 GB. Для тестов подойдёт почасовая аренда.',
		},
		{
			question: 'Можно ли развернуть сайт на VPS без Docker?',
			answer:
				'Да. Классический путь — Nginx + статика или Nginx как reverse proxy к Node/Python на localhost. Docker упрощает сложные стеки.',
		},
	],
};

/** Ручная перелинковка: slug → список slug для блока «Рекомендуем прочитать» */
export const RECOMMENDED_LINKS: Record<string, string[]> = {
	'docker-compose-vps': [
		'junior-developer-2026',
		'dont-lose-code-rules',
		'vps-first-steps',
		'linux-vps-dlya-novichka',
		'vps-dlya-programmista',
		'github-actions-cicd',
	],
	'junior-developer-2026': [
		'pet-projects-for-job',
		'beginner-dev-mistakes',
		'learn-programming-faster',
		'read-docs-not-code',
		'cursor-claude-chatgpt-2026',
		'pet-projects-no-release',
	],
	'cursor-claude-chatgpt-2026': [
		'ai-for-programmers-daily',
		'mcp-for-developers',
		'read-docs-not-code',
		'junior-developer-2026',
		'vscode-ssh-vps',
		'idea-to-service-evening',
	],
	'pochasovaya-arenda-vps': [
		'server-na-chas',
		'arenda-servera-na-paru-chasov',
		'hourly-vps',
		'chto-sdelat-na-vps-za-chas',
		'choose-vps',
		'desheviy-vps',
	],
	'linux-vps-dlya-novichka': [
		'vps-first-steps',
		'docker-compose-vps',
		'vps-monitoring',
		'telegram-bot-vps',
		'hosting-to-vps',
		'vps-ili-vds-raznitsa',
	],
	'ollama-vps': [
		'ai-for-programmers-daily',
		'cursor-claude-chatgpt-2026',
		'mcp-for-developers',
		'reduce-vps-costs',
		'vps-evropa-ili-rossiya',
		'idea-to-service-evening',
	],
	'razvernut-sayt-na-vps-2026': [
		'vps-first-steps',
		'hosting-to-vps',
		'docker-compose-vps',
		'github-actions-cicd',
		'vps-monitoring',
		'choose-vps',
	],
};

export const GUIDES: GuideConfig[] = [
	{
		slug: 'junior-razrabotchik',
		title: 'Полный гид начинающего программиста',
		description:
			'Сборник статей для junior-разработчика: навыки, pet-проекты, ИИ-инструменты, карьера и практика в 2026 году.',
		intro:
			'Этот раздел объединяет материалы для тех, кто только входит в профессию или готовится к первой работе. Начните с roadmap junior, затем переходите к pet-проектам, инструментам и типичным ошибкам.',
		articleSlugs: [
			'junior-developer-2026',
			'pet-projects-for-job',
			'beginner-dev-mistakes',
			'learn-programming-faster',
			'read-docs-not-code',
			'pet-projects-no-release',
			'cursor-claude-chatgpt-2026',
			'ai-for-programmers-daily',
			'mcp-for-developers',
			'github-actions-cicd',
			'idea-to-service-evening',
			'vscode-ssh-vps',
		],
		keywords: ['junior разработчик', 'как стать программистом', 'pet project', 'карьера IT'],
	},
	{
		slug: 'vps-i-oblako',
		title: 'VPS и облако: полное руководство',
		description:
			'Все о VPS: выбор, почасовая аренда, миграция с хостинга, экономия, регионы и первые шаги после запуска.',
		intro:
			'Кластер статей для тех, кто выбирает, настраивает или оптимизирует виртуальный сервер. От первого VPS до почасовой модели и сравнения с хостингом.',
		articleSlugs: [
			'razvernut-sayt-na-vps-2026',
			'choose-vps',
			'vps-mistakes',
			'pochasovaya-arenda-vps',
			'server-na-chas',
			'arenda-servera-na-paru-chasov',
			'hourly-vps',
			'hosting-to-vps',
			'vps-dlya-sayta',
			'vps-ili-vds-raznitsa',
			'desheviy-vps',
			'reduce-vps-costs',
			'vps-evropa-ili-rossiya',
			'linux-vps-dlya-novichka',
			'vps-first-steps',
			'chto-sdelat-na-vps-za-chas',
			'vps-dlya-programmista',
		],
		keywords: ['VPS', 'аренда сервера', 'VDS', 'облачный сервер', 'почасовая аренда'],
	},
	{
		slug: 'devops-i-infrastruktura',
		title: 'DevOps и инфраструктура: практический гид',
		description:
			'Docker, мониторинг, CI/CD, деплой ботов, n8n и безопасность — практические материалы по DevOps на VPS.',
		intro:
			'Статьи для разработчиков и админов, которые поднимают сервисы, автоматизируют деплой и следят за инфраструктурой.',
		articleSlugs: [
			'docker-compose-vps',
			'vps-monitoring',
			'github-actions-cicd',
			'vps-first-steps',
			'dont-lose-code-rules',
			'telegram-bot-vps',
			'n8n-self-hosted',
			'vscode-ssh-vps',
			'ollama-vps',
		],
		keywords: ['DevOps', 'Docker', 'CI/CD', 'мониторинг VPS', 'деплой'],
	},
];

export function getGuide(slug: string) {
	return GUIDES.find((guide) => guide.slug === slug);
}
