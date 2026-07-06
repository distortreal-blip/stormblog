import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.join(__dirname, '../src/content/blog');
const assetsRoot =
	'C:/Users/User/.cursor/projects/C-Users-User-AppData-Local-Temp-03fcea2f-c79f-4273-9a6b-95343cc4388c/assets';

const articles = [
	{
		slug: 'redis-kesh-vps',
		coverFile: 'cover-redis-vps.png',
		title: 'Redis на VPS: кэширование, сессии и очереди',
		description:
			'Как поднять Redis на VPS: установка, настройка памяти, persistence, безопасность. Кэш для API, сессии и фоновые задачи.',
		category: 'DevOps',
		keywords: ['Redis VPS', 'кэширование Redis', 'Redis Linux', 'очереди', 'Storm Cloud'],
		body: `Redis — самый популярный in-memory store для кэша, сессий и очередей. На VPS он поднимается за 10 минут.

---

## Когда нужен Redis на VPS

- Кэш ответов API (снижение нагрузки на БД)
- Хранение сессий пользователей
- Очереди задач (Sidekiq, Bull, Celery)
- Rate limiting и pub/sub

---

## Установка

\`\`\`bash
sudo apt update
sudo apt install redis-server -y
sudo systemctl enable redis-server
redis-cli ping
# PONG
\`\`\`

---

## Базовая настройка

\`\`\`ini
# /etc/redis/redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
bind 127.0.0.1 ::1
requirepass YOUR_STRONG_PASSWORD
\`\`\`

**Важно:** не открывайте порт 6379 в интернет без VPN и пароля.

---

## RAM на VPS

| Нагрузка | RAM для Redis |
| --- | --- |
| Малый сайт | 128–256 MB |
| API средний | 512 MB–1 GB |
| Высокий трафик | 2 GB+ |

---

## Итог

Redis на VPS ускоряет приложение в разы. Держите его на localhost, задайте maxmemory и пароль.

VPS от 2 GB RAM — [StormNet Cloud](https://stormnetcloud.com/). См. также [PostgreSQL на VPS](/blog/postgresql-tuning-vps/).`,
	},
	{
		slug: 'wireguard-vpn-na-vps',
		coverFile: 'cover-wireguard-vpn.png',
		title: 'WireGuard VPN на VPS: личный VPN за 15 минут',
		description:
			'Пошаговая настройка WireGuard на Ubuntu VPS: ключи, конфиг клиента, маршрутизация. Быстрее и проще OpenVPN.',
		category: 'Безопасность',
		keywords: ['WireGuard VPS', 'VPN на сервере', 'личный VPN', 'безопасность', 'Ubuntu'],
		body: `WireGuard — современный VPN: минимальный код, высокая скорость, простая настройка. Идеален для личного VPN на VPS.

---

## Почему WireGuard, а не OpenVPN

| | WireGuard | OpenVPN |
| --- | --- | --- |
| Скорость | Высокая | Средняя |
| Настройка | 15 мин | 1+ час |
| Код | ~4000 строк | ~100k строк |
| Мобильные клиенты | Отлично | Хорошо |

---

## Установка на Ubuntu

\`\`\`bash
sudo apt install wireguard -y
wg genkey | tee privatekey | wg pubkey > publickey
\`\`\`

\`\`\`ini
# /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = SERVER_PRIVATE_KEY
PostUp = ufw allow 51820/udp

[Peer]
PublicKey = CLIENT_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32
\`\`\`

\`\`\`bash
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
\`\`\`

---

## Безопасность

- Откройте только UDP 51820
- Не используйте VPN для всего трафика без необходимости
- Обновляйте VPS регулярно

---

## Итог

VPS + WireGuard = ваш личный VPN без подписок. Подойдёт для доступа к dev-средам и защищённого серфинга в публичных сетях.

VPS для VPN — [StormNet Cloud](https://stormnetcloud.com/). Безопасность сервера — [защита VPS](/blog/zashchita-vps-ot-vzloma/).`,
	},
	{
		slug: 'nodejs-pm2-deploy',
		coverFile: 'cover-nodejs-pm2.png',
		title: 'Node.js на VPS: деплой с PM2 и Nginx',
		description:
			'Как запустить Node.js приложение на VPS: PM2 для автозапуска, кластеризация, логи и Nginx reverse proxy.',
		category: 'Разработка',
		keywords: ['Node.js VPS', 'PM2', 'деплой Node', 'Nginx', 'JavaScript production'],
		body: `Node.js на VPS без process manager падает при закрытии SSH. PM2 решает это за одну команду.

---

## Установка

\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
sudo npm install -g pm2
\`\`\`

---

## Запуск приложения

\`\`\`bash
cd /var/www/myapp
npm ci --production
pm2 start index.js --name myapp
pm2 save
pm2 startup
\`\`\`

Кластер на все ядра:

\`\`\`bash
pm2 start index.js -i max --name myapp
\`\`\`

---

## Nginx reverse proxy

\`\`\`nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
}
\`\`\`

---

## Мониторинг

\`\`\`bash
pm2 monit
pm2 logs myapp
pm2 status
\`\`\`

---

## Итог

PM2 + Nginx — стандартный стек Node.js на VPS. Не забудьте SSL через [Let's Encrypt](/blog/ssl-letsencrypt-vps/).

VPS для Node — [StormNet Cloud](https://stormnetcloud.com/).`,
	},
	{
		slug: 'laravel-na-vps',
		coverFile: 'cover-laravel-vps.png',
		title: 'Laravel на VPS: деплой PHP-приложения в production',
		description:
			'Полный гайд по Laravel на Ubuntu VPS: PHP-FPM, Composer, Nginx, MySQL, очереди и scheduler через cron.',
		category: 'Разработка',
		keywords: ['Laravel VPS', 'PHP деплой', 'PHP-FPM', 'Nginx Laravel', 'Storm Cloud'],
		body: `Laravel — популярнейший PHP-фреймворк. На VPS он работает через PHP-FPM + Nginx.

---

## Требования VPS

- Ubuntu 22.04+
- 2 GB RAM минимум
- PHP 8.2+, Composer, MySQL/PostgreSQL

\`\`\`bash
sudo apt install nginx php8.2-fpm php8.2-mysql php8.2-mbstring \\
  php8.2-xml php8.2-curl mysql-server composer -y
\`\`\`

---

## Деплой

\`\`\`bash
cd /var/www
git clone https://github.com/you/laravel-app.git
cd laravel-app
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
\`\`\`

Права:

\`\`\`bash
sudo chown -R www-data:www-data storage bootstrap/cache
\`\`\`

---

## Nginx конфиг

\`\`\`nginx
root /var/www/laravel-app/public;
index index.php;
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
location ~ \\.php$ {
    fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    include fastcgi_params;
}
\`\`\`

---

## Scheduler и очереди

\`\`\`cron
* * * * * cd /var/www/laravel-app && php artisan schedule:run >> /dev/null 2>&1
\`\`\`

---

## Итог

Laravel на VPS — классический LEMP-стек. Кэш конфигов и очереди через Redis — [Redis на VPS](/blog/redis-kesh-vps/).

Хостинг на VPS — [StormNet Cloud](https://stormnetcloud.com/).`,
	},
	{
		slug: 'ssl-letsencrypt-vps',
		coverFile: 'cover-ssl-letsencrypt.png',
		title: "SSL на VPS: Let's Encrypt, автообновление и типичные ошибки",
		description:
			"Полный гайд по HTTPS на VPS: Certbot, Nginx, автообновление сертификатов, Mixed Content и HSTS.",
		category: 'Linux',
		keywords: ["SSL VPS", "Let's Encrypt", 'Certbot', 'HTTPS Nginx', 'сертификат'],
		body: `HTTPS — обязателен для SEO, безопасности и доверия. На VPS SSL бесплатен через Let's Encrypt.

---

## Certbot + Nginx

\`\`\`bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d example.com -d www.example.com
\`\`\`

Certbot автоматически настроит HTTPS и редирект HTTP → HTTPS.

---

## Автообновление

\`\`\`bash
sudo certbot renew --dry-run
\`\`\`

Cron уже настроен через systemd timer. Проверьте:

\`\`\`bash
systemctl list-timers | grep certbot
\`\`\`

---

## HSTS (опционально)

\`\`\`nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
\`\`\`

Включайте только когда уверены, что HTTPS стабилен.

---

## Типичные ошибки

| Ошибка | Решение |
| --- | --- |
| DNS не указывает на VPS | Подождите propagation |
| Порт 80 закрыт | UFW allow 80 |
| Mixed Content | Замените http:// на https:// в коде |
| Слишком много запросов | Лимит LE: 5 cert/неделю на домен |

---

## Итог

SSL на VPS — 5 минут с Certbot. Обязательно для production. Полный деплой — [гайд по развёртыванию сайта](/blog/razvernut-sayt-na-vps-2026/).`,
	},
	{
		slug: 'grafana-prometheus-vps',
		coverFile: 'cover-grafana-prometheus.png',
		title: 'Grafana и Prometheus на VPS: мониторинг сервера',
		description:
			'Как поднять Prometheus + Grafana на VPS: метрики CPU, RAM, диск, алерты в Telegram. Docker Compose стек.',
		category: 'DevOps',
		keywords: ['Grafana VPS', 'Prometheus', 'мониторинг сервера', 'метрики', 'DevOps'],
		body: `Без мониторинга вы узнаёте о падении сайта от пользователей. Prometheus + Grafana — стандарт open-source.

---

## Что мониторить

- CPU, RAM, disk I/O
- Nginx request rate и 5xx
- Доступность endpoint (blackbox)
- PostgreSQL/MySQL connections

---

## Минимальный стек (Docker Compose)

\`\`\`yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "127.0.0.1:9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: strong_password

  node_exporter:
    image: prom/node-exporter
    network_mode: host
\`\`\`

Доступ к Grafana — через SSH tunnel или Nginx с auth.

---

## RAM

Минимум **2 GB RAM** для стека. На 1 GB — только node_exporter + внешний Grafana Cloud.

---

## Алерты

Настройте Alertmanager или встроенные Grafana alerts → Telegram/Slack при:
- CPU > 90% 5 мин
- Disk > 85%
- HTTP 5xx > 10/мин

---

## Итог

Мониторинг на VPS окупается при первом инциденте. Начните с node_exporter + Grafana.

VPS для мониторинга — [StormNet Cloud](https://stormnetcloud.com/). Базовый гайд — [VPS monitoring](/blog/vps-monitoring/).`,
	},
	{
		slug: 'terraform-vps-infrastruktura',
		coverFile: 'cover-terraform-vps.png',
		title: 'Terraform и VPS: инфраструктура как код',
		description:
			'Зачем Terraform при ручном VPS, как описать сервер в HCL, state-файл и воспроизводимые окружения dev/stage/prod.',
		category: 'DevOps',
		keywords: ['Terraform VPS', 'Infrastructure as Code', 'IaC', 'DevOps', 'автоматизация'],
		body: `Terraform позволяет описать инфраструктуру в коде и воспроизводить окружения одной командой.

---

## Зачем Terraform для VPS

- **Воспроизводимость** — одинаковый dev/stage/prod
- **Версионирование** — инфраструктура в Git
- **Документация** — код = описание системы
- **Масштаб** — 1 или 100 серверов

Даже при одном VPS Terraform полезен для дисциплины и экспериментов.

---

## Пример (generic provider)

\`\`\`hcl
terraform {
  required_providers {
    # provider вашего облака
  }
}

resource "vps_instance" "web" {
  name  = "production-web"
  image = "ubuntu-22.04"
  size  = "2gb"
  region = "eu-west"
}
\`\`\`

\`\`\`bash
terraform init
terraform plan
terraform apply
\`\`\`

---

## State-файл

Храните \`terraform.tfstate\` в S3/remote backend — не в Git. Иначе риск потери и конфликтов.

---

## Terraform vs Ansible

| | Terraform | Ansible |
| --- | --- | --- |
| Задача | Создать ресурсы | Настроить ОС |
| Идемпотентность | Да | Да |
| Вместе | Да, часто в паре | Да |

Создали VPS в Terraform → настроили Ansible playbook.

---

## Итог

IaC — следующий шаг после ручной настройки. Начните с одного \`.tf\` файла для dev-сервера.

VPS для экспериментов — [StormNet Cloud](https://stormnetcloud.com/). Ansible — [гайд](/blog/ansible-avtomatizaciya-servera/).`,
	},
	{
		slug: 'mysql-ili-postgresql-vps',
		coverFile: 'cover-mysql-postgresql.png',
		title: 'MySQL или PostgreSQL на VPS: что выбрать в 2026',
		description:
			'Сравнение MySQL и PostgreSQL для VPS-проектов: производительность, JSON, экосистема, типичные сценарии.',
		category: 'VPS',
		keywords: ['MySQL vs PostgreSQL', 'база данных VPS', 'выбор БД', 'MySQL VPS', 'PostgreSQL'],
		body: `Выбор БД влияет на архитектуру на годы. На VPS чаще всего выбирают между MySQL и PostgreSQL.

---

## Сравнение

| | MySQL/MariaDB | PostgreSQL |
| --- | --- | --- |
| Простота старта | Высокая | Средняя |
| JSON | Есть (5.7+) | Отлично |
| Сложные запросы | Хорошо | Лучше |
| WordPress/Laravel | Стандарт | Поддерживается |
| Репликация | Простая | Мощная |
| RAM на VPS | 1 GB+ | 2 GB+ |

---

## Когда MySQL

- WordPress, Joomla, Drupal
- Laravel/PHP проекты по умолчанию
- Простые CRUD-приложения
- Команда знает только MySQL

---

## Когда PostgreSQL

- Сложная аналитика и отчёты
- JSONB, GIS (PostGIS)
- Строгая целостность данных
- Python/Django, Ruby on Rails стек

---

## RAM на VPS

| БД | Минимум RAM |
| --- | --- |
| MySQL малый проект | 1 GB |
| PostgreSQL малый | 2 GB |
| Production обе | 4 GB+ |

Тюнинг PostgreSQL — [отдельный гайд](/blog/postgresql-tuning-vps/).

---

## Итог

Нет «лучшей» БД — есть подходящая под стек. Для WordPress — MySQL. Для сложного backend — PostgreSQL.

VPS с 4 GB RAM — [StormNet Cloud](https://stormnetcloud.com/).`,
	},
	{
		slug: 'nginx-ili-caddy',
		coverFile: 'cover-nginx-caddy.png',
		title: 'Nginx или Caddy: какой веб-сервер выбрать на VPS',
		description:
			'Сравнение Nginx и Caddy для VPS: автоматический SSL, конфиги, производительность, когда что использовать.',
		category: 'Linux',
		keywords: ['Nginx vs Caddy', 'веб-сервер VPS', 'Caddy SSL', 'Nginx', 'reverse proxy'],
		body: `Nginx — классика. Caddy — новичок с автоматическим HTTPS. Что выбрать на VPS?

---

## Сравнение

| | Nginx | Caddy |
| --- | --- | --- |
| Доля рынка | Огромная | Растёт |
| SSL из коробки | Через Certbot | Автоматически |
| Сложность конфига | Средняя | Низкая |
| Производительность | Отличная | Отличная |
| Документация RU | Много | Меньше |

---

## Nginx — когда выбрать

- Нужны тонкие настройки (rate limit, cache, WAF)
- Большая команда знает Nginx
- Сложный multi-site хостинг
- Максимум туториалов на русском

---

## Caddy — когда выбрать

- Быстрый старт, минимум конфига
- Авто-SSL без Certbot
- Небольшой проект или dev/stage
- Нравится простота

\`\`\`caddyfile
example.com {
    root * /var/www/html
    file_server
    reverse_proxy /api/* localhost:3000
}
\`\`\`

SSL настроится сам при рабочем DNS.

---

## Итог

Оба отличные. Nginx — для production с тонкой настройкой. Caddy — для быстрого деплоя. Логи Nginx — [гайд](/blog/nginx-logi-i-oshibki/).

VPS — [StormNet Cloud](https://stormnetcloud.com/).`,
	},
	{
		slug: 'minecraft-server-na-vps',
		coverFile: 'cover-minecraft-vps.png',
		title: 'Minecraft-сервер на VPS: настройка для друзей',
		description:
			'Как поднять Minecraft Java сервер на VPS: выбор RAM, Java, systemd, whitelist и оптимизация TPS.',
		category: 'Облака',
		keywords: ['Minecraft сервер VPS', 'Minecraft VPS', 'игровой сервер', 'Java сервер', 'Storm Cloud'],
		body: `Свой Minecraft-сервер на VPS — полный контроль модов, whitelist и правил. Нужен только VPS с достаточной RAM.

---

## Требования VPS

| Игроков | RAM | vCPU |
| --- | --- | --- |
| 2–5 | 2 GB | 2 |
| 5–15 | 4 GB | 2–4 |
| 15+ с модами | 8 GB+ | 4 |

Без модов Vanilla Java edition — от **2 GB RAM**.

---

## Установка

\`\`\`bash
sudo apt install openjdk-21-jre-headless -y
mkdir ~/minecraft && cd ~/minecraft
wget https://launcher.mojang.com/v1/objects/...server.jar -O server.jar
java -Xms2G -Xmx2G -jar server.jar nogui
\`\`\`

Примите EULA в \`eula.txt\`: \`eula=true\`

---

## systemd автозапуск

\`\`\`ini
[Service]
WorkingDirectory=/home/mc/minecraft
ExecStart=/usr/bin/java -Xms2G -Xmx2G -jar server.jar nogui
User=mc
Restart=on-failure
\`\`\`

---

## Безопасность

- Whitelist: \`white-list=true\` в server.properties
- Не открывайте лишние порты
- Регулярные бэкапы мира — [бэкапы VPS](/blog/backup-vps-3-2-1/)

---

## Оптимизация

- Paper MC вместо Vanilla — лучше TPS
- view-distance: 8–10
- Не ставьте тяжёлые модпаки на слабый VPS

---

## Итог

Minecraft на VPS — fun-проект и отличный способ изучить Linux. Для вечерних игр с друзьями хватит VPS 4 GB.

Почасовая аренда для игровых вечеров — [StormNet Cloud](https://stormnetcloud.com/).`,
	},
];

for (const article of articles) {
	const dir = path.join(blogRoot, article.slug);
	fs.mkdirSync(dir, { recursive: true });

	const coverSrc = path.join(assetsRoot, article.coverFile);
	if (fs.existsSync(coverSrc)) {
		await sharp(coverSrc).resize(1200, 630, { fit: 'cover' }).webp({ quality: 88 }).toFile(
			path.join(dir, 'cover.webp'),
		);
		console.log('cover:', article.slug);
	} else {
		console.warn('missing cover:', coverSrc);
	}

	const keywordsYaml = article.keywords.map((k) => `  - "${k}"`).join('\n');
	const md = `---
title: "${article.title}"
description: "${article.description}"
pubDate: 2026-07-08
category: ${article.category}
keywords:
${keywordsYaml}
heroImage: ./cover.webp
---

${article.body}
`;

	fs.writeFileSync(path.join(dir, 'index.md'), md, 'utf8');
	console.log('article:', article.slug);
}
