import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.join(__dirname, '../src/content/blog');
const assetsRoot =
	'C:/Users/User/.cursor/projects/C-Users-User-AppData-Local-Temp-d40b507b-3ca3-4425-b871-71340de52e41/assets';

const articles = [
	{
		slug: 'nextcloud-oblako-vps',
		coverFile: 'cover-nextcloud-vps.png',
		pubDate: '2026-07-04',
		title: 'Nextcloud на VPS: своё облако для файлов и команд',
		description:
			'Полный гайд Nextcloud на VPS: Docker, PostgreSQL, Redis, OnlyOffice, бэкапы и hardening. Self-hosted альтернатива Google Drive и Dropbox.',
		category: 'DevOps',
		keywords: ['Nextcloud VPS', 'self-hosted cloud', 'файловое хранилище', 'OnlyOffice', 'Dropbox альтернатива', 'Storm Cloud'],
		body: `**Краткий ответ:** Nextcloud — self-hosted облако: файлы, календарь, контакты, совместный доступ, OnlyOffice. На VPS 2–4 GB: Docker Compose + PostgreSQL + Redis + [SSL](/blog/ssl-letsencrypt-vps/) + регулярные [бэкапы](/blog/backup-vps-3-2-1/).

Если данные клиентов, исходники или документы команды не должны лежать у Google/Microsoft — Nextcloud на [VPS](/blog/choose-vps/) даёт контроль, GDPR-friendly setup и предсказуемую стоимость.

---

## Зачем Nextcloud в 2026

| Сценарий | Почему Nextcloud |
| --- | --- |
| Фриланс / малый бизнес | Общие папки без абонплаты за TB |
| Dev-команда | Share конфигов, скриптов, runbook'ов |
| Семья | Фото/документы без iCloud lock-in |
| Compliance | Данные в вашем регионе (EU VPS) |

Альтернатива «просто [MinIO S3](/blog/minio-s3-na-vps/)» — Nextcloud даёт UI, ACL, клиенты desktop/mobile из коробки.

---

## Архитектура production

\`\`\`
Клиенты (WebDAV, app, sync)
        ↓
   Nginx + SSL
        ↓
   Nextcloud (PHP-FPM / Apache in container)
        ↓
PostgreSQL + Redis + /data volume
\`\`\`

- **PostgreSQL** — метаданные (не SQLite в production)
- **Redis** — file locking, transactional memcache
- **Object storage** (опционально) — [MinIO](/blog/minio-s3-na-vps/) backend для больших объёмов

---

## Требования к VPS

| Нагрузка | RAM | Диск |
| --- | --- | --- |
| 1–5 пользователей | 2 GB | 40 GB SSD |
| 10–30 пользователей | 4 GB | 100 GB+ SSD |
| 50+ | 8 GB + tuning | NVMe, отдельный DB |

CPU: 2 vCPU минимум. Не ставьте Nextcloud на 512 MB — будет боль.

---

## Docker Compose (production-ready)

\`\`\`yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: nextcloud
      POSTGRES_USER: nextcloud
      POSTGRES_PASSWORD: CHANGE_ME
    volumes:
      - ./postgres:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  app:
    image: nextcloud:29-apache
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"
    environment:
      POSTGRES_HOST: db
      POSTGRES_DB: nextcloud
      POSTGRES_USER: nextcloud
      POSTGRES_PASSWORD: CHANGE_ME
      REDIS_HOST: redis
      NEXTCLOUD_TRUSTED_DOMAINS: cloud.example.com
      OVERWRITEPROTOCOL: https
    volumes:
      - ./nextcloud:/var/www/html
    depends_on:
      - db
      - redis
\`\`\`

Reverse proxy — [Nginx](/blog/nginx-ili-caddy/) или [Traefik](/blog/traefik-reverse-proxy-vps/).

---

## Первоначальная настройка

1. Откройте \`https://cloud.example.com\`
2. Создайте admin (сильный пароль + 2FA позже)
3. **Settings → Overview** — устраните все warnings (HTTPS, memory, cron)
4. Включите **Server-side encryption** только если понимаете recovery (ключи!)

---

## Cron и background jobs

Nextcloud требует cron каждые 5 минут:

\`\`\`bash
docker compose exec -u www-data app php occ background:cron
\`\`\`

Crontab на хосте:

\`\`\`cron
*/5 * * * * cd /opt/nextcloud && docker compose exec -T -u www-data app php occ background:cron
\`\`\`

Без cron — медленный UI и «зависшие» uploads.

---

## OnlyOffice / Collabora

Редактирование docx/xlsx в браузере:

\`\`\`yaml
  onlyoffice:
    image: onlyoffice/documentserver
    restart: unless-stopped
    ports:
      - "127.0.0.1:9980:80"
\`\`\`

В Nextcloud: Apps → OnlyOffice → URL document server. RAM +1 GB минимум.

---

## Desktop и mobile sync

- Windows/macOS/Linux — официальный Nextcloud client
- Android/iOS — Nextcloud app
- WebDAV — \`https://cloud.example.com/remote.php/dav\`

Для больших файлов увеличьте лимиты Nginx:

\`\`\`nginx
client_max_body_size 10G;
proxy_read_timeout 3600;
\`\`\`

---

## SSO через Authentik

Если уже есть [Authentik](/blog/authentik-sso-vps/):

1. OIDC provider в Authentik
2. Nextcloud app «OpenID Connect Login»
3. Redirect URI \`https://cloud.example.com/apps/user_oidc/code\`

Один логин для wiki, git, cloud.

---

## Бэкапы (обязательно)

**3-2-1 правило** — [гайд](/blog/backup-vps-3-2-1/):

\`\`\`bash
# PostgreSQL
docker compose exec -T db pg_dump -U nextcloud nextcloud > nc-db-\$(date +%F).sql

# Data
tar czf nc-data-\$(date +%F).tar.gz ./nextcloud
\`\`\`

Offsite — [Restic](/blog/restic-backup-vps/) → [MinIO](/blog/minio-s3-na-vps/) или S3.

Тестируйте restore раз в квартал. Backup без restore — иллюзия.

---

## Hardening

- [nftables/UFW](/blog/nftables-firewall-vps/) — только 443 снаружи
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на Nginx auth
- Brute-force protection в Nextcloud settings
- Admin panel — IP allowlist или [Tailscale](/blog/tailscale-vpn-vps/)
- Обновления: \`docker compose pull && docker compose up -d\`

---

## Типичные проблемы

| Симптом | Решение |
| --- | --- |
| «Maintenance mode» | \`occ maintenance:mode --off\` |
| Медленный список файлов | Redis + PostgreSQL, не SQLite |
| Upload 413 | \`client_max_body_size\` в Nginx |
| Trusted domain error | \`occ config:system:set trusted_domains\` |
| High CPU | cron не работает или antivirus scan |

\`\`\`bash
docker compose exec -u www-data app php occ status
docker compose exec -u www-data app php occ check
\`\`\`

---

## Мониторинг

- Disk usage: \`df -h\`, алерт при 85%
- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — HTTP check
- [Prometheus node_exporter](/blog/grafana-prometheus-vps/) — RAM/disk
- Логи: \`docker compose logs -f app\`

---

## Стоимость vs SaaS

Dropbox Business 5 TB — десятки €/мес. VPS 4 GB + 200 GB NVMe — фиксированная цена, данные ваши. Окупается от ~5 активных пользователей.

VPS в EU — [StormNet Cloud](https://stormnetcloud.com/). Почасовая аренда для теста — [server-na-chas](/blog/server-na-chas/).

---

## Итог

Nextcloud на VPS — полноценное облако под вашим контролем. Docker + PostgreSQL + Redis + SSL + cron + бэкапы = production baseline. OnlyOffice и SSO — следующий уровень для команды.

Дальше: [BookStack wiki](/blog/bookstack-wiki-vps/) для доков, [Gitea](/blog/gitea-git-server-vps/) для кода, [Plausible](/blog/plausible-analytics-vps/) для метрик сайта.`,
	},
	{
		slug: 'jenkins-ci-cd-vps',
		coverFile: 'cover-jenkins-vps.png',
		pubDate: '2026-07-05',
		title: 'Jenkins на VPS: CI/CD pipeline с нуля до production',
		description:
			'Jenkins LTS на VPS: Docker, agents, Pipeline as Code, GitHub webhooks, деплой на staging. Полный гайд self-hosted CI/CD.',
		category: 'DevOps',
		keywords: ['Jenkins VPS', 'CI/CD pipeline', 'Jenkins Docker', 'self-hosted CI', 'DevOps Jenkins', 'Storm Cloud'],
		body: `**Краткий ответ:** Jenkins — классический self-hosted CI/CD. На VPS 2 GB: Docker, LTS, Pipeline из Jenkinsfile, agent на том же или отдельном VPS. Webhook из GitHub/GitLab → build → test → deploy.

Если [GitHub Actions](/blog/github-actions-cicd/) и [GitLab Runner](/blog/gitlab-runner-cicd-vps/) не подходят (air-gapped, compliance, unlimited minutes) — Jenkins всё ещё стандарт enterprise.

---

## Jenkins vs GitHub Actions vs GitLab CI

| | Jenkins | GitHub Actions | GitLab Runner |
| --- | --- | --- | --- |
| Self-hosted | Да | Hybrid | Да |
| Plugins | 2000+ | Marketplace | Built-in |
| Learning curve | Высокая | Низкая | Средняя |
| RAM | 2 GB+ | SaaS | 2 GB+ |

Jenkins выигрывает гибкостью pipeline и интеграциями (Slack, Jira, SonarQube).

---

## Архитектура

\`\`\`
Git push → Webhook → Jenkins controller
                         ↓
                    Jenkins agent (Docker)
                         ↓
              build → test → docker push → deploy VPS
\`\`\`

**Controller** — UI, scheduling, credentials.  
**Agent** — выполняет job (лучше отдельный VPS для isolation).

---

## Установка через Docker

\`\`\`yaml
services:
  jenkins:
    image: jenkins/jenkins:lts-jdk17
    restart: unless-stopped
    user: root
    ports:
      - "127.0.0.1:8080:8080"
      - "127.0.0.1:50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock

volumes:
  jenkins_home:
\`\`\`

\`\`\`bash
docker compose up -d
docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
\`\`\`

Nginx reverse proxy + [Let's Encrypt](/blog/ssl-letsencrypt-vps/) → \`https://ci.example.com\`.

---

## Первичная настройка

1. Unlock Jenkins (initialAdminPassword)
2. Install suggested plugins
3. Create admin user — **сразу включите 2FA** (plugin)
4. Configure global tools: JDK 17, Git, Docker

Не оставляйте Jenkins открытым в интернет без auth — bot'ы найдут за часы.

---

## Jenkinsfile (Pipeline as Code)

\`\`\`groovy
pipeline {
  agent any
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Test') {
      steps {
        sh 'npm ci && npm test'
      }
    }
    stage('Build Docker') {
      steps {
        sh 'docker build -t myapp:\${BUILD_NUMBER} .'
      }
    }
    stage('Deploy') {
      when { branch 'main' }
      steps {
        sh 'ssh deploy@vps "docker pull myapp:\${BUILD_NUMBER} && docker compose up -d"'
      }
    }
  }
  post {
    failure {
      echo 'Notify Telegram/Slack'
    }
  }
}
\`\`\`

Храните Jenkinsfile в репозитории — [infrastructure as code](/blog/terraform-vps-infrastruktura/) mindset.

---

## GitHub webhook

1. Jenkins job → Build Triggers → GitHub hook trigger
2. GitHub repo → Webhooks → \`https://ci.example.com/github-webhook/\`
3. Push → auto build

Для [Gitea](/blog/gitea-git-server-vps/) — аналогичный plugin.

---

## Credentials

Jenkins → Credentials:

- SSH key для deploy на [VPS](/blog/vps-first-steps/)
- Docker registry token
- API keys (не в Jenkinsfile plaintext!)

Лучше — [Vault](/blog/vault-secrets-vps/) plugin или Jenkins credential store + rotation.

---

## Agent на отдельном VPS

Controller на ci.example.com, agent на build.example.com:

\`\`\`bash
# На agent VPS
docker run -d --name jenkins-agent \\
  -e JENKINS_URL=https://ci.example.com \\
  -e JENKINS_SECRET=... \\
  -e JENKINS_AGENT_NAME=build-1 \\
  jenkins/inbound-agent
\`\`\`

Job не должен иметь root на production — только на build agent.

---

## Docker-in-Docker vs socket mount

| | docker.sock mount | DinD |
| --- | --- | --- |
| Простота | Да | Сложнее |
| Безопасность | Agent = root on host | Изолированнее |
| Production | Только trusted jobs | Предпочтительно |

Для pet-project — socket ok на dedicated build VPS. Для multi-tenant — DinD или [Kaniko](/blog/docker-multi-stage-builds/).

---

## Деплой приложений

Связка с существующими гайдами:

- [Node.js PM2](/blog/nodejs-pm2-deploy/)
- [Laravel](/blog/laravel-na-vps/)
- [Django](/blog/django-deploy-na-vps/)
- [Docker Compose](/blog/docker-compose-vps/) pull on VPS

Pipeline stage Deploy:

\`\`\`bash
rsync -az ./dist/ deploy@vps:/var/www/app/
ssh deploy@vps 'sudo systemctl restart myapp'
\`\`\`

---

## Мониторинг Jenkins

- Disk: \`jenkins_home\` растёт (artifacts!) — cleanup policy
- [Prometheus plugin](/blog/grafana-prometheus-vps/) — build duration, queue
- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — ci.example.com
- Логи: \`docker compose logs jenkins\`

\`\`\`groovy
// Jenkinsfile — ограничить хранение артефактов
options {
  buildDiscarder(logRotator(numToKeepStr: '20'))
}
\`\`\`

---

## Бэкапы

\`\`\`bash
docker run --rm -v jenkins_jenkins_home:/data -v \$(pwd):/backup alpine \\
  tar czf /backup/jenkins-\$(date +%F).tar.gz /data
\`\`\`

В volume — job configs, credentials (encrypted), plugins. Без бэкапа — потеря CI при disk failure.

---

## Типичные ошибки

| Ошибка | Fix |
| --- | --- |
| OutOfMemory | \`JAVA_OPTS=-Xmx1024m\`, VPS 4 GB |
| Permission denied docker.sock | Agent user в docker group |
| Webhook 403 | CSRF / GitHub IP allowlist |
| Slow queue | Добавить agents |
| Plugin hell | Pin LTS + test upgrades on staging |

---

## Безопасность checklist

- HTTPS only
- 2FA для admin
- Agent на отдельном VPS
- Не запускать unreviewed PR pipelines с secrets
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) + rate limit
- Обновлять LTS ежемесячно

---

## Итог

Jenkins на VPS — максимально гибкий CI/CD под ваш стек. Controller + agent, Jenkinsfile в git, webhooks, deploy на [StormNet Cloud](https://stormnetcloud.com/) VPS.

Альтернативы полегче: [GitHub Actions](/blog/github-actions-cicd/), [GitLab Runner](/blog/gitlab-runner-cicd-vps/). Jenkins — когда нужны plugins и полный контроль.`,
	},
	{
		slug: 'jellyfin-media-server-vps',
		coverFile: 'cover-jellyfin-vps.png',
		pubDate: '2026-07-06',
		title: 'Jellyfin на VPS: медиасервер для фильмов и сериалов',
		description:
			'Jellyfin media server на VPS: Docker, hardware transcoding, reverse proxy, SSL. Бесплатная альтернатива Plex без подписок.',
		category: 'DevOps',
		keywords: ['Jellyfin VPS', 'media server', 'Plex альтернатива', 'streaming VPS', 'self-hosted video', 'Storm Cloud'],
		body: `**Краткий ответ:** Jellyfin — open-source медиасервер без paywall. VPS 2–4 GB + большой диск (или mount): Docker, [Nginx](/blog/nginx-ili-caddy/) + [SSL](/blog/ssl-letsencrypt-vps/), клиенты на TV/phone.

Контент вы храните легально (свои rips, Creative Commons, личные видео). Jellyfin индексирует библиотеку и стримит домашним пользователям.

---

## Jellyfin vs Plex vs Emby

| | Jellyfin | Plex | Emby |
| --- | --- | --- | --- |
| Open-source | Да | Freemium | Freemium |
| Phone sync fee | Нет | Plex Pass | Premium |
| Plugins | Да | Да | Да |
| Self-hosted | Полностью | Частично | Да |

Для семьи без подписок — Jellyfin. Для IoT — [EMQX](/blog/emqx-mqtt-na-vps/), не путать.

---

## Когда VPS, а когда домашний NAS

| VPS | NAS дома |
| --- | --- |
| Доступ из любой точки | Локальная скорость 1 Gbit |
| Нужен большой uplink | 4K direct play без transcoding |
| Нет домашнего IP | Дешевле TB storage |

VPS 2 TB дорого — часто **VPS proxy + storage дома через [Tailscale](/blog/tailscale-vpn-vps/)** или только metadata на VPS.

---

## Требования

- **RAM:** 2 GB минимум, 4 GB если transcoding
- **CPU:** transcoding 1080p — 4 vCPU; 4K — GPU или не transcode
- **Disk:** библиотека медиа (100 GB – несколько TB)
- **Bandwidth:** 1080p ~5–10 Mbps на поток

---

## Docker установка

\`\`\`yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8096:8096"
    volumes:
      - ./config:/config
      - ./cache:/cache
      - /mnt/media:/media:ro
    environment:
      - JELLYFIN_PublishedServerUrl=https://jelly.example.com
\`\`\`

\`/mnt/media\` — attach volume или [MinIO mount](/blog/minio-s3-na-vps/) (не ideal для streaming latency).

---

## Reverse proxy + SSL

\`\`\`nginx
location / {
  proxy_pass http://127.0.0.1:8096;
  proxy_set_header Host \\$host;
  proxy_set_header X-Real-IP \\$remote_addr;
  proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \\$scheme;
}
\`\`\`

WebSocket для некоторых клиентов — включите upgrade headers. SSL — [certbot](/blog/certbot-dns-ssl-vps/) или Caddy.

---

## Библиотеки и naming

Структура для автоматического метadata:

\`\`\`
/media
  /movies
    /The Matrix (1999)
      The Matrix (1999).mkv
  /tv
    /Breaking Bad
      /Season 01
        Breaking Bad - S01E01.mkv
\`\`\`

Jellyfin → Dashboard → Libraries → Scan. Metadata plugins: TMDB, TVDB (API keys опционально).

---

## Transcoding

Settings → Playback → Transcoding:

- **Software** — работает везде, грузит CPU
- **Hardware** — Intel QuickSync / NVIDIA на bare metal; на VPS редко есть GPU
- **Стратегия:** direct play когда клиент поддерживает codec

На VPS без GPU ограничьте max simultaneous transcodes = 1–2.

\`\`\`bash
# Мониторинг CPU при transcode
htop
\`\`\`

---

## Доступ извне

1. **HTTPS** обязателен (credentials!)
2. [Authentik](/blog/authentik-sso-vps/) — optional SSO
3. Не открывайте 8096 напрямую — только через Nginx
4. [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на auth failures

Для семьи — отдельные user accounts, Kids profile с рейтинг limit.

---

## Клиенты

- **TV:** Android TV, Fire TV, Roku (Jellyfin app)
- **Mobile:** iOS/Android official apps
- **Web:** браузер через ваш domain
- **Desktop:** Jellyfin Media Player

---

## Live TV / IPTV (опционально)

Jellyfin поддерживает M3U tuner — legal IPTV subscriptions. Настройка Tuner → M3U URL. EPG через xmltv.

---

## Мониторинг и логи

\`\`\`bash
docker compose logs -f jellyfin
\`\`\`

- Disk space на \`/media\` и \`/cache\`
- [Netdata](/blog/netdata-monitoring-vps/) — CPU spikes при transcode
- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — HTTP 200 on /web

---

## Бэкапы

- \`./config\` — users, watch state, settings (backup daily)
- \`/media\` — [Restic](/blog/restic-backup-vps/) (heavy, но critical)

\`\`\`bash
tar czf jellyfin-config-\$(date +%F).tar.gz ./config
\`\`\`

---

## Типичные проблемы

| Проблема | Решение |
| --- | --- |
| Buffering | Uplink VPS / transcoding overload |
| No metadata | Naming convention + scan library |
| Login loop behind proxy | X-Forwarded-Proto, PublishedServerUrl |
| Subtitles burn-in slow | Disable burn, use direct stream |
| 413 upload | Nginx client_max_body_size |

---

## Юридическое

Jellyfin — инструмент. Вы отвечаете за легальность контента. Не используйте для пиратского distribution. VPS ToS некоторых провайдеров ограничивает DMCA-heavy usage.

---

## Итог

Jellyfin на VPS — свой Netflix без абонплаты Plex Pass. Docker + Nginx + SSL + правильная структура папок = семейный streaming.

VPS с хорошим uplink — [StormNet Cloud](https://stormnetcloud.com/). Большие файлы — [Nextcloud](/blog/nextcloud-oblako-vps/) для sync + Jellyfin для play.`,
	},
	{
		slug: 'opensearch-logi-vps',
		coverFile: 'cover-opensearch-vps.png',
		pubDate: '2026-07-07',
		title: 'OpenSearch на VPS: централизованные логи и полнотекстовый поиск',
		description:
			'OpenSearch на VPS: Docker cluster, ingest pipelines, Dashboards, интеграция с Nginx и приложениями. Альтернатива ELK для малого production.',
		category: 'DevOps',
		keywords: ['OpenSearch VPS', 'ELK alternative', 'log aggregation', 'OpenSearch Dashboards', 'centralized logging', 'Storm Cloud'],
		body: `**Краткий ответ:** OpenSearch — форк Elasticsearch для логов и search. На VPS 4 GB: single-node Docker, Dashboards, ingest nginx/app logs. Дополняет [Loki+Grafana](/blog/loki-grafana-logi-vps/) или заменяет ELK если нужен full-text и rich queries.

Когда [journalctl](/blog/journalctl-logi-linux-vps/) на 5 серверах уже не масштабируется — центральный OpenSearch + retention policy.

---

## OpenSearch vs Loki vs Elasticsearch

| | OpenSearch | Loki | Elasticsearch |
| --- | --- | --- | --- |
| Лицензия | Apache 2.0 | AGPL | Elastic license |
| Full-text | Отлично | Labels + LogQL | Отлично |
| RAM | 4 GB+ | 1–2 GB | 4 GB+ |
| Metrics | Dashboards | Grafana native | Kibana |

Стек: metrics в [Prometheus](/blog/grafana-prometheus-vps/), logs в OpenSearch или Loki — не обязательно «или-или».

---

## Single-node Docker (staging / small prod)

\`\`\`yaml
services:
  opensearch:
    image: opensearchproject/opensearch:2
    environment:
      - discovery.type=single-node
      - OPENSEARCH_JAVA_OPTS=-Xms2g -Xmx2g
      - DISABLE_SECURITY_PLUGIN=true  # только dev! включите security в prod
    volumes:
      - os-data:/usr/share/opensearch/data
    ports:
      - "127.0.0.1:9200:9200"

  dashboards:
    image: opensearchproject/opensearch-dashboards:2
    environment:
      - OPENSEARCH_HOSTS=["http://opensearch:9200"]
      - DISABLE_SECURITY_DASHBOARDS_PLUGIN=true
    ports:
      - "127.0.0.1:5601:5601"
    depends_on:
      - opensearch

volumes:
  os-data:
\`\`\`

Production: включите security plugin, TLS, fine-grained roles.

---

## Индекс и retention

\`\`\`bash
# Создать index pattern для nginx logs
curl -X PUT "localhost:9200/nginx-logs-000001" -H 'Content-Type: application/json' -d'
{
  "settings": { "number_of_shards": 1, "number_of_replicas": 0 }
}'
\`\`\`

Index Lifecycle Management (ISM):

- Hot: 7 days на SSD
- Delete: после 30 days (adjust под compliance)

---

## Отправка логов Nginx

Filebeat/Fluent Bit → OpenSearch:

\`\`\`yaml
# fluent-bit.conf output
[OUTPUT]
    Name  opensearch
    Match nginx.*
    Host  127.0.0.1
    Port  9200
    Index nginx-logs
\`\`\`

Парсинг — [nginx log format](/blog/nginx-logi-i-oshibki/) combined → JSON fields.

---

## Dashboards queries

\`\`\`
status:502 AND @timestamp:[now-1h TO now]
\`\`\`

Visualize:

- 5xx rate over time
- Top slow endpoints
- Geo map (если есть geoip filter)

Алерты — OpenSearch Alerting plugin → [Alertmanager-style](/blog/prometheus-alertmanager-vps/) Telegram webhook.

---

## Application logs

JSON logs из [Django](/blog/django-deploy-na-vps/), [Node](/blog/nodejs-pm2-deploy/), [Go](/blog/go-golang-deploy-vps/):

\`\`\`json
{"level":"error","msg":"payment failed","user_id":123,"@timestamp":"..."}
\`\`\`

Structured logging упрощает query \`level:error AND msg:"payment"\`.

---

## RAM tuning на VPS 4 GB

\`\`\`env
OPENSEARCH_JAVA_OPTS=-Xms2g -Xmx2g
\`\`\`

Heap = 50% RAM max. Остальное — OS cache для Lucene. Не ставьте heap 4 GB на VPS 4 GB — OOM killer убьёт node.

---

## Security (production)

1. Включите security plugin
2. Internal users + roles
3. TLS между nodes (multi-node)
4. Dashboards за [Authentik](/blog/authentik-sso-vps/) или VPN
5. Не expose 9200 в интернет

\`\`\`bash
# Prod: только localhost + Nginx auth
ss -tlnp | grep 9200
\`\`\`

---

## Multi-node (когда вырастете)

3 VPS: master + data nodes. Minimum production HA — 3×4 GB. До этого single-node + good backups достаточно.

---

## Бэкапы

Snapshot repository — [MinIO S3](/blog/minio-s3-na-vps/):

\`\`\`bash
curl -X PUT "localhost:9200/_snapshot/my_s3_repo" ...
curl -X PUT "localhost:9200/_snapshot/my_s3_repo/snap_1?wait_for_completion=true"
\`\`\`

Или stop container + tar volume (downtime).

---

## Типичные проблемы

| Симптом | Fix |
| --- | --- |
| Yellow cluster | single-node — normal без replicas |
| Disk full | ISM delete old indices |
| GC overhead | Reduce heap / add RAM |
| Slow queries | Index templates, avoid wildcard leading |
| Circuit breaker | Fielddata limit, keyword vs text |

---

## Связка с мониторингом

- Metrics: [Grafana Prometheus](/blog/grafana-prometheus-vps/)
- Logs: OpenSearch
- Traces: optional Jaeger (отдельная тема)
- Uptime: [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)

Единый on-call: алерт из Prometheus + drill-down logs в Dashboards.

---

## Итог

OpenSearch на VPS — мощный log hub для нескольких сервисов. 4 GB RAM, single-node, ISM retention, Fluent Bit ingest — production baseline для малой команды.

VPS 4 GB — [StormNet Cloud](https://stormnetcloud.com/). Лёгкая альтернатива — [Loki](/blog/loki-grafana-logi-vps/). Search на сайте — [Meilisearch](/blog/meilisearch-poisk-na-vps/).`,
	},
	{
		slug: 'immich-foto-bekap-vps',
		coverFile: 'cover-immich-vps.png',
		pubDate: '2026-07-08',
		title: 'Immich на VPS: self-hosted бэкап фото как Google Photos',
		description:
			'Immich на VPS: Docker Compose, ML face recognition, mobile backup, PostgreSQL + Redis. Приватное облако для семейных фото.',
		category: 'DevOps',
		keywords: ['Immich VPS', 'Google Photos alternative', 'self-hosted photos', 'backup фото', 'Immich Docker', 'Storm Cloud'],
		body: `**Краткий ответ:** Immich — open-source Google Photos: auto-upload с телефона, timeline, albums, face/search ML. VPS 4 GB + большой диск: official docker-compose, PostgreSQL, Redis, [SSL](/blog/ssl-letsencrypt-vps/).

Фото семьи не должны уезжать в чужое облако. Immich на [вашем VPS](/blog/choose-vps/) + backup [3-2-1](/blog/backup-vps-3-2-1/) = privacy + control.

---

## Immich vs Nextcloud Photos vs Google Photos

| | Immich | Nextcloud | Google Photos |
| --- | --- | --- | --- |
| Mobile UX | Отличный | Средний | Эталон |
| ML search | Да (local) | Plugins | Cloud AI |
| Self-hosted | Да | Да | Нет |
| RAM | 4 GB+ | 2 GB+ | N/A |

Для файлов — [Nextcloud](/blog/nextcloud-oblako-vps/). Для фото-first UX — Immich.

---

## Требования

| | Минимум | Комфорт |
| --- | --- | --- |
| RAM | 4 GB | 8 GB (ML) |
| Disk | 100 GB | 1 TB+ |
| CPU | 2 vCPU | 4 vCPU (face recognition) |
| Uplink | 10 Mbps+ | 100 Mbps для initial sync |

ML container (machine learning) — самый прожорливый. На 4 GB отключите optional models или limit workers.

---

## Установка (official compose)

\`\`\`bash
mkdir immich && cd immich
wget -O docker-compose.yml https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
wget -O .env https://github.com/immich-app/immich/releases/latest/download/example.env
# Отредактируйте UPLOAD_LOCATION, DB_PASSWORD, IMMICH_VERSION
docker compose up -d
\`\`\`

Порт \`2283\` — за [Nginx](/blog/nginx-ili-caddy/) + HTTPS \`photos.example.com\`.

---

## .env ключевые параметры

\`\`\`env
UPLOAD_LOCATION=./library
DB_DATA_LOCATION=./postgres
IMMICH_VERSION=release
DB_PASSWORD=long_random_password
\`\`\`

\`UPLOAD_LOCATION\` на отдельном volume — легче расширять диск.

---

## Reverse proxy

\`\`\`nginx
location / {
  proxy_pass http://127.0.0.1:2283;
  proxy_set_header Host \\$host;
  client_max_body_size 50000M;
  proxy_request_buffering off;
}
\`\`\`

Большие video upload — нужен \`client_max_body_size\` и timeout 3600s.

---

## Mobile backup

1. App Store / F-Droid → Immich
2. Server URL: \`https://photos.example.com\`
3. Enable background backup (WiFi only recommended)
4. Select albums / entire gallery

Первый sync 50 GB — часы/days. Планируйте uplink и disk.

---

## ML и face recognition

Immich microservices:

- \`immich-machine-learning\` — CLIP, face detection
- Первый import — длительная индексация

На слабом VPS:

\`\`\`env
# .env — reduce load
MACHINE_LEARNING_ENABLED=true
# или временно false до upgrade RAM
\`\`\`

---

## Multi-user семья

Admin создаёт users для членов семьи. Shared albums для events. External library — optional read-only folders.

SSO — [Authentik OIDC](/blog/authentik-sso-vps/) (advanced).

---

## Бэкапы (критично!)

Фото — irreplaceable data.

\`\`\`bash
# Stop для consistent backup (или use pg_dump online)
docker compose stop
tar czf immich-library-\$(date +%F).tar.gz ./library
docker compose exec database pg_dump -U postgres immich > immich-db.sql
docker compose start
\`\`\`

Offsite:

- [Restic](/blog/restic-backup-vps/) → S3/[MinIO](/blog/minio-s3-na-vps/)
- Second VPS geo-redundant
- External HDD monthly

Тест restore: поднять Immich на staging VPS из backup.

---

## Мониторинг

- Disk: \`df -h\` alert 80%
- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)
- \`docker compose ps\` — all healthy
- Logs: \`docker compose logs -f immich-server\`

---

## Hardening

- HTTPS only, HSTS
- Strong passwords, 2FA when available
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/)
- Admin UI не в open internet без VPN ([Tailscale](/blog/tailscale-vpn-vps/)) — optional paranoia mode
- Regular updates: \`docker compose pull && up -d\`

---

## Типичные проблемы

| Проблема | Fix |
| --- | --- |
| Upload stuck | proxy buffer off, body size |
| ML OOM | More RAM or disable ML |
| Duplicate photos | Immich dedup settings |
| Slow timeline | DB index, SSD disk |
| App can't connect | SSL cert, trusted URL |

Community: GitHub immich-app/discussions.

---

## Стоимость vs iCloud

iCloud 2 TB ~€10/мес. VPS 4 GB + 500 GB disk — фиксированно, unlimited users. Окупается для семьи 3+ человек.

---

## Связка с экосистемой

- Документы — [Nextcloud](/blog/nextcloud-oblako-vps/)
- Видео фильмы — [Jellyfin](/blog/jellyfin-media-server-vps/)
- Wiki — [BookStack](/blog/bookstack-wiki-vps/)
- SSO — [Authentik](/blog/authentik-sso-vps/)

---

## Итог

Immich на VPS — лучший self-hosted Google Photos в 2026. Docker official stack, mobile backup, ML search, strict backup discipline.

VPS 4 GB+ — [StormNet Cloud](https://stormnetcloud.com/). Storage strategy — [Restic](/blog/restic-backup-vps/) + [правило 3-2-1](/blog/backup-vps-3-2-1/).`,
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
pubDate: ${article.pubDate}
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
