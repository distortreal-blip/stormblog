import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.join(__dirname, '../src/content/blog');
const assetsRoot =
	'C:/Users/User/.cursor/projects/C-Users-User-AppData-Local-Temp-6db3dac4-eb42-4608-8fd2-b5369ae9bf0c/assets';

const articles = [
	{
		slug: 'traefik-reverse-proxy-vps',
		coverFile: 'cover-traefik-vps.png',
		title: 'Traefik на VPS: reverse proxy с автоматическим SSL',
		description:
			"Настройка Traefik на VPS: маршрутизация, Let's Encrypt, Docker labels, middleware. Альтернатива Nginx и Caddy для микросервисов.",
		category: 'DevOps',
		keywords: ['Traefik VPS', 'reverse proxy', 'авто SSL', 'Docker Traefik', 'маршрутизация', 'Storm Cloud'],
		body: `**Краткий ответ:** Traefik — reverse proxy с автоматическим SSL и discovery через Docker labels. Поднимите контейнер Traefik, укажите домены в labels — сертификаты и маршруты создаются сами.

Если устали вручную править конфиг Nginx при каждом новом сервисе — Traefik решает это декларативно. Сравнение с [Nginx и Caddy](/blog/nginx-ili-caddy/) — в конце статьи.

---

## Когда Traefik, а не Nginx

| Сценарий | Traefik | Nginx |
| --- | --- | --- |
| 5+ микросервисов в Docker | Отлично | Много ручных конфигов |
| Один сайт + API | Избыточен | Проще |
| Авто SSL для новых доменов | Из коробки | certbot + reload |
| Kubernetes / Swarm | Нативно | Нужен ingress controller |

Traefik идеален рядом с [Docker Compose](/blog/docker-compose-vps/) и [Docker Swarm](/blog/docker-swarm-na-vps/).

---

## Минимальный docker-compose

\`\`\`yaml
services:
  traefik:
    image: traefik:v3.0
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.le.acme.httpchallenge=true
      - --certificatesresolvers.le.acme.httpchallenge.entrypoint=web
      - --certificatesresolvers.le.acme.email=admin@example.com
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_certs:/letsencrypt
    restart: unless-stopped

volumes:
  traefik_certs:
\`\`\`

---

## Подключение приложения через labels

\`\`\`yaml
services:
  api:
    image: myapi:latest
    labels:
      - traefik.enable=true
      - traefik.http.routers.api.rule=Host(\`api.example.com\`)
      - traefik.http.routers.api.entrypoints=websecure
      - traefik.http.routers.api.tls.certresolver=le
      - traefik.http.services.api.loadbalancer.server.port=8080
\`\`\`

Traefik подхватит контейнер автоматически — без reload.

---

## Middleware: rate limit, auth, redirect

\`\`\`yaml
labels:
  - traefik.http.middlewares.ratelimit.ratelimit.average=100
  - traefik.http.routers.api.middlewares=ratelimit
\`\`\`

Для базовой auth — basicAuth middleware. Для DDoS — связка с [Cloudflare](/blog/cloudflare-i-vps/) и [CrowdSec](/blog/crowdsec-zashchita-vps/).

---

## Dashboard Traefik

\`\`\`yaml
labels:
  - traefik.http.routers.dashboard.rule=Host(\`traefik.example.com\`)
  - traefik.http.routers.dashboard.service=api@internal
  - traefik.http.routers.dashboard.middlewares=auth
\`\`\`

**Не публикуйте dashboard без auth** — только HTTPS + basicAuth или VPN ([WireGuard](/blog/wireguard-vpn-na-vps/)).

---

## RAM и production

| Нагрузка | RAM |
| --- | --- |
| 2–5 сервисов | 512 MB |
| 10+ сервисов | 1 GB |
| High traffic | 2 GB + CDN |

Мониторинг — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) + [Grafana](/blog/grafana-prometheus-vps/).

---

## Traefik vs Caddy vs Nginx

| | Traefik | Caddy | Nginx |
| --- | --- | --- | --- |
| Docker discovery | Да | Нет (нужен caddy-docker-proxy) | Нет |
| Конфиг | Labels/YAML | Caddyfile | nginx.conf |
| Сложность | Средняя | Низкая | Средняя |

---

## Итог

Traefik — лучший выбор для Docker-стека с часто меняющимися сервисами. Один раз настроили — добавляете контейнеры labels'ами.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Базовый деплой — [развернуть сайт на VPS](/blog/razvernut-sayt-na-vps-2026/).`,
	},
	{
		slug: 'django-deploy-na-vps',
		coverFile: 'cover-django-vps.png',
		title: 'Django на VPS: деплой production-приложения',
		description:
			'Как задеплоить Django на VPS: Gunicorn, Nginx, PostgreSQL, static/media, systemd и SSL. Полный гайд для Python backend.',
		category: 'Разработка',
		keywords: ['Django VPS', 'деплой Django', 'Gunicorn', 'Python production', 'PostgreSQL Django', 'Storm Cloud'],
		body: `**Краткий ответ:** Django на VPS = Gunicorn (WSGI) + Nginx (static + reverse proxy) + PostgreSQL + systemd. Соберите static, настройте .env, выпустите SSL — production готов.

Python backend на VPS — классика. Если уже знаете [FastAPI деплой](/blog/fastapi-deploy-vps/) — Django отличается static files и admin panel.

---

## Стек production

\`\`\`
Пользователь → Nginx (SSL) → Gunicorn → Django → PostgreSQL
                    ↓
              static / media
\`\`\`

Опционально: [Redis](/blog/redis-kesh-vps/) для кэша и Celery, [RabbitMQ](/blog/rabbitmq-ocheredi-na-vps/) для очередей.

---

## Подготовка VPS

Следуйте [настройке Ubuntu](/blog/ubuntu-24-04-pervaya-nastroyka-vps/):

\`\`\`bash
sudo apt install python3-pip python3-venv nginx postgresql -y
\`\`\`

---

## Проект и venv

\`\`\`bash
cd /var/www
sudo -u deploy git clone https://github.com/you/project.git django-app
cd django-app
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt gunicorn
\`\`\`

\`\`\`bash
python manage.py collectstatic --noinput
python manage.py migrate
\`\`\`

---

## settings.py production

\`\`\`python
DEBUG = False
ALLOWED_HOSTS = ['example.com', 'www.example.com']
STATIC_ROOT = BASE_DIR / 'staticfiles'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': '127.0.0.1',
    }
}
\`\`\`

Тюнинг PostgreSQL — [PostgreSQL на VPS](/blog/postgresql-tuning-vps/).

---

## Gunicorn + systemd

\`\`\`ini
# /etc/systemd/system/gunicorn.service
[Unit]
Description=Gunicorn Django
After=network.target

[Service]
User=deploy
WorkingDirectory=/var/www/django-app
EnvironmentFile=/var/www/django-app/.env
ExecStart=/var/www/django-app/venv/bin/gunicorn \\
  --workers 3 --bind 127.0.0.1:8000 config.wsgi:application
Restart=on-failure

[Install]
WantedBy=multi-user.target
\`\`\`

\`\`\`bash
sudo systemctl enable --now gunicorn
\`\`\`

Подробнее о systemd — [Linux-сервисы](/blog/systemd-linux-servisy/).

---

## Nginx

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    location /static/ {
        alias /var/www/django-app/staticfiles/;
    }
    location /media/ {
        alias /var/www/django-app/media/;
    }
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
\`\`\`

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Media на больших объёмах — [MinIO S3](/blog/minio-s3-na-vps/).

---

## Workers и RAM

| VPS RAM | Gunicorn workers |
| --- | --- |
| 1 GB | 2 |
| 2 GB | 3 |
| 4 GB | 4–5 |

Формула: \`(2 × CPU) + 1\`, но не больше доступной RAM.

---

## CI/CD

Автодеплой через [GitHub Actions](/blog/github-actions-cicd/) или [GitLab Runner](/blog/gitlab-runner-cicd-vps/): pull → migrate → collectstatic → restart gunicorn.

---

## Итог

Django на VPS — предсказуемый стек: Gunicorn + Nginx + PostgreSQL. Один раз настроили — масштабируете workers и RAM.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Python API альтернатива — [FastAPI](/blog/fastapi-deploy-vps/).`,
	},
	{
		slug: 'go-golang-deploy-vps',
		coverFile: 'cover-golang-vps.png',
		title: 'Go на VPS: деплой бинарника без лишних зависимостей',
		description:
			'Деплой Go-приложения на VPS: кросс-компиляция, systemd, Nginx, graceful shutdown. Минимальный RAM и максимальная скорость.',
		category: 'Разработка',
		keywords: ['Go VPS', 'Golang deploy', 'Go binary', 'systemd Go', 'backend Go', 'Storm Cloud'],
		body: `**Краткий ответ:** скомпилируйте Go в статический бинарник, скопируйте на VPS, запустите через systemd. Nginx — для SSL и reverse proxy. Go потребляет 20–50 MB RAM — идеален для маленького VPS.

Go — лучший выбор, когда на [2 GB VPS](/blog/choose-vps/) нужно держать API, worker и Nginx одновременно. Сравните с [Node.js](/blog/nodejs-pm2-deploy/) (100+ MB на процесс).

---

## Почему Go на VPS

| | Go binary | Node.js | Python |
| --- | --- | --- | --- |
| RAM | 20–50 MB | 100–300 MB | 80–200 MB |
| Зависимости на сервере | Нет | Node + node_modules | Python + venv |
| Старт | Мгновенный | 1–3 сек | 1–2 сек |
| Кросс-компиляция | Да | Нет | Нет |

---

## Кросс-компиляция

\`\`\`bash
# На dev-машине (Windows/macOS/Linux)
GOOS=linux GOARCH=amd64 go build -o app ./cmd/main.go
\`\`\`

Скопируйте один файл:

\`\`\`bash
scp app deploy@VPS:/opt/myapp/app
\`\`\`

Никакого runtime на сервере — только бинарник.

---

## systemd unit

\`\`\`ini
[Unit]
Description=Go API
After=network.target

[Service]
User=deploy
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/app
Restart=on-failure
RestartSec=5
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
\`\`\`

\`\`\`bash
sudo systemctl enable --now go-api
\`\`\`

См. [systemd на Linux](/blog/systemd-linux-servisy/).

---

## Nginx + SSL

\`\`\`nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
\`\`\`

[SSL Let's Encrypt](/blog/ssl-letsencrypt-vps/) + [Cloudflare](/blog/cloudflare-i-vps/) для CDN.

---

## Graceful shutdown

\`\`\`go
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit
srv.Shutdown(context.WithTimeout(context.Background(), 10*time.Second))
\`\`\`

При \`systemctl restart\` — zero dropped connections.

---

## Docker альтернатива

\`\`\`dockerfile
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o app .

FROM scratch
COPY --from=builder /app/app /app
ENTRYPOINT ["/app"]
\`\`\`

Образ ~10 MB — см. [multi-stage builds](/blog/docker-multi-stage-builds/).

---

## Мониторинг и логи

- Structured JSON logs → [journalctl](/blog/journalctl-logi-linux-vps/)
- Метрики — Prometheus /metrics endpoint
- Алерты — [Grafana](/blog/grafana-prometheus-vps/)

---

## RAM на VPS

| Нагрузка | RAM |
| --- | --- |
| API 1000 rps | 512 MB–1 GB |
| API + worker | 1–2 GB |
| Несколько сервисов | 2 GB |

Go позволяет отложить апгрейд VPS дольше, чем Node/Python.

---

## Итог

Go + VPS = один бинарник, systemd, Nginx. Минимум moving parts, максимум производительности на дешёвом сервере.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). Docker-вариант — [Compose](/blog/docker-compose-vps/).`,
	},
	{
		slug: 'coolify-na-vps',
		coverFile: 'cover-coolify-vps.png',
		title: 'Coolify на VPS: свой Heroku за один вечер',
		description:
			'Установка Coolify на VPS: деплой из Git, Docker, SSL, базы данных. Self-hosted PaaS для разработчиков без DevOps-команды.',
		category: 'DevOps',
		keywords: ['Coolify VPS', 'self-hosted PaaS', 'деплой из Git', 'Heroku альтернатива', 'Docker deploy', 'Storm Cloud'],
		body: `**Краткий ответ:** Coolify — self-hosted PaaS на VPS. Установите одной командой, подключите GitHub/GitLab, деплойте приложения с авто SSL. Альтернатива ручному [Docker Compose](/blog/docker-compose-vps/) и [развёртыванию с нуля](/blog/razvernut-sayt-na-vps-2026/).

Не хотите каждый раз настраивать Nginx, SSL и env? Coolify автоматизирует это — как Vercel, но на вашем VPS.

---

## Coolify vs ручной деплой vs Kubernetes

| | Coolify | Ручной Nginx+Docker | k3s |
| --- | --- | --- | --- |
| Время старта | 30 мин | 2–4 часа | 1 день+ |
| Гибкость | Средняя | Полная | Высокая |
| RAM | 2 GB+ | 1 GB+ | 4 GB+ |
| Для кого | Solo dev, малые команды | Опытные | DevOps |

---

## Требования

- Ubuntu 22.04/24.04
- **Минимум 2 GB RAM** (4 GB комфортнее)
- Домен с DNS на VPS
- Порты 80, 443, 8000

Подготовка сервера — [Ubuntu первая настройка](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).

---

## Установка

\`\`\`bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
\`\`\`

Откройте \`http://ВАШ_IP:8000\`, создайте admin. После настройки домена — HTTPS автоматически.

---

## Деплой приложения из Git

1. New Resource → Application
2. Подключите GitHub/GitLab
3. Выберите репозиторий и ветку
4. Coolify определит Dockerfile или buildpack
5. Задайте домен → SSL готов

Поддерживает: Node.js, Python, PHP, Go, static sites, Docker Compose.

---

## Базы данных в Coolify

Встроенные PostgreSQL, MySQL, Redis, MongoDB — один клик. Для production с большими данными — отдельный VPS с [PostgreSQL tuning](/blog/postgresql-tuning-vps/).

---

## Несколько проектов на одном VPS

| VPS | Проектов |
| --- | --- |
| 2 GB | 2–3 лёгких |
| 4 GB | 5–8 |
| 8 GB | 10+ |

Мониторьте RAM через [Grafana](/blog/grafana-prometheus-vps/) — Coolify сам не покажет узкие места.

---

## Безопасность

- Смените дефолтный порт после настройки
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на SSH
- Не храните production БД без бэкапов — [правило 3-2-1](/blog/backup-vps-3-2-1/)
- Обновляйте Coolify регулярно

---

## Coolify vs Portainer

[Portainer](/blog/portainer-docker-vps/) — управление контейнерами. Coolify — полный деплой-пайплайн из Git. Можно использовать вместе.

---

## Итог

Coolify снижает порог входа на VPS до уровня PaaS. Идеален для pet-проектов, staging и малых production.

VPS от 4 GB — [StormNet Cloud](https://stormnetcloud.com/). CI/CD вручную — [GitHub Actions](/blog/github-actions-cicd/).`,
	},
	{
		slug: 'portainer-docker-vps',
		coverFile: 'cover-portainer-vps.png',
		title: 'Portainer на VPS: веб-UI для управления Docker',
		description:
			'Установка Portainer на VPS: стеки, контейнеры, volumes, логи через браузер. Удобное управление Docker без CLI.',
		category: 'Docker',
		keywords: ['Portainer VPS', 'Docker UI', 'управление контейнерами', 'Docker web', 'Portainer CE', 'Storm Cloud'],
		body: `**Краткий ответ:** Portainer — веб-интерфейс для Docker. Установите CE-версию в контейнер, откройте через HTTPS — управляйте контейнерами, стеками и логами без SSH.

CLI Docker мощный, но для визуального контроля и быстрых действий Portainer экономит время — особенно на [нескольких VPS](/blog/docker-swarm-na-vps/).

---

## Portainer CE vs Business

| | CE (бесплатно) | Business |
| --- | --- | --- |
| Управление контейнерами | Да | Да |
| Swarm / K8s | Да | Расширено |
| RBAC | Базовый | Полный |
| Edge agents | Да | Да |

Для личного VPS и малых команд — **CE достаточно**.

---

## Установка

\`\`\`bash
docker volume create portainer_data
docker run -d \\
  -p 127.0.0.1:9443:9443 \\
  --name portainer \\
  --restart=always \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  -v portainer_data:/data \\
  portainer/portainer-ce:latest
\`\`\`

Доступ: SSH tunnel или Nginx reverse proxy + [SSL](/blog/ssl-letsencrypt-vps/).

---

## Nginx перед Portainer

\`\`\`nginx
server {
    listen 443 ssl;
    server_name portainer.example.com;
    location / {
        proxy_pass https://127.0.0.1:9443;
        proxy_ssl_verify off;
    }
}
\`\`\`

Ограничьте доступ по IP или [WireGuard VPN](/blog/wireguard-vpn-na-vps/).

---

## Управление стеками

Импортируйте docker-compose.yml через UI:
- Редактирование env variables
- Restart / update образов
- Просмотр логов в реальном времени

Удобно для [Grafana](/blog/grafana-prometheus-vps/), [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/), [MinIO](/blog/minio-s3-na-vps/).

---

## Несколько серверов (Edge)

Portainer Agent на удалённых VPS → единый dashboard. Полезно при [Docker Swarm](/blog/docker-swarm-na-vps/) или нескольких проектах.

---

## Безопасность

- **Никогда** не открывайте Portainer в интернет без auth + SSL
- Сильный пароль admin
- [CrowdSec](/blog/crowdsec-zashchita-vps/) + [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/)
- Регулярные обновления образа portainer

---

## Portainer vs Coolify vs CLI

| | Portainer | Coolify | Docker CLI |
| --- | --- | --- | --- |
| UI | Да | Да | Нет |
| Git deploy | Нет | Да | Нет |
| Контроль | Высокий | Средний | Максимальный |

[Coolify](/blog/coolify-na-vps/) для деплоя, Portainer для ops.

---

## RAM

Portainer сам ~50–100 MB. Закладывайте RAM под контейнеры, не под UI.

---

## Итог

Portainer — must-have для Docker на VPS, если не хотите жить в терминале. CE бесплатен и покрывает 95% задач.

VPS с Docker — [StormNet Cloud](https://stormnetcloud.com/). Старт с Docker — [Compose на VPS](/blog/docker-compose-vps/).`,
	},
	{
		slug: 'mariadb-optimizaciya-vps',
		coverFile: 'cover-mariadb-vps.png',
		title: 'MariaDB на VPS: оптимизация и тюнинг производительности',
		description:
			'Тюнинг MariaDB на VPS: innodb_buffer_pool, соединения, индексы, slow query log. WordPress и Laravel без тормозов на 2 GB RAM.',
		category: 'DevOps',
		keywords: ['MariaDB VPS', 'оптимизация MySQL', 'innodb_buffer_pool', 'тюнинг БД', 'MariaDB tuning', 'Storm Cloud'],
		body: `**Краткий ответ:** на VPS с 2 GB RAM задайте \`innodb_buffer_pool_size = 512M–768M\`, включите slow query log, проверьте индексы. MariaDB по умолчанию жадная — без тюнинга съест всю память.

MariaDB — форк MySQL, дефолт для Ubuntu и [WordPress](/blog/wordpress-vps-2026/). Сравнение с PostgreSQL — [MySQL vs PostgreSQL](/blog/mysql-ili-postgresql-vps/).

---

## MariaDB vs MySQL на VPS

| | MariaDB | MySQL 8 |
| --- | --- | --- |
| Лицензия | GPL | Dual |
| WordPress | Нативно | Нативно |
| Производительность | Сопоставима | Сопоставима |
| На Ubuntu | apt install mariadb | Отдельный репо |

Для новых проектов на SQL — также рассмотрите [PostgreSQL](/blog/postgresql-tuning-vps/).

---

## Базовый тюнинг для 2 GB VPS

\`\`\`ini
# /etc/mysql/mariadb.conf.d/50-server.cnf
[mysqld]
innodb_buffer_pool_size = 512M
innodb_log_file_size = 64M
max_connections = 100
query_cache_type = 0
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
\`\`\`

\`\`\`bash
sudo systemctl restart mariadb
\`\`\`

---

## Расчёт innodb_buffer_pool

| VPS RAM | buffer_pool (приложение на том же VPS) |
| --- | --- |
| 1 GB | 256M |
| 2 GB | 512M |
| 4 GB | 1–1.5G |
| 8 GB | 3–4G |

Правило: **50–70% RAM**, если БД на dedicated VPS — до 80%.

---

## Мониторинг медленных запросов

\`\`\`bash
sudo mysqldumpslow /var/log/mysql/slow.log
\`\`\`

Типичные проблемы WordPress/Laravel:
- SELECT без индекса на meta_key
- JOIN без индекса
- ORDER BY на большой таблице

---

## Индексы и EXPLAIN

\`\`\`sql
EXPLAIN SELECT * FROM wp_posts WHERE post_status = 'publish' ORDER BY post_date DESC LIMIT 10;
\`\`\`

\`type: ALL\` + высокий \`rows\` = нужен индекс.

---

## Бэкапы

\`\`\`bash
mysqldump --single-transaction -u root mydb | gzip > backup.sql.gz
\`\`\`

Автоматизация + off-site — [бэкапы 3-2-1](/blog/backup-vps-3-2-1/). Хранение — [MinIO](/blog/minio-s3-na-vps/).

---

## Кэширование поверх MariaDB

- [Redis](/blog/redis-kesh-vps/) — object cache WordPress/Laravel
- [Memcached](/blog/memcached-kesh-vps/) — проще, без persistence
- Query cache в MariaDB 10.6+ удалён — не включайте

---

## Безопасность

\`\`\`bash
sudo mysql_secure_installation
\`\`\`

- bind-address = 127.0.0.1
- Отдельный пользователь per app
- Не открывайте 3306 в интернет

---

## Итог

MariaDB на VPS с 2 GB жизнеспособна после тюнинга buffer pool и индексов. Мониторьте slow log — он покажет 80% проблем.

VPS для БД — [StormNet Cloud](https://stormnetcloud.com/). PHP-стек — [PHP-FPM тюнинг](/blog/php-fpm-tuning-vps/).`,
	},
	{
		slug: 'memcached-kesh-vps',
		coverFile: 'cover-memcached-vps.png',
		title: 'Memcached на VPS: кэширование для ускорения сайта',
		description:
			'Установка Memcached на VPS: object cache для WordPress, Drupal, Laravel. Сравнение с Redis, настройка памяти и безопасность.',
		category: 'DevOps',
		keywords: ['Memcached VPS', 'кэширование сайта', 'object cache', 'WordPress cache', 'Memcached Linux', 'Storm Cloud'],
		body: `**Краткий ответ:** Memcached — in-memory кэш для ускорения чтения из БД. На VPS ставится за 5 минут, даёт 2–5× ускорение WordPress при правильных плагинах. Для очередей и persistence — [Redis](/blog/redis-kesh-vps/).

Когда БД — узкое место, object cache снимает нагрузку. Memcached проще Redis, если нужен только кэш без pub/sub.

---

## Memcached vs Redis

| | Memcached | Redis |
| --- | --- | --- |
| Модель | Только key-value cache | Cache + структуры + очереди |
| Persistence | Нет | Да (RDB/AOF) |
| RAM efficiency | Чуть лучше на простом кэше | Универсальнее |
| Laravel/WordPress | Да | Да |

Один VPS — выберите **одно**: Redis обычно достаточно. Memcached — если нужна максимальная простота кэша.

---

## Установка

\`\`\`bash
sudo apt install memcached -y
sudo systemctl enable memcached
\`\`\`

\`\`\`ini
# /etc/memcached.conf
-m 256          # 256 MB RAM
-l 127.0.0.1   # только localhost
-u memcache
\`\`\`

\`\`\`bash
sudo systemctl restart memcached
echo "stats" | nc 127.0.0.1 11211
\`\`\`

---

## WordPress + Memcached

Плагин W3 Total Cache или Object Cache Pro:

\`\`\`php
// wp-config.php
define('WP_CACHE_KEY_SALT', 'example.com:');
\`\`\`

Кэшируются: wp_options, post meta, taxonomy. Снижение запросов к [MariaDB](/blog/mariadb-optimizaciya-vps/) — в разы.

---

## Laravel

\`\`\`env
CACHE_DRIVER=memcached
MEMCACHED_HOST=127.0.0.1
MEMCACHED_PORT=11211
\`\`\`

Для сессий и очередей — лучше Redis или [RabbitMQ](/blog/rabbitmq-ocheredi-na-vps/).

---

## RAM на VPS

| Сайт | Memcached |
| --- | --- |
| Блог WordPress | 128–256 MB |
| WooCommerce | 512 MB |
| API + cache | 256–512 MB |

Не отдавайте Memcached больше 40% RAM VPS — оставьте место приложению и БД.

---

## Мониторинг hit rate

\`\`\`bash
echo "stats" | nc 127.0.0.1 11211 | grep get_
\`\`\`

- \`get_hits\` / (\`get_hits\` + \`get_misses\`) = hit rate
- Цель: > 90% для object cache

Метрики в [Grafana](/blog/grafana-prometheus-vps/) через memcached_exporter.

---

## Безопасность

- **Только 127.0.0.1** — порт 11211 без auth, открытый в интернет = утечка данных
- [UFW](/blog/ubuntu-24-04-pervaya-nastroyka-vps/) блокирует 11211 снаружи

---

## Итог

Memcached — быстрый win для WordPress и PHP на VPS. 256 MB кэша часто важнее апгрейда CPU.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Альтернатива — [Redis на VPS](/blog/redis-kesh-vps/).`,
	},
	{
		slug: 'sentry-self-hosted-vps',
		coverFile: 'cover-sentry-vps.png',
		title: 'Sentry self-hosted на VPS: отслеживание ошибок в production',
		description:
			'Развёртывание Sentry на VPS: Docker Compose, алерты, интеграция с Node.js, Python, Go. Свой error tracking без облачной подписки.',
		category: 'DevOps',
		keywords: ['Sentry VPS', 'error tracking', 'self-hosted Sentry', 'мониторинг ошибок', 'Sentry Docker', 'Storm Cloud'],
		body: `**Краткий ответ:** Sentry self-hosted на VPS ловит ошибки frontend и backend, показывает stack trace и контекст. Официальный Docker Compose — 4+ GB RAM, для малых проектов рассмотрите GlitchTip как лёгкую альтернативу.

Без error tracking production слепой. Sentry — стандарт индустрии, self-hosted снимает лимиты бесплатного tier.

---

## Sentry cloud vs self-hosted

| | Cloud free | Self-hosted VPS |
| --- | --- | --- |
| События/мес | Лимит | Без лимита |
| RAM | — | 4 GB+ |
| Обновления | Авто | Вручную |
| Данные | У Sentry | У вас |

---

## Требования к VPS

| Компонент | RAM |
| --- | --- |
| Sentry minimal | 4 GB |
| Comfortable | 8 GB |
| + PostgreSQL + Redis | Включено в compose |

Для 2 GB VPS — **GlitchTip** (совместим с Sentry SDK) или cloud Sentry free tier.

---

## Установка (официальный self-hosted)

\`\`\`bash
git clone https://github.com/getsentry/self-hosted.git
cd self-hosted
./install.sh
docker compose up -d
\`\`\`

Первый запуск — 15–30 мин. UI на порту 9000.

---

## Nginx + SSL

\`\`\`nginx
server {
    listen 443 ssl;
    server_name sentry.example.com;
    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        client_max_body_size 10M;
    }
}
\`\`\`

[SSL](/blog/ssl-letsencrypt-vps/) обязателен — SDK шлёт ошибки по HTTPS.

---

## Интеграция Node.js

\`\`\`javascript
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: 'https://key@sentry.example.com/1' });
\`\`\`

Аналогично для [Next.js](/blog/nextjs-deploy-na-vps/), [Django](/blog/django-deploy-na-vps/), [Go](/blog/go-golang-deploy-vps/).

---

## Алерты

- Email при новой ошибке
- Slack / Telegram webhook
- Issue assignment в команде

Дополняет [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) (доступность) и [Grafana](/blog/grafana-prometheus-vps/) (метрики).

---

## Бэкапы

Sentry хранит события в PostgreSQL + ClickHouse (в новых версиях). Бэкап volumes:

\`\`\`bash
docker compose stop
tar czf sentry-backup.tar.gz ./sentry-data
\`\`\`

Off-site — [MinIO](/blog/minio-s3-na-vps/) + [правило 3-2-1](/blog/backup-vps-3-2-1/).

---

## Безопасность

- Не публикуйте без auth
- Ротация DSN keys per project
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на Nginx
- Обновляйте self-hosted — security patches

---

## Итог

Sentry self-hosted — для команд с объёмом ошибок выше free tier. Закладывайте 4+ GB VPS и время на обслуживание.

VPS 8 GB — [StormNet Cloud](https://stormnetcloud.com/). Логи ОС — [journalctl](/blog/journalctl-logi-linux-vps/).`,
	},
	{
		slug: 'k3s-klaster-na-vps',
		coverFile: 'cover-k3s-vps.png',
		title: 'k3s на VPS: легковесный Kubernetes за 10 минут',
		description:
			'Установка k3s на VPS: поды, сервисы, Ingress, Helm. Production-ready Kubernetes без тяжёлого K8s для 1–3 серверов.',
		category: 'Облака',
		keywords: ['k3s VPS', 'Kubernetes VPS', 'легкий Kubernetes', 'k3s install', 'Helm VPS', 'Storm Cloud'],
		body: `**Краткий ответ:** k3s — облегчённый Kubernetes от Rancher. Одна команда на VPS — рабочий кластер. Для 1–3 серверов k3s практичнее полного K8s и проще [Minikube](/blog/kubernetes-minikube-vps/).

Когда [Docker Compose](/blog/docker-compose-vps/) не хватает для оркестрации, а полный Kubernetes пугает — k3s золотая середина.

---

## k3s vs Minikube vs Docker Swarm

| | k3s | Minikube | Swarm |
| --- | --- | --- | --- |
| Production | Да | Нет (dev) | Да |
| RAM минимум | 1 GB | 2 GB | 1 GB |
| Multi-node | Да | Сложно | Да |
| Экосистема K8s | Полная | Полная | Docker-only |

---

## Установка single-node

\`\`\`bash
curl -sfL https://get.k3s.io | sh -
sudo kubectl get nodes
\`\`\`

Kubeconfig:

\`\`\`bash
sudo cat /etc/rancher/k3s/k3s.yaml
\`\`\`

Подготовка VPS — [Ubuntu настройка](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).

---

## Деплой приложения

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myapi:latest
          ports:
            - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080
\`\`\`

\`\`\`bash
kubectl apply -f api.yaml
\`\`\`

---

## Ingress (Traefik встроен в k3s)

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  tls:
    - hosts: [api.example.com]
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
\`\`\`

Альтернатива — [Traefik standalone](/blog/traefik-reverse-proxy-vps/).

---

## Multi-node кластер

На втором VPS:

\`\`\`bash
curl -sfL https://get.k3s.io | K3S_URL=https://manager:6443 K3S_TOKEN=xxx sh -
\`\`\`

Связь между нодами — приватная сеть или [WireGuard](/blog/wireguard-vpn-na-vps/).

---

## Helm

\`\`\`bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install redis bitnami/redis
\`\`\`

---

## RAM

| Кластер | RAM |
| --- | --- |
| 1 node, 2–3 пода | 2 GB |
| 1 node, 10+ подов | 4 GB |
| 3 nodes | 2 GB per node |

Мониторинг — [Grafana](/blog/grafana-prometheus-vps/) + kube-prometheus-stack.

---

## k3s vs managed Kubernetes

Self-hosted k3s на [StormNet Cloud](https://stormnetcloud.com/) дешевле managed при 1–3 серверах. Managed — когда нужен SLA и control plane без забот.

---

## Итог

k3s — вход в Kubernetes без боли. Один VPS для старта, масштаб на worker-ноды по мере роста.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). IaC — [Terraform](/blog/terraform-vps-infrastruktura/). Swarm проще — [Docker Swarm](/blog/docker-swarm-na-vps/).`,
	},
	{
		slug: 'journalctl-logi-linux-vps',
		coverFile: 'cover-journalctl-vps.png',
		title: 'journalctl на VPS: работа с логами Linux и systemd',
		description:
			'Гайд по journalctl: просмотр логов сервисов, фильтры, ротация, экспорт. Диагностика падений Nginx, Docker и приложений на VPS.',
		category: 'Linux',
		keywords: ['journalctl VPS', 'логи Linux', 'systemd логи', 'диагностика сервера', 'journalctl фильтры', 'Storm Cloud'],
		body: `**Краткий ответ:** journalctl — центральный просмотр логов systemd на Linux VPS. \`journalctl -u nginx -f\` — live-лог сервиса. Без знания journalctl диагностика [Nginx ошибок](/blog/nginx-logi-i-oshibki/) и падений приложений занимает в разы больше времени.

На современном Ubuntu всё идёт через systemd/journald. Файлы в /var/log/ ещё есть, но systemd-сервисы — в journal.

---

## Базовые команды

\`\`\`bash
journalctl -xe                    # последние ошибки
journalctl -u nginx -f            # follow nginx
journalctl -u gunicorn --since "1 hour ago"
journalctl -u docker -p err       # только error priority
\`\`\`

---

## Фильтры по времени

\`\`\`bash
journalctl --since "2026-07-10 09:00" --until "2026-07-10 10:00"
journalctl --since today
journalctl --since "-30min"
\`\`\`

При инциденте — сузьте окно до минут падения.

---

## Несколько сервисов

\`\`\`bash
journalctl -u nginx -u php8.3-fpm -u mysql --since "-1h"
\`\`\`

Типичная цепочка [Laravel](/blog/laravel-na-vps/): Nginx 502 → смотрите php-fpm и gunicorn/node.

---

## Приоритеты (уровни логов)

| Priority | Уровень |
| --- | --- |
| 0–3 | emerg–err (критично) |
| 4 | warning |
| 6 | info |
| 7 | debug |

\`\`\`bash
journalctl -p warning -u ssh
\`\`\`

Полезно для [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) и SSH-атак.

---

## Экспорт и ротация

\`\`\`bash
journalctl -u myapp --since today > /tmp/myapp.log
journalctl --disk-usage
sudo journalctl --vacuum-size=500M
\`\`\`

В \`/etc/systemd/journald.conf\`:

\`\`\`ini
SystemMaxUse=500M
MaxRetentionSec=30day
\`\`\`

Иначе journal съест диск на маленьком VPS.

---

## Docker и journalctl

\`\`\`bash
journalctl -u docker
docker logs container_name
\`\`\`

Для [Portainer](/blog/portainer-docker-vps/) — UI логов удобнее, journalctl — для системных ошибок Docker daemon.

---

## Структурированные логи (JSON)

Приложения с JSON-логами в stdout (Go, structured Python):

\`\`\`bash
journalctl -u go-api -o json-pretty
\`\`\`

Для централизации — отправка в Loki/ELK (отдельная статья) или [Sentry](/blog/sentry-self-hosted-vps/) для ошибок.

---

## journalctl vs файлы в /var/log

| | journalctl | /var/log/nginx/ |
| --- | --- | --- |
| systemd сервисы | Да | Иногда дублирует |
| Nginx access log | Нет | Да |
| Бинарный формат | Да (читается через journalctl) | Текст |
| Ротация | journald vacuum | logrotate |

Для Nginx access — файлы + [анализ логов](/blog/nginx-logi-i-oshibki/). Для systemd — journalctl.

---

## Чек-лист диагностики падения

1. \`journalctl -xe\` — что упало последним
2. \`systemctl status SERVICENAME\` — код выхода
3. \`journalctl -u SERVICENAME -n 100\` — контекст
4. Проверить RAM/disk — [Grafana](/blog/grafana-prometheus-vps/)
5. [Бэкап](/blog/backup-vps-3-2-1/) перед рестартом

---

## Итог

journalctl — первый инструмент при любом «сервер не работает». Выучите 5–6 флагов — сэкономите часы при каждом инциденте.

VPS для практики — [StormNet Cloud](https://stormnetcloud.com/). Сервисы — [systemd гайд](/blog/systemd-linux-servisy/). Мониторинг — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).`,
	},
];

for (const article of articles) {
	const dir = path.join(blogRoot, article.slug);
	fs.mkdirSync(dir, { recursive: true });

	const coverSrc = path.join(assetsRoot, article.coverFile);
	if (fs.existsSync(coverSrc)) {
		await sharp(coverSrc)
			.resize(1200, 630, { fit: 'cover' })
			.webp({ quality: 88 })
			.toFile(path.join(dir, 'cover.webp'));
		console.log('cover:', article.slug);
	} else {
		console.warn('missing cover:', coverSrc);
	}

	const keywordsYaml = article.keywords.map((k) => `  - "${k}"`).join('\n');
	const md = `---
title: "${article.title}"
description: "${article.description}"
pubDate: 2026-07-10
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
