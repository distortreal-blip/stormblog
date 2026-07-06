export interface FaqItem {
	question: string;
	answer: string;
}

export interface ItemListMeta {
	name: string;
	description: string;
	items: { name: string; url: string }[];
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
	'redis-kesh-vps': [
		{
			question: 'Нужен ли Redis на VPS для небольшого сайта?',
			answer:
				'Для статического сайта — нет. Redis оправдан при API, сессиях, очередях задач или когда база данных становится узким местом.',
		},
		{
			question: 'Сколько RAM выделить под Redis на VPS?',
			answer: 'Для кэша и сессий обычно хватает 256–512 МБ. Закладывайте maxmemory и политику eviction, чтобы Redis не съел всю память сервера.',
		},
	],
	'wireguard-vpn-na-vps': [
		{
			question: 'Чем WireGuard лучше OpenVPN на VPS?',
			answer: 'WireGuard проще в настройке, быстрее и потребляет меньше ресурсов. Для личного VPN на VPS — оптимальный выбор в 2026 году.',
		},
		{
			question: 'Можно ли использовать VPS только как VPN?',
			answer: 'Да. Минимальный VPS с 1 ГБ RAM достаточен для WireGuard на несколько устройств. Главное — выбрать регион ближе к вам.',
		},
	],
	'nodejs-pm2-deploy': [
		{
			question: 'Зачем PM2, если есть systemd?',
			answer: 'PM2 удобен для Node.js: кластеризация, автоперезапуск при падении, логи и zero-downtime reload. Systemd тоже работает, но PM2 проще для JS.',
		},
		{
			question: 'Сколько RAM нужно для Node.js на VPS?',
			answer: 'Простой API — от 512 МБ–1 ГБ. С PM2 cluster mode закладывайте RAM с запасом под каждый воркер.',
		},
	],
	'laravel-na-vps': [
		{
			question: 'Какой VPS нужен для Laravel в production?',
			answer: 'Минимум 2 ГБ RAM: PHP-FPM, Nginx, MySQL/PostgreSQL и очереди. Для трафика от 10k визитов/день — от 4 ГБ.',
		},
		{
			question: 'Нужен ли Redis для Laravel на VPS?',
			answer: 'Не обязателен на старте, но рекомендуется для кэша, сессий и Horizon/очередей при росте нагрузки.',
		},
	],
	'ssl-letsencrypt-vps': [
		{
			question: 'Бесплатен ли SSL от Let\'s Encrypt для VPS?',
			answer: 'Да. Сертификаты бесплатные, автообновление через certbot. Для production достаточно в большинстве случаев.',
		},
		{
			question: 'Как часто обновлять сертификат Let\'s Encrypt?',
			answer: 'Certbot настраивает cron/systemd timer автоматически. Сертификат живёт 90 дней, обновление — за 30 дней до истечения.',
		},
	],
	'grafana-prometheus-vps': [
		{
			question: 'Нужны ли Grafana и Prometheus на маленьком VPS?',
			answer: 'Для одного pet-проекта — опционально. Для production, нескольких сервисов или SLA — да, это базовый стек мониторинга.',
		},
		{
			question: 'Сколько RAM нужно для Prometheus + Grafana?',
			answer: 'Минимум 2 ГБ RAM на VPS. При долгом хранении метрик и многих targets — от 4 ГБ и отдельный диск под данные.',
		},
	],
	'terraform-vps-infrastruktura': [
		{
			question: 'Нужен ли Terraform для одного VPS?',
			answer: 'Для одного сервера — избыточен. Terraform окупается при нескольких окружениях, командах и повторяемой инфраструктуре.',
		},
		{
			question: 'Можно ли управлять VPS через Terraform?',
			answer: 'Да, через провайдеры облаков и API. Код инфраструктуры версионируется в Git — удобно для staging и production.',
		},
	],
	'mysql-ili-postgresql-vps': [
		{
			question: 'MySQL или PostgreSQL для WordPress на VPS?',
			answer: 'WordPress исторически на MySQL/MariaDB. PostgreSQL для WP возможен, но экосистема плагинов заточена под MySQL.',
		},
		{
			question: 'Что выбрать для нового API в 2026 году?',
			answer: 'PostgreSQL — для сложных запросов, JSON и строгой целостности. MySQL — если команда уже на нём или нужна совместимость с legacy.',
		},
	],
	'nginx-ili-caddy': [
		{
			question: 'Caddy или Nginx для первого сайта на VPS?',
			answer: 'Caddy — если хотите HTTPS из коробки без certbot. Nginx — если нужен максимальный контроль и готовые конфиги под любые задачи.',
		},
		{
			question: 'Можно ли заменить Nginx на Caddy без простоя?',
			answer: 'Да: поднимите Caddy на другом порту, проверьте конфиг, переключите DNS или proxy. Оба работают как reverse proxy одинаково хорошо.',
		},
	],
	'minecraft-server-na-vps': [
		{
			question: 'Сколько RAM нужно для Minecraft-сервера на VPS?',
			answer: 'Для 5–10 игроков — 2–4 ГБ. Для модов и 20+ игроков — от 6–8 ГБ. Java-экосистема прожорлива по памяти.',
		},
		{
			question: 'Какой VPS выбрать для Minecraft?',
			answer: 'Важны RAM и одноядерная производительность CPU. Локация — ближе к игрокам. SSD обязателен для мира и чанков.',
		},
	],
	'postgresql-tuning-vps': [
		{
			question: 'Нужно ли тюнить PostgreSQL на маленьком VPS?',
			answer: 'Да. Дефолтные настройки рассчитаны на мощные серверы. shared_buffers и work_mem нужно подогнать под вашу RAM.',
		},
		{
			question: 'Сколько RAM отдать PostgreSQL на VPS с 2 ГБ?',
			answer: 'Обычно 25–40% RAM на shared_buffers, плюс запас ОС и приложений. Не отдавайте всю память только базе.',
		},
	],
	'systemd-linux-servisy': [
		{
			question: 'Зачем systemd unit-файл вместо nohup?',
			answer: 'systemd перезапускает сервис при падении, пишет в journal, стартует после reboot. Это стандарт для production на Linux VPS.',
		},
		{
			question: 'Как проверить, что сервис запустится после перезагрузки VPS?',
			answer: 'systemctl is-enabled your-service и тестовый reboot. enabled + active (running) — сервис поднимется автоматически.',
		},
	],
	'backup-vps-3-2-1': [
		{
			question: 'Что такое правило 3-2-1 для бэкапов VPS?',
			answer: '3 копии данных, 2 разных носителя, 1 копия off-site. Минимум для production: локальный бэкап + облако или второй сервер.',
		},
		{
			question: 'Достаточно ли снапшотов VPS от провайдера?',
			answer: 'Снапшоты — хорошее дополнение, но не замена бэкапам БД и файлов. Восстановите отдельно данные приложения и конфиги.',
		},
	],
	'fastapi-deploy-vps': [
		{
			question: 'Uvicorn или Gunicorn для FastAPI на VPS?',
			answer: 'Uvicorn — ASGI-сервер для FastAPI напрямую. Gunicorn с uvicorn workers — для нескольких воркеров и production за Nginx.',
		},
		{
			question: 'Сколько воркеров Uvicorn на VPS с 2 ГБ RAM?',
			answer: 'Обычно 2–4 воркера. Следите за RAM: каждый воркер — отдельный процесс Python с моделями в памяти.',
		},
	],
	'cloudflare-i-vps': [
		{
			question: 'Нужен ли Cloudflare перед VPS?',
			answer: 'Не обязателен, но полезен: CDN, DDoS-защита, кэш статики, скрытие реального IP. Особенно для публичных сайтов.',
		},
		{
			question: 'Можно ли использовать Cloudflare с Let\'s Encrypt на VPS?',
			answer: 'Да. Режим Full (strict) + origin-сертификат или DNS challenge certbot. Не используйте Flexible SSL в production.',
		},
	],
	'zashchita-vps-ot-vzloma': [
		{
			question: 'Что настроить на VPS в первый день против взлома?',
			answer: 'SSH по ключам, отключить root-login, UFW firewall, fail2ban, автообновления security-патчей.',
		},
		{
			question: 'Нужен ли fail2ban на VPS?',
			answer: 'Да, для SSH и веб-сервисов. Блокирует брутфорс по IP после нескольких неудачных попыток.',
		},
	],
	'docker-multi-stage-builds': [
		{
			question: 'Зачем multi-stage build в Docker?',
			answer: 'Финальный образ содержит только runtime — без компиляторов и dev-зависимостей. Образ меньше, атака поверхность уже.',
		},
		{
			question: 'Насколько уменьшается образ с multi-stage?',
			answer: 'Часто в 5–10 раз: с 800 МБ до 80 МБ для Go/Node приложений — типичный результат.',
		},
	],
	'nginx-logi-i-oshibki': [
		{
			question: 'Где смотреть ошибки Nginx на VPS?',
			answer: '/var/log/nginx/error.log — основной файл. access.log — для 4xx/5xx и анализа трафика. journalctl если Nginx через systemd.',
		},
		{
			question: 'Что значит 502 Bad Gateway в Nginx?',
			answer: 'Nginx не получил ответ от upstream (Node, PHP-FPM, другой backend). Проверьте, запущен ли backend и верный ли proxy_pass.',
		},
	],
	'ansible-avtomatizaciya-servera': [
		{
			question: 'Нужен ли Ansible для одного VPS?',
			answer: 'Для одного сервера достаточно скриптов. Ansible окупается при 3+ серверах или когда конфигурация должна быть воспроизводимой.',
		},
		{
			question: 'Ansible или Terraform для VPS?',
			answer: 'Terraform создаёт инфраструктуру (серверы, сети). Ansible настраивает ОС и софт на уже созданных машинах. Часто используют вместе.',
		},
	],
	'kubernetes-minikube-vps': [
		{
			question: 'Нужен ли Kubernetes на VPS для одного приложения?',
			answer: 'Нет. Docker Compose или systemd проще. Kubernetes — при нескольких сервисах, командах и потребности в оркестрации.',
		},
		{
			question: 'k3s или Minikube на VPS для обучения?',
			answer: 'k3s — легковесный production-ready кластер на одном VPS. Minikube — для локального обучения, на VPS обычно избыточен.',
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
		'ssl-letsencrypt-vps',
		'nginx-ili-caddy',
		'vps-first-steps',
		'hosting-to-vps',
		'cloudflare-i-vps',
		'zashchita-vps-ot-vzloma',
	],
	'redis-kesh-vps': [
		'laravel-na-vps',
		'nodejs-pm2-deploy',
		'fastapi-deploy-vps',
		'postgresql-tuning-vps',
		'docker-compose-vps',
		'grafana-prometheus-vps',
	],
	'wireguard-vpn-na-vps': [
		'zashchita-vps-ot-vzloma',
		'linux-vps-dlya-novichka',
		'vps-first-steps',
		'cloudflare-i-vps',
		'ssl-letsencrypt-vps',
		'vscode-ssh-vps',
	],
	'nodejs-pm2-deploy': [
		'nginx-ili-caddy',
		'ssl-letsencrypt-vps',
		'systemd-linux-servisy',
		'redis-kesh-vps',
		'github-actions-cicd',
		'razvernut-sayt-na-vps-2026',
	],
	'laravel-na-vps': [
		'mysql-ili-postgresql-vps',
		'redis-kesh-vps',
		'nginx-ili-caddy',
		'ssl-letsencrypt-vps',
		'backup-vps-3-2-1',
		'razvernut-sayt-na-vps-2026',
	],
	'ssl-letsencrypt-vps': [
		'razvernut-sayt-na-vps-2026',
		'nginx-ili-caddy',
		'cloudflare-i-vps',
		'nginx-logi-i-oshibki',
		'zashchita-vps-ot-vzloma',
		'vps-first-steps',
	],
	'grafana-prometheus-vps': [
		'vps-monitoring',
		'docker-compose-vps',
		'nginx-logi-i-oshibki',
		'backup-vps-3-2-1',
		'postgresql-tuning-vps',
		'redis-kesh-vps',
	],
	'terraform-vps-infrastruktura': [
		'ansible-avtomatizaciya-servera',
		'kubernetes-minikube-vps',
		'docker-compose-vps',
		'github-actions-cicd',
		'backup-vps-3-2-1',
		'vps-first-steps',
	],
	'mysql-ili-postgresql-vps': [
		'postgresql-tuning-vps',
		'laravel-na-vps',
		'wordpress-vps-2026',
		'backup-vps-3-2-1',
		'razvernut-sayt-na-vps-2026',
		'redis-kesh-vps',
	],
	'nginx-ili-caddy': [
		'ssl-letsencrypt-vps',
		'nginx-logi-i-oshibki',
		'nodejs-pm2-deploy',
		'laravel-na-vps',
		'fastapi-deploy-vps',
		'razvernut-sayt-na-vps-2026',
	],
	'minecraft-server-na-vps': [
		'linux-vps-dlya-novichka',
		'choose-vps',
		'systemd-linux-servisy',
		'backup-vps-3-2-1',
		'zashchita-vps-ot-vzloma',
		'vps-first-steps',
	],
	'postgresql-tuning-vps': [
		'mysql-ili-postgresql-vps',
		'laravel-na-vps',
		'fastapi-deploy-vps',
		'backup-vps-3-2-1',
		'grafana-prometheus-vps',
		'redis-kesh-vps',
	],
	'systemd-linux-servisy': [
		'nodejs-pm2-deploy',
		'fastapi-deploy-vps',
		'nginx-logi-i-oshibki',
		'vps-first-steps',
		'linux-vps-dlya-novichka',
		'backup-vps-3-2-1',
	],
	'backup-vps-3-2-1': [
		'zashchita-vps-ot-vzloma',
		'postgresql-tuning-vps',
		'mysql-ili-postgresql-vps',
		'terraform-vps-infrastruktura',
		'vps-monitoring',
		'razvernut-sayt-na-vps-2026',
	],
	'fastapi-deploy-vps': [
		'nodejs-pm2-deploy',
		'postgresql-tuning-vps',
		'redis-kesh-vps',
		'nginx-ili-caddy',
		'systemd-linux-servisy',
		'docker-compose-vps',
	],
	'cloudflare-i-vps': [
		'ssl-letsencrypt-vps',
		'razvernut-sayt-na-vps-2026',
		'zashchita-vps-ot-vzloma',
		'nginx-ili-caddy',
		'wireguard-vpn-na-vps',
		'vps-dlya-sayta',
	],
	'zashchita-vps-ot-vzloma': [
		'wireguard-vpn-na-vps',
		'linux-vps-dlya-novichka',
		'vps-first-steps',
		'backup-vps-3-2-1',
		'nginx-logi-i-oshibki',
		'ssl-letsencrypt-vps',
	],
	'docker-multi-stage-builds': [
		'docker-compose-vps',
		'github-actions-cicd',
		'nodejs-pm2-deploy',
		'fastapi-deploy-vps',
		'kubernetes-minikube-vps',
		'laravel-na-vps',
	],
	'nginx-logi-i-oshibki': [
		'nginx-ili-caddy',
		'grafana-prometheus-vps',
		'nodejs-pm2-deploy',
		'laravel-na-vps',
		'ssl-letsencrypt-vps',
		'vps-monitoring',
	],
	'ansible-avtomatizaciya-servera': [
		'terraform-vps-infrastruktura',
		'kubernetes-minikube-vps',
		'docker-compose-vps',
		'systemd-linux-servisy',
		'github-actions-cicd',
		'vps-first-steps',
	],
	'kubernetes-minikube-vps': [
		'docker-compose-vps',
		'docker-multi-stage-builds',
		'terraform-vps-infrastruktura',
		'ansible-avtomatizaciya-servera',
		'grafana-prometheus-vps',
		'github-actions-cicd',
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
			'Все о VPS: выбор, деплой, SSL, CDN, базы данных, игровые серверы, почасовая аренда и первые шаги после запуска.',
		intro:
			'Кластер статей для тех, кто выбирает, настраивает или оптимизирует виртуальный сервер. От развёртывания сайта до SSL, Cloudflare и Minecraft-сервера.',
		articleSlugs: [
			'razvernut-sayt-na-vps-2026',
			'ssl-letsencrypt-vps',
			'nginx-ili-caddy',
			'cloudflare-i-vps',
			'mysql-ili-postgresql-vps',
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
			'minecraft-server-na-vps',
		],
		keywords: ['VPS', 'аренда сервера', 'VDS', 'облачный сервер', 'почасовая аренда'],
	},
	{
		slug: 'devops-i-infrastruktura',
		title: 'DevOps и инфраструктура: практический гид',
		description:
			'Docker, CI/CD, деплой, мониторинг, безопасность, IaC и базы данных — практические материалы по DevOps на VPS.',
		intro:
			'Статьи для разработчиков и админов: от Docker и Nginx до Terraform, Kubernetes, Grafana и автоматизации деплоя.',
		articleSlugs: [
			'docker-compose-vps',
			'docker-multi-stage-builds',
			'nginx-ili-caddy',
			'nginx-logi-i-oshibki',
			'ssl-letsencrypt-vps',
			'systemd-linux-servisy',
			'github-actions-cicd',
			'ansible-avtomatizaciya-servera',
			'terraform-vps-infrastruktura',
			'kubernetes-minikube-vps',
			'nodejs-pm2-deploy',
			'laravel-na-vps',
			'fastapi-deploy-vps',
			'redis-kesh-vps',
			'postgresql-tuning-vps',
			'mysql-ili-postgresql-vps',
			'grafana-prometheus-vps',
			'vps-monitoring',
			'backup-vps-3-2-1',
			'zashchita-vps-ot-vzloma',
			'wireguard-vpn-na-vps',
			'telegram-bot-vps',
			'n8n-self-hosted',
			'vscode-ssh-vps',
			'ollama-vps',
			'dont-lose-code-rules',
			'vps-first-steps',
		],
		keywords: ['DevOps', 'Docker', 'CI/CD', 'мониторинг VPS', 'деплой', 'Terraform', 'Kubernetes'],
	},
];

export function getGuide(slug: string) {
	return GUIDES.find((guide) => guide.slug === slug);
}
