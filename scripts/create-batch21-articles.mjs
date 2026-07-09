import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.join(__dirname, '../src/content/blog');
const assetsRoot =
	'C:/Users/User/.cursor/projects/C-Users-User-AppData-Local-Temp-36158281-65b9-4846-9b90-fda5a5b05d2d/assets';

const articles = [
	{
		slug: 'ghost-blog-vps',
		coverFile: 'cover-ghost-blog-vps.png',
		pubDate: '2026-07-01',
		title: 'Ghost CMS на VPS: self-hosted блог и newsletter без Substack',
		description:
			'Ghost на VPS: Docker, MySQL, Nginx, SSL, темы, Members, Stripe, email newsletter и бэкапы. Полный гайд по независимому блогу и монетизации контента.',
		category: 'DevOps',
		keywords: [
			'Ghost CMS VPS',
			'self-hosted blog',
			'newsletter',
			'Substack alternative',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** Ghost — Node.js CMS для блогов и email-рассылок. На VPS 2 GB+: [Docker Compose](/blog/docker-compose-vps/) + MySQL + [Nginx + SSL](/blog/ssl-letsencrypt-vps/) + ежедневный [backup](/blog/backup-vps-3-2-1/). Members и Stripe — без комиссии платформы.

Substack берёт 10% с подписок, Medium контролирует аудиторию, WordPress перегружен плагинами. Ghost на [вашем VPS](/blog/choose-vps/) — чистый редактор, встроенный newsletter, SEO из коробки и полный контроль над данными читателей.

---

## Ghost vs WordPress vs Substack vs Hugo

| Критерий | Ghost | [WordPress](/blog/wordpress-vps-2026/) | Substack | Hugo (static) |
| --- | --- | --- | --- | --- |
| Newsletter | Встроенный | Плагины | Встроенный | Нет |
| Members/paywall | Да | Плагины | Да | Нет |
| RAM на VPS | 1–2 GB | 512 MB–2 GB | N/A | 128 MB |
| Редактор | Block-based | Gutenberg/classic | Простой | Markdown files |
| Монетизация | Stripe 0% platform fee | WooCommerce | 10% fee | Своя логика |
| Self-hosted | Да | Да | Нет | Да |

Ghost — sweet spot между «просто блог» и «платформа подписок».

---

## Архитектура production stack

\`\`\`
Readers / Subscribers
        ↓ HTTPS
   Nginx reverse proxy + Let's Encrypt
        ↓
   Ghost container (Node.js, port 2368)
        ↓
   MySQL 8 (content, members, settings)
        ↓
   /var/lib/ghost/content (themes, images, files)
        ↓
   SMTP relay (Postfix / Mailgun) — newsletter delivery
\`\`\`

Опционально: [Plausible](/blog/plausible-analytics-vps/) для аналитики без Google, [Authentik](/blog/authentik-sso-vps/) если Ghost в экосистеме SSO.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Личный блог, <5k views/мес | 1 GB | 1 vCPU | 10 GB SSD |
| Активный блог + newsletter 1k subs | 2 GB | 2 vCPU | 20 GB SSD |
| Members + heavy media | 4 GB | 2 vCPU | 40 GB SSD |

Ghost на Node.js — умеренное потребление RAM. Bottleneck чаще MySQL и disk I/O при массовой рассылке.

---

## Подготовка VPS

\`\`\`bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin nginx certbot
sudo usermod -aG docker $USER
\`\`\`

DNS: \`A\` запись \`blog.example.com\` → IP VPS. Для newsletter — SPF, DKIM, DMARC на домене ([Postfix guide](/blog/postfix-dovecot-pochta-vps/)).

---

## Docker Compose (production)

\`\`\`yaml
services:
  ghost:
    image: ghost:5-alpine
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      url: https://blog.example.com
      database__client: mysql
      database__connection__host: db
      database__connection__user: ghost
      database__connection__password: CHANGE_ME_STRONG
      database__connection__database: ghost
      mail__transport: SMTP
      mail__options__host: smtp.example.com
      mail__options__port: 587
      mail__options__auth__user: ghost@example.com
      mail__options__auth__pass: SMTP_PASSWORD
    volumes:
      - ./ghost-content:/var/lib/ghost/content
    ports:
      - "127.0.0.1:2368:2368"

  db:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: CHANGE_ME_ROOT
      MYSQL_DATABASE: ghost
      MYSQL_USER: ghost
      MYSQL_PASSWORD: CHANGE_ME_STRONG
    volumes:
      - ./mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
\`\`\`

Первый запуск: \`docker compose up -d\`, затем \`https://blog.example.com/ghost\` для создания admin.

---

## Nginx reverse proxy

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name blog.example.com;

    ssl_certificate /etc/letsencrypt/live/blog.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blog.example.com/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:2368;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}
\`\`\`

SSL: [Let's Encrypt certbot](/blog/ssl-letsencrypt-vps/). Альтернатива — [Caddy](/blog/nginx-ili-caddy/) с auto-HTTPS.

---

## Первоначальная настройка Ghost

1. Откройте \`/ghost\` → создайте owner account
2. **Settings → General** — title, timezone, locale (ru или en)
3. **Settings → Design** — выберите тему (Casper default, или купите premium)
4. **Settings → Membership** — включите members, tiers, Stripe
5. **Settings → Email newsletter** — confirm SMTP, test email
6. **Settings → Integrations** — Admin API key для CI/CD публикаций

---

## Темы и кастомизация

| Источник | Цена | Примечание |
| --- | --- | --- |
| Casper (built-in) | Free | Минималистичная, быстрая |
| Ghost Marketplace | $0–89 | Официальные темы |
| Custom theme | Dev time | Handlebars templates |

Темы живут в \`content/themes/\`. После изменений: **Settings → Design → Restart**.

Code injection (head/footer) — для [Plausible](/blog/plausible-analytics-vps/) script без правки темы.

---

## Members, tiers и Stripe

Ghost Members — встроенная подписка без Substack:

1. **Settings → Membership → Stripe** — подключите Stripe account
2. Создайте **Tiers** (free / monthly / yearly)
3. **Posts** → выберите visibility: Public / Members only / Paid only
4. Portal URL: \`/signup/\` — self-service управление подпиской

Комиссия: только Stripe (~2.9%), Ghost не берёт platform fee. Данные members в вашей MySQL.

---

## Email newsletter best practices

| Практика | Зачем |
| --- | --- |
| Dedicated subdomain | \`news.example.com\` — reputation isolation |
| SPF + DKIM + DMARC | Inbox delivery, не spam |
| Double opt-in | GDPR, меньше жалоб |
| Unsubscribe one-click | Legal requirement |
| Batch size tuning | MySQL load при 10k+ subs |

Для больших рассылок — внешний ESP (Mailgun, SES) через SMTP. Ghost queue обрабатывает асинхронно.

---

## SEO и performance

- **Canonical URLs** — Ghost генерирует автоматически
- **Sitemap** — \`/sitemap.xml\`
- **Structured data** — JSON-LD для articles
- **Image optimization** — загружайте WebP, lazy load в теме
- **CDN** — Cloudflare перед Nginx (cache static, не HTML admin)

Lighthouse: Ghost с Casper обычно 90+ performance out of box.

---

## Интеграции и автоматизация

\`\`\`bash
# Публикация через Admin API (CI)
curl -X POST "https://blog.example.com/ghost/api/admin/posts/" \\
  -H "Authorization: Ghost YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"posts":[{"title":"New post","status":"published"}]}'
\`\`\`

Связки:
- **Zapier/n8n** — [n8n self-hosted](/blog/n8n-self-hosted/) для webhook → Telegram
- **GitHub Actions** — draft из markdown в repo
- **Analytics** — [Plausible](/blog/plausible-analytics-vps/)

---

## Backup и disaster recovery

| Что бэкапить | Как | Частота |
| --- | --- | --- |
| MySQL dump | \`mysqldump ghost\` | Daily |
| ghost-content volume | tar/rsync | Daily |
| Ghost config (env) | git secret repo | On change |

\`\`\`bash
#!/bin/bash
# /opt/backup-ghost.sh
docker compose exec -T db mysqldump -u ghost -p$DB_PASS ghost > /backup/ghost-db.sql
tar czf /backup/ghost-content-$(date +%F).tar.gz ./ghost-content/
\`\`\`

Стратегия [3-2-1](/blog/backup-vps-3-2-1/): local + [Restic offsite](/blog/restic-backup-vps/). Тест restore на staging VPS раз в квартал.

---

## Security hardening

| Пункт | Реализация |
| --- | --- |
| HTTPS only | Nginx redirect 80→443 |
| Admin 2FA | Ghost native TOTP в staff settings |
| Rate limiting | Nginx \`limit_req\` на /ghost/api/ |
| Firewall | [nftables](/blog/nftables-firewall-vps/) — 80, 443 only |
| Updates | \`docker compose pull && up -d\` monthly |
| Admin via VPN | [Tailscale](/blog/tailscale-vpn-vps/) restrict /ghost to mesh |

Не храните Stripe keys в git. Используйте \`.env\` с restricted permissions.

---

## Мониторинг

- **Uptime** — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) ping \`/api/health/\` (если plugin) или homepage
- **Logs** — \`docker compose logs -f ghost\`
- **MySQL** — slow query log при тормозах admin
- **Disk** — alert при 80% (images + newsletter queue)

---

## Миграция с WordPress / Medium / Substack

| Источник | Метод |
| --- | --- |
| WordPress | Ghost migration plugin (WP → JSON → Ghost) |
| Medium | Export ZIP → Ghost importer |
| Substack | Manual: posts copy + members CSV (limited) |
| Markdown repo | Custom script + Admin API |

Members email list — экспортируйте до миграции. Double opt-in может потребовать re-confirmation.

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| 502 Bad Gateway | Ghost container down, check \`docker compose ps\` |
| Images not loading | \`url\` в env не совпадает с реальным доменом |
| Email not sending | SMTP creds, port 587 TLS, check spam score |
| Slow admin | MySQL indexes, upgrade RAM, enable swap |
| Theme broken after update | \`ghost restart\`, check theme compatibility v5 |
| Stripe webhook fail | Verify endpoint URL HTTPS, check Stripe logs |
| Database connection | MySQL healthcheck, password mismatch in compose |
| Redirect loop | \`X-Forwarded-Proto\` в Nginx |

---

## Связка с экосистемой Storm

- Reverse proxy — [Nginx vs Caddy](/blog/nginx-ili-caddy/)
- CI для контента — [GitHub Actions](/blog/github-actions-cicd/)
- Файлы и media offload — [MinIO S3](/blog/minio-s3-na-vps/)
- SSO для staff — [Authentik](/blog/authentik-sso-vps/)
- Общий сервер — [Docker Compose patterns](/blog/docker-compose-vps/)

---

## Итог

Ghost на VPS — лучший self-hosted выбор для автора, который хочет блог + newsletter + paid members без посредников. Setup за вечер, стоимость — только VPS.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/). Аналитика — [Plausible](/blog/plausible-analytics-vps/).`,
	},
	{
		slug: 'discourse-forum-vps',
		coverFile: 'cover-discourse-vps.png',
		pubDate: '2026-07-02',
		title: 'Discourse на VPS: self-hosted форум вместо Reddit и phpBB',
		description:
			'Discourse на VPS: Docker, PostgreSQL, Redis, SMTP, SSL, плагины, модерация и бэкапы. Полный гайд по современному community forum для продукта или команды.',
		category: 'DevOps',
		keywords: [
			'Discourse VPS',
			'self-hosted forum',
			'community',
			'Reddit alternative',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** Discourse — Ruby on Rails форум нового поколения. На VPS 4 GB+: official Docker image + PostgreSQL + Redis + [Nginx SSL](/blog/ssl-letsencrypt-vps/) + SMTP. Минимум 2 GB RAM, рекомендуется 4 GB для активного community.

Reddit не ваш, phpBB устарел, Slack threads теряются. Discourse на [вашем VPS](/blog/choose-vps/) — категории, теги, trust levels, встроенная модерация, SEO-friendly topics и полный экспорт данных.

---

## Discourse vs phpBB vs Flarum vs NodeBB

| Критерий | Discourse | phpBB | Flarum | NodeBB |
| --- | --- | --- | --- | --- |
| UI/UX | Modern | Legacy | Minimal | Modern |
| RAM | 2–4 GB | 512 MB | 1 GB | 1 GB |
| Mobile | Excellent PWA | OK | Good | Good |
| Plugins | Rich ecosystem | Many | Growing | Many |
| SSO/SAML | Native + plugins | Plugins | OIDC | OIDC |
| Setup complexity | Medium | Low | Low | Medium |
| Email digests | Built-in | Plugins | Basic | Built-in |

Discourse — gold standard для product community и support forums.

---

## Архитектура

\`\`\`
Community members
        ↓ HTTPS
   Nginx / Caddy reverse proxy
        ↓
   Discourse container (Unicorn + Sidekiq)
        ↓
   PostgreSQL (primary data store)
        ↓
   Redis (cache, jobs, rate limits)
        ↓
   SMTP (transactional + digests)
\`\`\`

Discourse **требует** email для регистрации, уведомлений и password reset. Без SMTP форум неработоспособен.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Малый форум <100 DAU | 2 GB | 2 vCPU | 20 GB |
| Средний 100–500 DAU | 4 GB | 2 vCPU | 40 GB SSD |
| Крупный 1000+ DAU | 8 GB | 4 vCPU | 80 GB SSD |

Swap 2 GB обязателен на 2 GB RAM инстансах — Discourse при reindex spikes потребляет память.

---

## Подготовка: discourse_docker

Официальный метод — \`discourse_docker\` launcher:

\`\`\`bash
sudo apt update && sudo apt install -y git
sudo mkdir -p /var/discourse
sudo git clone https://github.com/discourse/discourse_docker.git /var/discourse
cd /var/discourse
\`\`\`

Интерактивная настройка:

\`\`\`bash
sudo ./discourse-setup
\`\`\`

Вопросы: hostname (\`forum.example.com\`), email admin, SMTP server, Let's Encrypt email.

---

## containers/app.yml (ключевые параметры)

\`\`\`yaml
templates:
  - "templates/postgres.template.yml"
  - "templates/redis.template.yml"
  - "templates/web.template.yml"
  - "templates/web.ratelimited.template.yml"

expose:
  - "80:80"
  - "443:443"

env:
  LANG: en_US.UTF-8
  UNICORN_WORKERS: 4
  DISCOURSE_HOSTNAME: forum.example.com
  DISCOURSE_DEVELOPER_EMAILS: admin@example.com
  DISCOURSE_SMTP_ADDRESS: smtp.example.com
  DISCOURSE_SMTP_PORT: 587
  DISCOURSE_SMTP_USER_NAME: discourse@example.com
  DISCOURSE_SMTP_PASSWORD: SMTP_PASS
  DISCOURSE_SMTP_ENABLE_START_TLS: true
  LETSENCRYPT_ACCOUNT_EMAIL: admin@example.com

volumes:
  - volume:
      host: /var/discourse/shared/standalone
      guest: /shared
  - volume:
      host: /var/discourse/shared/standalone/log/var-log
      guest: /var/log
\`\`\`

Rebuild после изменений: \`sudo ./launcher rebuild app\`.

---

## Nginx перед Discourse (optional)

Discourse standalone включает свой Nginx + Let's Encrypt. Если нужен единый reverse proxy:

\`\`\`nginx
upstream discourse {
    server 127.0.0.1:8080;
}

server {
    listen 443 ssl http2;
    server_name forum.example.com;

    location / {
        proxy_pass http://discourse;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
\`\`\`

Отключите встроенный SSL в \`app.yml\` если терминируете на внешнем [Nginx](/blog/nginx-ili-caddy/).

---

## Первоначальная настройка

1. Откройте \`https://forum.example.com\` → wizard setup
2. **Settings → Required** — confirm email works (test email)
3. **Settings → Login** — enable Google/GitHub OAuth или [Authentik OIDC](/blog/authentik-sso-vps/)
4. **Categories** — создайте структуру (Announcements, Support, General)
5. **Trust levels** — настройте пороги для TL1–TL4
6. **About topic** — закрепите правила community

---

## SSO через Authentik (OIDC)

В \`app.yml\` добавьте:

\`\`\`yaml
env:
  DISCOURSE_ENABLE_DISCOURSE_CONNECT: true
  DISCOURSE_DISCOURSE_CONNECT_URL: https://auth.example.com/application/o/discourse/.well-known/openid-configuration
  DISCOURSE_DISCOURSE_CONNECT_CLIENT_ID: discourse
  DISCOURSE_DISCOURSE_CONNECT_CLIENT_SECRET: SECRET
\`\`\`

Полный гайд SSO — [Authentik на VPS](/blog/authentik-sso-vps/). Discourse Connect protocol поддерживает group mapping.

---

## Плагины (рекомендуемые)

| Плагин | Назначение |
| --- | --- |
| discourse-translator | Auto-translate posts |
| discourse-chat-integration | Slack/Discord/Telegram notifications |
| discourse-solved | Mark solution in support topics |
| discourse-voting | Feature requests upvotes |
| discourse-subscriptions | Paid memberships (Stripe) |
| discourse-ai | Summaries, semantic search |

Установка: \`app.yml\` → \`hooks:\` → \`after_code:\` → git clone plugin → rebuild.

---

## Модерация и trust system

Discourse trust levels — автоматическое повышение при активности:

| Level | Права |
| --- | --- |
| TL0 | New user, ограничения на ссылки, images |
| TL1 | Basic — больше свободы |
| TL2 | Member — edit wiki posts |
| TL3 | Regular — recategorize, rename |
| TL4 | Leader — moderate flags |

**Review queue** — flagged posts, new users spam. Настройте **Akismet** или **discourse-antispam** plugins.

---

## Email: digests, notifications, deliverability

| Тип | Частота | Настройка |
| --- | --- | --- |
| Notifications | Real-time / delay | User preferences |
| Digests | Daily / weekly | Site settings |
| Mailing list mode | Per-category | Category settings |

SPF, DKIM, DMARC обязательны. Используйте dedicated subdomain \`mail.example.com\`. Гайд — [Postfix на VPS](/blog/postfix-dovecot-pochta-vps/).

---

## Performance tuning

\`\`\`yaml
# app.yml
env:
  UNICORN_WORKERS: 4          # 2 * CPU cores
  DISCOURSE_DB_POOL: 25
  DISCOURSE_SIDEKIQ_WORKERS: 5
\`\`\`

- **CDN** — Cloudflare cache static assets
- **PostgreSQL tuning** — [PostgreSQL guide](/blog/postgresql-tuning-vps/)
- **Redis memory** — monitor \`used_memory\`
- **Rebuild indexes** — Admin → reindex search (off-peak hours)

---

## Backup

\`\`\`bash
# Discourse built-in backup (Admin → Backups)
# Or manual:
sudo ./launcher enter app
discourse backup
\`\`\`

Бэкап включает PostgreSQL dump + uploads. Храните offsite — [Restic](/blog/restic-backup-vps/), стратегия [3-2-1](/blog/backup-vps-3-2-1/).

Расписание: Admin → Backups → enable automatic daily + S3 ([MinIO](/blog/minio-s3-na-vps/) compatible).

---

## Security hardening

| Пункт | Действие |
| --- | --- |
| 2FA for staff | Settings → enforce for moderators |
| Rate limits | \`web.ratelimited.template.yml\` enabled |
| Firewall | [nftables](/blog/nftables-firewall-vps/) — 80, 443 |
| Admin via VPN | [Tailscale](/blog/tailscale-vpn-vps/) restrict admin paths |
| Updates | Monthly \`launcher rebuild app\` |
| Crawler protection | Cloudflare bot fight mode |

---

## Мониторинг

- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — ping homepage + /login
- Sidekiq queue depth — Admin → Sidekiq (failed jobs alert)
- PostgreSQL connections — \`SELECT count(*) FROM pg_stat_activity;\`
- Disk — uploads grow fast with images

---

## Миграция с phpBB / Reddit / Slack

| Источник | Инструмент |
| --- | --- |
| phpBB | discourse-phpbb-importer |
| vBulletin | discourse-migratepassword + custom |
| Reddit | Manual + RSS (no official) |
| Slack | Export JSON → discourse-chat-integration |

Plan: freeze old forum → import → 301 redirects if possible → announce migration topic.

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| Email not delivered | SMTP settings, check port 587, SPF/DKIM |
| 502 during rebuild | Normal — wait 5–10 min, check logs |
| High memory | Reduce UNICORN_WORKERS, add swap, upgrade VPS |
| Search broken | Admin → reindex, check PostgreSQL disk |
| SSL renewal fail | Let's Encrypt rate limits, verify DNS |
| Sidekiq backlog | Scale workers, check failed jobs |
| OAuth login loop | Callback URL mismatch in OIDC provider |
| Slow page load | Enable CDN, check PostgreSQL slow queries |
| Backup fail | Disk full, check /shared backups folder size |
| Plugin break rebuild | Remove plugin from app.yml, rebuild, fix |

---

## Связка с экосистемой

- SSO — [Authentik](/blog/authentik-sso-vps/)
- Git для плагинов — [Gitea](/blog/gitea-git-server-vps/)
- Monitoring — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)
- Email — [Postfix](/blog/postfix-dovecot-pochta-vps/)
- Docker patterns — [Docker Compose](/blog/docker-compose-vps/)

---

## Итог

Discourse — лучший self-hosted форум для product community, support и dev discussions. Требует больше RAM чем лёгкие альтернативы, но окупается UX и модерацией.

VPS от 4 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/). SSO — [Authentik](/blog/authentik-sso-vps/).`,
	},
	{
		slug: 'rustdesk-remote-vps',
		coverFile: 'cover-rustdesk-vps.png',
		pubDate: '2026-07-03',
		title: 'RustDesk на VPS: self-hosted удалённый рабочий стол вместо TeamViewer',
		description:
			'RustDesk server (hbbs/hbbr) на VPS: Docker, ключи, клиенты Windows/Linux/macOS, Nginx, безопасность и troubleshooting. Приватная альтернатива TeamViewer и AnyDesk.',
		category: 'DevOps',
		keywords: [
			'RustDesk VPS',
			'remote desktop',
			'TeamViewer alternative',
			'self-hosted RDP',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** RustDesk — open-source remote desktop. Self-hosted relay на VPS 1 GB+: \`hbbs\` (ID/signaling) + \`hbbr\` (relay) в [Docker](/blog/docker-compose-vps/), свой ключ шифрования, клиенты указывают на ваш сервер. Без облака RustDesk и без лимитов TeamViewer.

TeamViewer дорогой и блокирует «личное использование», AnyDesk — чужие серверы. RustDesk на [вашем VPS](/blog/choose-vps/) — E2E encryption, полный контроль relay, бесплатно для команды и семьи.

---

## RustDesk vs TeamViewer vs AnyDesk vs RDP

| Критерий | RustDesk self-host | TeamViewer | AnyDesk | Raw RDP/SSH |
| --- | --- | --- | --- | --- |
| Self-hosted relay | Да | Нет | Нет | N/A |
| E2E encryption | Да | Да | Да | Varies |
| NAT traversal | Relay + hole punch | Cloud | Cloud | Port forward |
| Стоимость | VPS only | $50+/мес business | Freemium | Free |
| RAM server | 512 MB–1 GB | N/A | N/A | N/A |
| File transfer | Да | Да | Да | SCP/SFTP |
| Mobile client | Да | Да | Да | Limited |

RustDesk — optimal для IT support своей команды и личных машин.

---

## Архитектура

\`\`\`
Client A (support)          Client B (remote PC)
        ↓                            ↓
        └──────────┬─────────────────┘
                   ↓
            hbbs (21115-21116-21118)
            ID registry + hole punching
                   ↓
            hbbr (21117)
            Relay when P2P fails
                   ↓
            Optional: Web UI / API
\`\`\`

**hbbs** — rendezvous server. **hbbr** — relay для трафика когда прямое соединение невозможно (symmetric NAT, corporate firewall).

---

## Требования к VPS

| Сценарий | RAM | CPU | Bandwidth |
| --- | --- | --- | --- |
| Семья 2–5 устройств | 512 MB | 1 vCPU | 100 Mbps |
| IT support 20 устройств | 1 GB | 1 vCPU | 500 Mbps |
| Relay-heavy (no P2P) | 2 GB | 2 vCPU | 1 Gbps |

Порты на firewall ([nftables](/blog/nftables-firewall-vps/)):
- TCP 21115–21117, 21119
- UDP 21116

---

## Docker Compose

\`\`\`yaml
services:
  hbbs:
    image: rustdesk/rustdesk-server:latest
    container_name: hbbs
    command: hbbs -r rustdesk.example.com:21117
    volumes:
      - ./data:/root
    ports:
      - "21115:21115"
      - "21116:21116/udp"
      - "21118:21118"
    restart: unless-stopped
    depends_on:
      - hbbr

  hbbr:
    image: rustdesk/rustdesk-server:latest
    container_name: hbbr
    command: hbbr
    volumes:
      - ./data:/root
    ports:
      - "21117:21117"
    restart: unless-stopped
\`\`\`

После старта: ключ в \`./data/id_ed25519.pub\` — **критично для клиентов**.

---

## Получение и распространение ключа

\`\`\`bash
cat ./data/id_ed25519.pub
# Пример: xxxxx=  — одна строка base64
\`\`\`

Этот ключ вставляется в **все клиенты** — гарантирует что они подключаются только к вашему серверу, не к публичному RustDesk infra.

Распространение:
- GPO / MDM для корпоративных ПК
- [BookStack](/blog/bookstack-wiki-vps/) wiki page
- QR code для мобильных

---

## Настройка клиентов

**Windows / Linux / macOS:**
1. Settings → Network → ID/Relay server
2. ID server: \`rustdesk.example.com\`
3. Relay server: \`rustdesk.example.com\`
4. Key: вставить \`id_ed25519.pub\` content
5. Apply → перезапуск клиента

**Android / iOS:** Settings → ID/Relay server → те же значения.

Проверка: статус «Ready» с вашим custom server, не «Ready» на public.

---

## Nginx (optional web console)

RustDesk Pro имеет web admin. Open-source — API limited. Для мониторинга портов:

\`\`\`nginx
# Health check endpoint via custom script
server {
    listen 443 ssl;
    server_name rustdesk.example.com;
    location /health {
        return 200 "ok";
    }
}
\`\`\`

Основной трафик — **не HTTP**, а proprietary protocol на 21115–21117. Nginx не проксирует desktop stream.

---

## Безопасность

| Уровень | Мера |
| --- | --- |
| Обязательно | Custom key на всех клиентах |
| Рекомендуется | [Tailscale](/blog/tailscale-vpn-vps/) + RustDesk только в mesh |
| Пароли | Strong permanent password на каждом хосте |
| 2FA | RustDesk Pro feature; OSS — password only |
| Firewall | Только нужные порты, geo-block если возможно |
| Updates | \`docker compose pull\` monthly |

**Никогда** не оставляйте unattended access без strong password. Отключайте «allow unattended» на критичных серверах.

---

## Unattended access (headless servers)

Для Linux servers без GUI — установите RustDesk + задайте fixed password:

\`\`\`bash
# Linux headless
rustdesk --password "STRONG_RANDOM"
rustdesk --option allow-auto-record-input 0
\`\`\`

Для production servers предпочтительнее [SSH](/blog/vscode-ssh-vps/) + [WireGuard](/blog/wireguard-vpn-na-vps/). RustDesk — для desktop support.

---

## Интеграция с Tailscale

Best practice: RustDesk relay на VPS, клиенты **также** в [Tailscale mesh](/blog/tailscale-vpn-vps/):

\`\`\`
Tailscale IP direct → fastest path (no relay bandwidth)
Public relay VPS → fallback for devices outside mesh
\`\`\`

Split: корпоративные машины — Tailscale only; семья — public relay с key.

---

## Backup

Бэкапить только \`./data/\` volume:
- \`id_ed25519\` (private key!)
- \`id_ed25519.pub\`
- Database (if Pro)

\`\`\`bash
tar czf rustdesk-data-$(date +%F).tar.gz ./data/
\`\`\`

Потеря private key = все клиенты нужно перенастроить. Храните в [Vaultwarden](/blog/vaultwarden-paroli-vps/) или [HashiCorp Vault](/blog/vault-secrets-vps/). Offsite — [Restic](/blog/restic-backup-vps/).

---

## Мониторинг

| Метрика | Как |
| --- | --- |
| Ports open | [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) TCP check 21116 |
| Relay bandwidth | \`vnstat\`, \`iftop\` на VPS |
| Container health | \`docker compose ps\`, restart policy |
| Active sessions | hbbr logs |

Alert при bandwidth spike — возможен abuse если ключ утёк.

---

## Performance tuning

- VPS geographically central для users (EU VPS для EU team)
- UDP 21116 не блокировать на intermediate firewalls
- 1 Gbps port на VPS для screen sharing 4K
- Client: hardware encoding H264 если доступно
- Disable wallpaper/effects на remote для low bandwidth

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| «Failed to connect to rendezvous» | DNS, firewall ports 21115-21116/udp |
| Relay works, P2P not | Normal behind symmetric NAT |
| Wrong key error | Re-copy id_ed25519.pub, no extra spaces |
| Slow/laggy | Use relay closer, reduce resolution, check bandwidth |
| ID not found | hbbs down, client wrong ID server address |
| Connection drops | UDP timeout — check firewall state |
| Linux headless black screen | Install desktop env or use Xvfb |
| Mobile not connecting | Background restrictions — disable battery opt |
| Key mismatch after update | Re-distribute pub key after data volume reset |
| High VPS bandwidth bill | Force Tailscale direct, limit relay users |

---

## Use cases

| Сценарий | Setup |
| --- | --- |
| Family tech support | 1 VPS, shared key, passwords per PC |
| Small IT team | VPS + [Authentik](/blog/authentik-sso-vps/) docs + inventory |
| Dev remote workstation | Unattended + strong password + Tailscale |
| Server GUI (legacy app) | RustDesk on X11 server — last resort |

---

## Связка с экосистемой

- VPN mesh — [Tailscale](/blog/tailscale-vpn-vps/), [WireGuard](/blog/wireguard-vpn-na-vps/)
- Secrets — [Vaultwarden](/blog/vaultwarden-paroli-vps/)
- Monitoring — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)
- Firewall — [nftables](/blog/nftables-firewall-vps/)
- Docker — [Docker Compose](/blog/docker-compose-vps/)

---

## Итог

RustDesk self-hosted — must-have для приватного remote desktop без абонентской платы TeamViewer. Минимальные ресурсы VPS, максимальный контроль.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). VPN fallback — [Tailscale](/blog/tailscale-vpn-vps/). Backup ключей — [3-2-1](/blog/backup-vps-3-2-1/).`,
	},
	{
		slug: 'searxng-poisk-vps',
		coverFile: 'cover-searxng-vps.png',
		pubDate: '2026-07-04',
		title: 'SearXNG на VPS: приватная метапоисковая система для команды',
		description:
			'SearXNG на VPS: Docker, Nginx, SSL, engines, rate limit, Tor и интеграция в браузер. Self-hosted поиск без трекинга Google и без рекламы.',
		category: 'DevOps',
		keywords: [
			'SearXNG VPS',
			'private search',
			'metasearch',
			'Google alternative',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** SearXNG — open-source метапоисковик, агрегирующий Google, Bing, DuckDuckGo и др. без трекинга. На VPS 512 MB–1 GB: Docker + [Nginx + SSL](/blog/ssl-letsencrypt-vps/) + \`settings.yml\` hardening. Доступ через [Tailscale](/blog/tailscale-vpn-vps/) или public с rate limit.

Google профилирует запросы, DuckDuckGo — чужой сервер. SearXNG на [вашем VPS](/blog/choose-vps/) — ваши запросы, ваши логи (или их отсутствие), выбор engines и zero ads.

---

## SearXNG vs DuckDuckGo vs Google vs Whoogle

| Критерий | SearXNG | DuckDuckGo | Google | Whoogle |
| --- | --- | --- | --- | --- |
| Self-hosted | Да | Нет | Нет | Да |
| Metasearch | Да (many engines) | Свой index | Свой index | Google scrape |
| Tracking | Нет (ваш контроль) | Minimal | Extensive | Minimal |
| RAM | 512 MB | N/A | N/A | 256 MB |
| CAPTCHA issues | Sometimes | Rare | N/A | Often |
| Image/video search | Да | Да | Да | Limited |

SearXNG — лучший баланс приватности и качества результатов.

---

## Архитектура

\`\`\`
Browser / Browser extension
        ↓ HTTPS
   Nginx reverse proxy + rate limit
        ↓
   SearXNG container (Python/uWSGI)
        ↓
   Outbound queries → Google, Bing, DDG, Wikipedia...
        ↓
   Optional: Tor proxy for sensitive queries
\`\`\`

SearXNG **не хранит** user profiles. Логи — только на вашей совести (отключите в production).

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Личный use | 512 MB | 1 vCPU | 2 GB |
| Семья/команда 10 users | 1 GB | 1 vCPU | 5 GB |
| Public instance | 2 GB | 2 vCPU | 10 GB |

Outbound IP VPS важен — некоторые engines банят datacenter IP. Residential proxy — advanced workaround.

---

## Docker Compose

\`\`\`yaml
services:
  searxng:
    image: searxng/searxng:latest
    restart: unless-stopped
    volumes:
      - ./searxng:/etc/searxng
    environment:
      SEARXNG_BASE_URL: https://search.example.com/
      SEARXNG_SECRET: CHANGE_ME_LONG_RANDOM
    ports:
      - "127.0.0.1:8080:8080"
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
\`\`\`

Первый запуск создаст default \`settings.yml\` — сразу harden.

---

## settings.yml (ключевые настройки)

\`\`\`yaml
use_default_settings: true

general:
  instance_name: "My Private Search"
  privacypolicy_url: false
  donation_url: false
  contact_url: false
  enable_stats: false

search:
  safe_search: 1
  autocomplete: "duckduckgo"
  default_lang: "ru-RU"
  formats:
    - html
    - json

server:
  secret_key: "CHANGE_ME"
  limiter: true
  image_proxy: true
  public_instance: false

engines:
  - name: google
    disabled: false
  - name: duckduckgo
    disabled: false
  - name: wikipedia
    disabled: false
\`\`\`

\`public_instance: false\` — отключает публичные API. \`limiter: true\` — anti-abuse.

---

## Nginx + rate limiting

\`\`\`nginx
limit_req_zone $binary_remote_addr zone=search:10m rate=10r/s;

server {
    listen 443 ssl http2;
    server_name search.example.com;

    limit_req zone=search burst=20 nodelay;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Script-Name /;
    }
}
\`\`\`

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Для internal only — [Tailscale](/blog/tailscale-vpn-vps/) без public DNS.

---

## Доступ: public vs private

| Модель | Когда | Как |
| --- | --- | --- |
| Tailscale only | Максимальная приватность | Bind 127.0.0.1, access via mesh IP |
| Authentik forward auth | Team shared | [Authentik](/blog/authentik-sso-vps/) + Nginx auth_request |
| Public + rate limit | Family bookmark | HTTPS + strong rate limits |
| VPN wireguard | Remote team | [WireGuard](/blog/wireguard-vpn-na-vps/) |

**Не открывайте** public SearXNG без limiter — abuse для scraping и DDoS amplification.

---

## Браузерная интеграция

**Firefox:**
1. Settings → Search → Add → \`https://search.example.com/search?q=%s\`
2. Set as default

**Chromium / Chrome:** Manage search engines → Add custom.

**Mobile:** SearXNG PWA bookmark или Firefox Sync search settings.

**Browser extension:** Official SearXNG redirect extensions sync settings.

---

## Engines tuning

| Engine | Плюсы | Минусы |
| --- | --- | --- |
| Google | Best results | CAPTCHA on DC IP |
| Bing | Stable | Microsoft tracking at source |
| DuckDuckGo | Privacy | Rate limits |
| Brave | Independent | Newer |
| Wikipedia | Facts | Encyclopedia only |
| GitHub | Code search | Niche |

Отключите engines которые не нужны — faster response. \`engines:\` в settings.yml per-engine \`timeout\` и \`disabled\`.

---

## Image proxy

\`server.image_proxy: true\` — картинки через ваш сервер, скрывает referrer от источника. Дополнительная RAM/bandwidth на VPS. Для privacy worth it.

---

## Tor integration (advanced)

\`\`\`yaml
# settings.yml outgoing proxies
outgoing:
  request_timeout: 10.0
  max_request_timeout: 15.0
  pools:
    - url: socks5h://tor:9050
\`\`\`

Tor container в compose — для sensitive queries. Медленнее, но скрывает VPS IP от engines.

---

## uBlock / CAPTCHA проблемы

Google часто показывает CAPTCHA datacenter IP:

| Решение | Эффект |
| --- | --- |
| Disable Google engine | Use Bing/DDG only |
| Reduce Google weight | Less CAPTCHA frequency |
| Residential proxy | Expensive, grey area |
| Rotating engines | SearXNG fallback automatic |

---

## Backup

Бэкапить \`./searxng/\` folder (settings.yml, custom templates). No database.

\`\`\`bash
tar czf searxng-config-$(date +%F).tar.gz ./searxng/
\`\`\`

[3-2-1 backup](/blog/backup-vps-3-2-1/) — config в git (без secrets) + secret в [Vaultwarden](/blog/vaultwarden-paroli-vps/).

---

## Security checklist

| Пункт | Статус |
| --- | --- |
| SECRET_KEY random | Required |
| limiter enabled | Required for public |
| public_instance false | Unless intentional |
| HTTPS only | Required |
| No query logging | Disable in nginx access log or anonymize |
| [nftables](/blog/nftables-firewall-vps/) | 443 only if public |
| Updates | Monthly docker pull |

---

## Мониторинг

- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — search test query
- Response time — slow engines degrade UX
- Error rate in container logs — \`docker compose logs searxng\`

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| No results | All engines timeout — check outbound firewall |
| CAPTCHA loop | Disable Google, use Bing/DDG |
| 429 Too Many Requests | Your rate limit too strict, tune nginx |
| CSRF error | SECRET_KEY changed — clear browser cookies |
| Wrong language | default_lang in settings.yml |
| Image search broken | Enable image_proxy, check engine support |
| Slow searches | Reduce active engines count |
| 502 Bad Gateway | Container OOM — upgrade RAM |
| JSON API 403 | public_instance false — expected |
| Styles broken | SEARXNG_BASE_URL mismatch with real URL |

---

## Связка с экосистемой

- DNS для домена — [AdGuard](/blog/adguard-dns-vps/) custom DNS record
- Privacy stack — [Tailscale](/blog/tailscale-vpn-vps/) + SearXNG + [AdGuard](/blog/adguard-dns-vps/)
- Reverse proxy — [Nginx vs Caddy](/blog/nginx-ili-caddy/)
- Docker — [Docker Compose](/blog/docker-compose-vps/)
- SSO — [Authentik](/blog/authentik-sso-vps/)

---

## Итог

SearXNG — один из самых лёгких и полезных self-hosted сервисов. 512 MB RAM, десятки поисковиков, zero tracking. Идеальный companion к [AdGuard Home](/blog/adguard-dns-vps/).

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Приватный доступ — [Tailscale](/blog/tailscale-vpn-vps/).`,
	},
	{
		slug: 'paperless-ngx-vps',
		coverFile: 'cover-paperless-vps.png',
		pubDate: '2026-07-05',
		title: 'Paperless-ngx на VPS: OCR-архив документов, счетов и договоров',
		description:
			'Paperless-ngx на VPS: Docker, PostgreSQL, Redis, Tika, Gotenberg, OCR, теги, full-text search и бэкапы. Self-hosted DMS для семьи и малого бизнеса.',
		category: 'DevOps',
		keywords: [
			'Paperless-ngx VPS',
			'OCR documents',
			'DMS self-hosted',
			'document archive',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** Paperless-ngx — система управления документами с OCR, full-text search и auto-tagging. На VPS 2 GB+: Docker stack (PostgreSQL + Redis + Tika + Gotenberg) + [Nginx SSL](/blog/ssl-letsencrypt-vps/) + [backup](/blog/backup-vps-3-2-1/) media volume.

Счета в email, договоры в Downloads, сканы на полке — хаос. Paperless-ngx на [вашем VPS](/blog/choose-vps/) — загрузил PDF/photo → OCR → поиск по тексту → теги, correspondents, ASN. Альтернатива Evernote и Google Drive для документов.

---

## Paperless-ngx vs Nextcloud Files vs Teedy vs Mayan EDMS

| Критерий | Paperless-ngx | [Nextcloud](/blog/nextcloud-oblako-vps/) | Teedy | Mayan EDMS |
| --- | --- | --- | --- | --- |
| OCR focus | Excellent | Plugin | Basic | Good |
| Auto consume | Email, folder, API | Manual mostly | Folder | Watch folders |
| RAM | 2 GB | 2–4 GB | 512 MB | 4 GB+ |
| UI simplicity | Clean | Full cloud suite | Minimal | Complex |
| Mobile app | Community | Official | Limited | Web |
| Full-text search | PostgreSQL FTS | Elasticsearch optional | Basic | Good |

Paperless-ngx — best for «scan everything and find by content».

---

## Архитектура

\`\`\`
Scanner / Email / Mobile upload
        ↓ HTTPS
   Nginx reverse proxy
        ↓
   Paperless-ngx (Django)
        ↓
   PostgreSQL (metadata + FTS index)
        ↓
   Redis (Celery task queue)
        ↓
   Apache Tika (document parsing)
        ↓
   Gotenberg (office → PDF conversion)
        ↓
   /usr/src/paperless/media (originals + thumbnails)
\`\`\`

OCR: Tesseract внутри paperless container. Языки: \`PAPERLESS_OCR_LANGUAGE=rus+eng\`.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Семья, 5k documents | 2 GB | 2 vCPU | 30 GB |
| Малый бизнес 20k docs | 4 GB | 2 vCPU | 100 GB |
| Heavy OCR batch import | 4–8 GB | 4 vCPU | 200 GB SSD |

OCR CPU-intensive — batch import ночью. SSD critical для PostgreSQL FTS.

---

## Docker Compose (full stack)

\`\`\`yaml
services:
  broker:
    image: docker.io/library/redis:7
    restart: unless-stopped
    volumes:
      - redisdata:/data

  db:
    image: docker.io/library/postgres:16
    restart: unless-stopped
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: paperless
      POSTGRES_USER: paperless
      POSTGRES_PASSWORD: CHANGE_ME

  webserver:
    image: ghcr.io/paperless-ngx/paperless-ngx:latest
    restart: unless-stopped
    depends_on:
      - db
      - broker
      - gotenberg
      - tika
    ports:
      - "127.0.0.1:8000:8000"
    volumes:
      - data:/usr/src/paperless/data
      - media:/usr/src/paperless/media
      - ./export:/usr/src/paperless/export
      - ./consume:/usr/src/paperless/consume
    environment:
      PAPERLESS_REDIS: redis://broker:6379
      PAPERLESS_DBHOST: db
      PAPERLESS_DBUSER: paperless
      PAPERLESS_DBPASS: CHANGE_ME
      PAPERLESS_SECRET_KEY: CHANGE_ME_LONG
      PAPERLESS_URL: https://docs.example.com
      PAPERLESS_OCR_LANGUAGE: rus+eng
      PAPERLESS_TIME_ZONE: Europe/Moscow
      PAPERLESS_ADMIN_USER: admin
      PAPERLESS_ADMIN_PASSWORD: CHANGE_ME
      PAPERLESS_TIKA_ENABLED: 1
      PAPERLESS_TIKA_GOTENBERG_ENDPOINT: http://gotenberg:3000
      PAPERLESS_TIKA_ENDPOINT: http://tika:9998

  gotenberg:
    image: docker.io/gotenberg/gotenberg:8
    restart: unless-stopped
    command:
      - "gotenberg"
      - "--chromium-disable-javascript=true"

  tika:
    image: docker.io/apache/tika:latest
    restart: unless-stopped

volumes:
  data:
  media:
  pgdata:
  redisdata:
\`\`\`

---

## Nginx reverse proxy

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name docs.example.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
\`\`\`

SSL — [certbot](/blog/ssl-letsencrypt-vps/). Большие PDF — увеличьте \`client_max_body_size\`.

---

## Consumption: как загружать документы

| Метод | Настройка |
| --- | --- |
| Web UI | Drag & drop |
| Consume folder | Copy to \`./consume/\` — auto-watch |
| Email | IMAP fetch в PAPERLESS_EMAIL_* env |
| Mobile | Paperless-ngx mobile apps (third-party) |
| API | REST для [n8n](/blog/n8n-self-hosted/) automation |

**Email workflow:** счета на \`invoices@example.com\` → IMAP → auto-tag «invoice» + correspondent.

---

## Организация: tags, correspondents, document types

| Сущность | Пример |
| --- | --- |
| Tags | \`tax\`, \`2025\`, \`medical\`, \`contract\` |
| Correspondents | «Ростелеком», «Банк», «Клиент X» |
| Document types | Invoice, Contract, Receipt, ID |
| Storage path | \`{created_year}/{correspondent}/\` |
| ASN | Auto-increment ID на коробке архива |

**Matching rules** — auto-assign tags/correspondents по OCR content regex.

---

## OCR и языки

\`\`\`yaml
PAPERLESS_OCR_LANGUAGE: rus+eng
PAPERLESS_OCR_MODE: skip_noarchive  # skip already searchable PDFs
PAPERLESS_OCR_CLEAN: clean
PAPERLESS_OCR_DESKEW: true
\`\`\`

Установка tesseract langs в container — обычно pre-installed rus+eng. Для украинского: \`ukr\` в language string.

---

## Full-text search

PostgreSQL FTS — мгновенный поиск по OCR text. Tips:
- Используйте \`+word\` для required terms
- \`correspondent:\"Bank Name\"\` — field search
- Saved views — filter combinations as virtual folders

Reindex: \`docker compose exec webserver document_index reindex\` при проблемах.

---

## Multi-user и права

Paperless supports multiple users с object-level permissions. Для SSO — proxy auth header или OAuth2 proxy перед [Authentik](/blog/authentik-sso-vps/).

Family setup: один admin + read-only users для просмотра.

---

## Backup (критично!)

| Компонент | Метод |
| --- | --- |
| PostgreSQL | \`pg_dump\` daily |
| media volume | tar/rsync — originals + thumbnails |
| data volume | config, index snippets |

\`\`\`bash
# Built-in exporter
docker compose exec webserver document_exporter ../export --zip
\`\`\`

Стратегия [3-2-1](/blog/backup-vps-3-2-1/): local + [Restic](/blog/restic-backup-vps/) offsite. Media volume растёт — monitor disk.

---

## Security

| Пункт | Действие |
| --- | --- |
| HTTPS | Обязательно — документы sensitive |
| Strong admin password | 20+ chars |
| [Tailscale](/blog/tailscale-vpn-vps/) | Private access preferred |
| Firewall | [nftables](/blog/nftables-firewall-vps/) |
| 2FA | Via Authentik forward auth |
| Export encryption | ZIP password for offsite backup |

Документы = налоги, медицина, договоры. Treat as highly confidential.

---

## Performance tuning

- \`PAPERLESS_TASK_WORKERS: 2\` — parallel OCR (more CPU)
- Batch import overnight — \`docker compose exec\` throttle
- PostgreSQL [tuning](/blog/postgresql-tuning-vps/) — \`shared_buffers\` 25% RAM
- SSD only — HDD unusable for FTS at scale

---

## Мониторинг

- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — web UI ping
- Celery queue — Admin → Tasks, failed OCR jobs
- Disk alerts — media growth
- [Netdata](/blog/netdata-monitoring-vps/) — CPU spikes during OCR

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| OCR пустой | Wrong language pack, low quality scan |
| Consume not picking files | File permissions, watch folder path |
| Email fetch fail | IMAP creds, app password, TLS |
| 502 timeout on upload | Increase nginx timeout, client_max_body_size |
| Duplicate documents | Matching rules too broad |
| Slow search | Reindex, PostgreSQL vacuum |
| Gotenberg fail | Office formats — check gotenberg logs |
| Tika OOM | Upgrade RAM, reduce concurrent tasks |
| Thumbnail missing | Re-process document in UI |
| Permission denied | User roles, object permissions |

---

## Связка с экосистемой

- Облако файлов — [Nextcloud](/blog/nextcloud-oblako-vps/) (complementary)
- Email — [Postfix](/blog/postfix-dovecot-pochta-vps/)
- Automation — [n8n](/blog/n8n-self-hosted/)
- Backup — [Restic](/blog/restic-backup-vps/)
- SSO — [Authentik](/blog/authentik-sso-vps/)

---

## Итог

Paperless-ngx — killer app для paperless office. OCR + search превращает хаос сканов в searchable archive. 2 GB VPS достаточно для семьи.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Backup — [3-2-1](/blog/backup-vps-3-2-1/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/).`,
	},
	{
		slug: 'pocketbase-vps',
		coverFile: 'cover-pocketbase-vps.png',
		pubDate: '2026-07-06',
		title: 'PocketBase на VPS: лёгкий BaaS с SQLite, auth и realtime',
		description:
			'PocketBase на VPS: Docker, Nginx, SSL, collections, auth, files, hooks и backup SQLite. Self-hosted Backend-as-a-Service для MVP и side projects.',
		category: 'DevOps',
		keywords: [
			'PocketBase VPS',
			'BaaS self-hosted',
			'SQLite backend',
			'Firebase alternative',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** PocketBase — single-binary BaaS: SQLite, REST/Realtime API, auth, file storage, admin UI. На VPS 512 MB–1 GB: один Docker container + [Nginx SSL](/blog/ssl-letsencrypt-vps/) + backup \`pb_data\`. Идеален для MVP, mobile backends, internal tools.

Firebase — vendor lock-in, Supabase тяжелее, custom Express + PostgreSQL — months of work. PocketBase на [вашем VPS](/blog/choose-vps/) — auth + CRUD + files за час, SQLite backup в один файл.

---

## PocketBase vs Supabase vs Firebase vs Appwrite

| Критерий | PocketBase | Supabase | Firebase | Appwrite |
| --- | --- | --- | --- | --- |
| Database | SQLite | PostgreSQL | Firestore | Multiple |
| RAM | 256 MB+ | 2 GB+ | N/A | 1 GB+ |
| Self-host ease | ★★★★★ | ★★★ | No | ★★★★ |
| Realtime | Да | Да | Да | Да |
| Admin UI | Built-in | Dashboard | Console | Console |
| Pricing | VPS only | VPS/hosted | Pay per use | VPS |

PocketBase — «SQLite для backend» — невероятно лёгкий.

---

## Архитектура

\`\`\`
Mobile / Web / SPA frontend
        ↓ HTTPS
   Nginx reverse proxy
        ↓
   PocketBase (Go, single process)
        ↓
   pb_data/
     ├── data.db (SQLite)
     ├── storage/ (uploaded files)
     └── backups/
\`\`\`

Нет Redis, нет PostgreSQL — один процесс, один volume. Backup = copy folder.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| MVP / hobby | 512 MB | 1 vCPU | 5 GB |
| Production <10k users | 1 GB | 1 vCPU | 20 GB |
| Heavy files | 2 GB | 2 vCPU | 50 GB SSD |

SQLite limits: concurrent writes serialized — OK для MVP, не для high-write social network.

---

## Docker Compose

\`\`\`yaml
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8090:8090"
    volumes:
      - ./pb_data:/pb_data
    environment:
      PB_ENCRYPTION_KEY: CHANGE_ME_32_CHARS_MIN
    command:
      - --http=0.0.0.0:8090
      - --dir=/pb_data
\`\`\`

Первый запуск: \`https://api.example.com/_/\` — create superuser admin.

---

## Nginx reverse proxy

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Realtime WebSocket
    location /api/realtime {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
\`\`\`

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). CORS настраивается в PocketBase Admin → Settings.

---

## Collections и API design

Admin UI → Collections:

| Collection | Fields | Rules |
| --- | --- | --- |
| users | built-in auth | Системная |
| posts | title, content, author (relation) | List: public, Create: auth |
| comments | post (relation), text, user | Create: auth |
| uploads | file field | Auth only |

**API rules** — PocketBase superpower. Example list rule: \`@request.auth.id != ""\` — auth required.

\`\`\`javascript
// Frontend SDK
import PocketBase from 'pocketbase';
const pb = new PocketBase('https://api.example.com');
await pb.collection('posts').getList(1, 20);
\`\`\`

---

## Auth: email, OAuth, MFA

| Метод | Setup |
| --- | --- |
| Email/password | Default, enable in settings |
| OAuth2 Google/GitHub | Admin → Auth providers |
| OTP / MFA | Built-in for users |
| Admin API | Separate superuser |

SMTP для verification emails — [Postfix](/blog/postfix-dovecot-pochta-vps/) или Mailgun relay.

Для enterprise SSO — OAuth2 proxy через [Authentik](/blog/authentik-sso-vps/).

---

## File storage

Files в \`pb_data/storage/\`. Для S3 offload — custom hook или periodic sync to [MinIO](/blog/minio-s3-na-vps/).

\`\`\`javascript
// pb_hooks onRecordCreate — example resize
onRecordAfterCreateRequest((e) => {
  // custom logic
}, "posts")
\`\`\`

Hooks — JavaScript в \`pb_hooks/\` folder, hot reload.

---

## Realtime subscriptions

\`\`\`javascript
pb.collection('posts').subscribe('*', (e) => {
  console.log(e.action, e.record);
});
\`\`\`

WebSocket через \`/api/realtime\` — Nginx upgrade header обязателен (см. выше).

---

## Migrations и версионирование

\`\`\`bash
# Export collections schema
./pocketbase migrate collections export.json
# Git track schema, not data.db
\`\`\`

CI: [GitHub Actions](/blog/github-actions-cicd/) deploy schema → VPS reload. Data migrations — PocketBase migrate command.

---

## Backup

\`\`\`bash
# PocketBase built-in
./pocketbase backup create

# Or simple copy (stop container first for consistency)
docker compose stop pocketbase
tar czf pb_data-$(date +%F).tar.gz ./pb_data/
docker compose start pocketbase
\`\`\`

SQLite — один файл \`data.db\`. Стратегия [3-2-1](/blog/backup-vps-3-2-1/) + [Restic](/blog/restic-backup-vps/). **PB_ENCRYPTION_KEY** — backup separately в [Vaultwarden](/blog/vaultwarden-paroli-vps/)!

---

## Security hardening

| Пункт | Действие |
| --- | --- |
| PB_ENCRYPTION_KEY | 32+ random chars, never change after data |
| API rules | Deny by default, allow explicitly |
| Rate limiting | Nginx \`limit_req\` |
| Admin UI | [Tailscale](/blog/tailscale-vpn-vps/) only or IP whitelist |
| HTTPS | Mandatory |
| Updates | Track PocketBase releases, breaking changes in changelog |

---

## Scaling limits

SQLite write concurrency ~1. When to migrate away:
- \>100 writes/sec sustained
- Multi-server horizontal scale needed
- Complex analytics queries

Migration path: export data → PostgreSQL backend (custom) or Supabase. PocketBase author acknowledges SQLite limits.

---

## Frontend deployment

SPA (Svelte/React/Vue) на [отдельном subdomain](/blog/nextjs-deploy-na-vps/) или Cloudflare Pages. PocketBase = API only.

\`\`\`
app.example.com  → static frontend
api.example.com  → PocketBase
\`\`\`

CORS: allow \`app.example.com\` in PocketBase settings.

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| CORS error | Add origin in Admin settings |
| WebSocket fail | Nginx upgrade headers |
| 401 on API | Check auth token, collection rules |
| Upload 413 | Nginx client_max_body_size |
| DB locked | SQLite write contention — retry logic |
| Admin 404 | URL is /_/ not /admin |
| OAuth redirect | Match redirect URL exactly |
| Hooks not loading | Check pb_hooks path, syntax errors in logs |
| Slow list queries | Add indexes in collection fields |
| Encryption error | PB_ENCRYPTION_KEY changed — data lost |

---

## Связка с экосистемой

- CI/CD — [GitHub Actions](/blog/github-actions-cicd/), [Woodpecker](/blog/woodpecker-ci-vps/)
- Git — [Gitea](/blog/gitea-git-server-vps/)
- S3 files — [MinIO](/blog/minio-s3-na-vps/)
- Monitoring — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)
- Docker — [Docker Compose](/blog/docker-compose-vps/)

---

## Итог

PocketBase — fastest path to self-hosted backend. Один container, один volume, full admin UI. Perfect для indie hackers и internal tools.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/).`,
	},
	{
		slug: 'ntfy-push-vps',
		coverFile: 'cover-ntfy-vps.png',
		pubDate: '2026-07-07',
		title: 'ntfy на VPS: self-hosted push-уведомления для серверов и автоматизаций',
		description:
			'ntfy на VPS: Docker, Nginx, SSL, topics, auth, Android/iOS клиенты, curl-интеграции и мониторинг. Альтернатива Pushover и Telegram-ботам для алертов.',
		category: 'DevOps',
		keywords: [
			'ntfy VPS',
			'push notifications',
			'self-hosted alerts',
			'Pushover alternative',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** ntfy — HTTP-based push notification server. На VPS 256 MB+: один Docker container + [Nginx SSL](/blog/ssl-letsencrypt-vps/). Publish: \`curl -d "message" https://ntfy.example.com/topic\`. Subscribe: mobile app или WebSocket.

Prometheus alerts в email теряются, Telegram боты — лишний chat, Pushover — $5+ per platform. ntfy на [вашем VPS](/blog/choose-vps/) — мгновенные push на телефон, unlimited topics, self-hosted, open-source.

---

## ntfy vs Pushover vs Gotify vs Telegram bot

| Критерий | ntfy | Pushover | Gotify | Telegram |
| --- | --- | --- | --- | --- |
| Self-hosted | Да | Нет | Да | Нет |
| RAM | 128 MB | N/A | 128 MB | N/A |
| Mobile push | Official apps | Official | Via plugins | Official |
| Publish API | HTTP POST | HTTP API | HTTP API | Bot API |
| Attachments | Да | Limited | Images | Да |
| iOS reliability | APNs via ntfy | Excellent | Poor iOS | Good |
| Cost | VPS only | $5+ per app | VPS only | Free |

ntfy — best self-hosted для server alerts и [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) notifications.

---

## Архитектура

\`\`\`
Cron / CI / Monitoring / Scripts
        ↓ HTTP POST
   Nginx (443) → ntfy server (8080)
        ↓
   SQLite (users, tokens) + cache
        ↓
   Firebase/APNs (mobile push relay)
        ↓
   Android / iOS / Web / RSS subscribers
\`\`\`

Topics — pub/sub channels. \`server-alerts\`, \`backup-status\`, \`deploy-prod\` — separate channels.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Personal alerts | 256 MB | 1 vCPU | 1 GB |
| Team 20 users | 512 MB | 1 vCPU | 5 GB |
| High volume (1000 msg/day) | 1 GB | 1 vCPU | 10 GB |

ntfy — один из самых лёгких сервисов на VPS.

---

## Docker Compose

\`\`\`yaml
services:
  ntfy:
    image: binwiederhier/ntfy:latest
    restart: unless-stopped
    command: serve
    environment:
      NTFY_BASE_URL: https://ntfy.example.com
      NTFY_CACHE_FILE: /var/cache/ntfy/cache.db
      NTFY_AUTH_FILE: /var/cache/ntfy/auth.db
      NTFY_AUTH_DEFAULT_ACCESS: deny-all
      NTFY_BEHIND_PROXY: true
      NTFY_ATTACHMENT_CACHE_DIR: /var/cache/ntfy/attachments
      NTFY_ENABLE_LOGIN: true
    volumes:
      - ./cache:/var/cache/ntfy
    ports:
      - "127.0.0.1:8080:80"
\`\`\`

\`NTFY_AUTH_DEFAULT_ACCESS: deny-all\` — все topics требуют auth по умолчанию (secure).

---

## Nginx reverse proxy

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name ntfy.example.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 90s;
    }
}
\`\`\`

\`proxy_buffering off\` — critical для streaming/subscribe long-poll.

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/).

---

## Users, tokens и ACL

\`\`\`bash
# Create admin user
docker compose exec ntfy ntfy user add admin
docker compose exec ntfy ntfy user passwd admin

# Create access token for scripts
docker compose exec ntfy ntfy token add admin scripts-token

# ACL: allow admin publish to server-alerts
docker compose exec ntfy ntfy access admin server-alerts write
docker compose exec ntfy ntfy access admin server-alerts read
\`\`\`

Tokens в [Vaultwarden](/blog/vaultwarden-paroli-vps/) — не в git repos.

---

## Publishing messages

\`\`\`bash
# Simple
curl -d "Backup completed OK" https://ntfy.example.com/server-alerts

# With title, priority, tags
curl -H "Title: Disk Alert" \\
     -H "Priority: urgent" \\
     -H "Tags: warning,red_circle" \\
     -d "Disk 90% full on prod-db" \\
     https://ntfy.example.com/server-alerts

# Auth token
curl -H "Authorization: Bearer TOKEN" \\
     -d "Deploy finished" \\
     https://ntfy.example.com/deploy-prod
\`\`\`

Priority: \`min\`, \`low\`, \`default\`, \`high\`, \`urgent\` — urgent bypasses DND on Android.

---

## Mobile apps

1. Install ntfy app (Android/iOS)
2. Add server: \`https://ntfy.example.com\`
3. Login with user credentials
4. Subscribe to topics: \`server-alerts\`, etc.

iOS: push через APNs — ntfy server handles relay. Keep server updated for iOS compatibility.

---

## Интеграции

| Система | Интеграция |
| --- | --- |
| [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) | Notification → ntfy webhook URL |
| [Prometheus](/blog/prometheus-alertmanager-vps/) | Alertmanager webhook |
| [GitHub Actions](/blog/github-actions-cicd/) | curl step on deploy |
| [Jenkins](/blog/jenkins-ci-cd-vps/) | Post-build script |
| [n8n](/blog/n8n-self-hosted/) | HTTP Request node |
| Backup scripts | curl on success/fail |

\`\`\`yaml
# docker-compose healthcheck notify example
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost"]
  interval: 30s
\`\`\`

---

## Attachments и actions

\`\`\`bash
# Send image
curl -H "Attach: https://example.com/graph.png" \\
     -d "CPU spike detected" \\
     https://ntfy.example.com/metrics

# Action buttons (open URL)
curl -H "Actions: view, Open Dashboard, https://grafana.example.com" \\
     -d "Check metrics" \\
     https://ntfy.example.com/alerts
\`\`\`

---

## Self-hosted vs ntfy.sh

| | Self-hosted | ntfy.sh public |
| --- | --- | --- |
| Privacy | Full | Third-party |
| Rate limits | Your rules | Shared |
| Custom domain | Да | Нет |
| Auth control | Full | Limited |
| Message retention | Your disk | Their policy |

Always self-host для production alerts.

---

## Backup

\`\`\`bash
tar czf ntfy-cache-$(date +%F).tar.gz ./cache/
# Contains: auth.db, cache.db, attachments
\`\`\`

[3-2-1](/blog/backup-vps-3-2-1/) — small volume, easy offsite. Users/tokens restore critical.

---

## Security

| Пункт | Действие |
| --- | --- |
| Auth enabled | NTFY_ENABLE_LOGIN=true |
| deny-all default | No public write topics |
| Per-topic ACL | Principle of least privilege |
| HTTPS | Mandatory |
| Token rotation | Periodic regen |
| [Tailscale](/blog/tailscale-vpn-vps/) | Optional: server only in mesh |

Не используйте guessable topic names (\`alerts\`, \`test\`) без auth — enumeration risk.

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| No mobile push | Check APNs/Firebase, update ntfy, app logs |
| 401 Unauthorized | Token expired, ACL missing write |
| Message delay | proxy_buffering on — disable in nginx |
| iOS not receiving | iOS app settings, server URL correct |
| Attachment fail | client_max_body_size, disk space |
| WebSocket disconnect | proxy_read_timeout increase |
| Topic not found | Typo, ACL deny read |
| Duplicate messages | Multiple subscribers/scripts |
| Cache grow large | Prune old messages in server config |
| Behind proxy URL wrong | NTFY_BASE_URL must match public URL |

---

## Связка с экосистемой

- Monitoring — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/), [Prometheus](/blog/prometheus-alertmanager-vps/)
- CI/CD — [GitHub Actions](/blog/github-actions-cicd/), [Jenkins](/blog/jenkins-ci-cd-vps/)
- Automation — [n8n](/blog/n8n-self-hosted/)
- Secrets — [Vaultwarden](/blog/vaultwarden-paroli-vps/)
- Docker — [Docker Compose](/blog/docker-compose-vps/)

---

## Итог

ntfy — must-have для любого self-hoster. 256 MB RAM, curl-friendly, мгновенный push. Подключите за 15 минут к любому скрипту.

VPS от 512 MB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Мониторинг — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).`,
	},
	{
		slug: 'firefly-iii-vps',
		coverFile: 'cover-firefly-vps.png',
		pubDate: '2026-07-08',
		title: 'Firefly III на VPS: self-hosted учёт личных финансов и бюджетов',
		description:
			'Firefly III на VPS: Docker, PostgreSQL, импорт CSV, правила, бюджеты, multi-currency, SSL и бэкапы. Приватная альтернатива Mint и YNAB для учёта денег.',
		category: 'DevOps',
		keywords: [
			'Firefly III VPS',
			'personal finance',
			'budget tracking',
			'YNAB alternative',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** Firefly III — open-source personal finance manager. На VPS 1 GB+: Docker + PostgreSQL + [Nginx SSL](/blog/ssl-letsencrypt-vps/) + импорт банковских CSV. Double-entry bookkeeping, budgets, rules, reports — без отправки данных в Mint/YNAB.

Банковские приложения не дают полной картины, Excel устаревает, YNAB — $100/год. Firefly III на [вашем VPS](/blog/choose-vps/) — все счета, транзакции, бюджеты и net worth в одном месте, полностью под вашим контролем.

---

## Firefly III vs YNAB vs Actual Budget vs GnuCash

| Критерий | Firefly III | YNAB | Actual Budget | GnuCash |
| --- | --- | --- | --- | --- |
| Self-hosted | Да | Нет | Local/sync | Desktop |
| Web UI | Modern | Web | Desktop | Desktop |
| RAM | 1 GB | N/A | 256 MB local | 512 MB |
| Bank sync | CSV/import API | Plaid | Manual | OFX |
| Mobile | Third-party apps | Official | No | No |
| Rules engine | Powerful | Good | Good | Basic |
| Cost | VPS only | $99/yr | $4/mo sync | Free |

Firefly III — best self-hosted для envelope budgeting enthusiasts.

---

## Архитектура

\`\`\`
Browser / Mobile app (third-party)
        ↓ HTTPS
   Nginx reverse proxy
        ↓
   Firefly III (PHP/Laravel)
        ↓
   PostgreSQL (transactions, accounts)
        ↓
   /var/www/html/storage/upload (attachments)
        ↓
   Optional: CSV import cron, bank email parser
\`\`\`

Нет bank API для РФ — manual CSV import или [n8n](/blog/n8n-self-hosted/) automation.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Личный учёт | 1 GB | 1 vCPU | 10 GB |
| Семья + 5 лет истории | 2 GB | 1 vCPU | 20 GB |
| Heavy reports | 2 GB | 2 vCPU | 30 GB SSD |

Firefly лёгкий — PostgreSQL основной consumer.

---

## Docker Compose

\`\`\`yaml
services:
  firefly:
    image: fireflyiii/core:latest
    restart: unless-stopped
    depends_on:
      - db
    environment:
      APP_KEY: CHANGE_ME_32_CHARS
      APP_URL: https://finance.example.com
      TRUSTED_PROXIES: "**"
      DB_CONNECTION: pgsql
      DB_HOST: db
      DB_PORT: 5432
      DB_DATABASE: firefly
      DB_USERNAME: firefly
      DB_PASSWORD: CHANGE_ME
      DEFAULT_LANGUAGE: ru_RU
      TZ: Europe/Moscow
      AUTHENTICATION_GUARD: web
    volumes:
      - firefly_upload:/var/www/html/storage/upload
    ports:
      - "127.0.0.1:8080:8080"

  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: firefly
      POSTGRES_USER: firefly
      POSTGRES_PASSWORD: CHANGE_ME
    volumes:
      - pgdata:/var/lib/postgresql/data

  importer:
    image: fireflyiii/data-importer:latest
    restart: unless-stopped
    depends_on:
      - firefly
    environment:
      FIREFLY_III_URL: http://firefly:8080
      VANITY_URL: https://finance.example.com
    ports:
      - "127.0.0.1:8081:8080"

volumes:
  firefly_upload:
  pgdata:
\`\`\`

Data Importer — отдельный UI для CSV/bank import на порту 8081.

---

## Nginx reverse proxy

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name finance.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name import.finance.example.com;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Финансы — **обязательно** HTTPS + strong auth.

---

## Первоначальная настройка

1. Register first user (becomes admin)
2. **Profile → Options** — currency RUB, locale ru
3. Create **Asset accounts** — checking, savings, cash, investments
4. Create **Expense categories** — food, transport, utilities
5. Create **Budgets** — monthly envelopes
6. **Rules** — auto-categorize by description regex

---

## Счета и double-entry

Firefly использует double-entry:

| Тип | Пример |
| --- | --- |
| Asset | Банковская карта, наличные |
| Expense | Продукты, аренда |
| Revenue | Зарплата, фриланс |
| Liability | Кредит, ипотека |
| Transfer | Между своими счетами |

Transfer между asset accounts — не expense. Категория только для реальных трат.

---

## Импорт транзакций

| Источник | Метод |
| --- | --- |
| Bank CSV export | Data Importer UI |
| Email receipts | Forward rules (advanced) |
| Manual | Web UI quick entry |
| API | Personal access token + scripts |

\`\`\`bash
# Bank CSV → Firefly via data importer
# Export from Tinkoff/Sber: date, amount, description, category
\`\`\`

[n8n](/blog/n8n-self-hosted/) workflow: email attachment CSV → parse → Firefly API POST.

---

## Rules engine

\`\`\`
IF description contains "PYATEROCHKA" → category "Groceries"
IF amount < 0 AND description contains "TAXI" → category "Transport"
IF description matches "/SALARY/i" → category "Income"
\`\`\`

Rules run on import — экономят часы ручной категоризации.

---

## Budgets и reports

- **Budgets** — monthly limits per category, rollover optional
- **Piggy banks** — savings goals (отпуск, emergency fund)
- **Reports** — net worth over time, category breakdown, budget vs actual
- **Tags** — cross-cutting labels (#vacation, #tax-deductible)

Dashboard — financial health at a glance.

---

## Multi-currency

Firefly supports multiple currencies с exchange rates:
- Manual rate entry
- API auto-update (configure in settings)
- Foreign transactions → convert to default currency

Для crypto — custom asset account + manual price updates.

---

## Mobile access

Official mobile app нет. Options:
- Responsive web UI в браузере
- Third-party apps: Firefly III Mobile (community)
- [Tailscale](/blog/tailscale-vpn-vps/) + bookmark web UI

---

## Security (финансы = sensitive!)

| Пункт | Действие |
| --- | --- |
| HTTPS only | Mandatory |
| Strong password + 2FA | Firefly supports 2FA (TOTP) |
| [Tailscale](/blog/tailscale-vpn-vps/) only | Recommended — no public access |
| [Authentik](/blog/authentik-sso-vps/) | OAuth proxy for team/family |
| Firewall | [nftables](/blog/nftables-firewall-vps/) |
| No public registration | Disable after first user |
| API tokens | Separate per integration, revoke unused |

**Никогда** не expose Firefly публично без VPN/SSO.

---

## Backup

\`\`\`bash
# PostgreSQL
docker compose exec -T db pg_dump -U firefly firefly > firefly-$(date +%F).sql

# Uploads
docker run --rm -v firefly_upload:/data -v $(pwd):/backup alpine \\
  tar czf /backup/firefly-uploads.tar.gz /data
\`\`\`

Стратегия [3-2-1](/blog/backup-vps-3-2-1/) + [Restic](/blog/restic-backup-vps/). Encrypt backups — financial data!

---

## Мониторинг

- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — ping (via Tailscale)
- Disk — transaction history grows slowly
- PostgreSQL health — [monitoring guide](/blog/vps-monitoring/)

Не нужны push alerts — [ntfy](/blog/ntfy-push-vps/) если backup script fails.

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| 500 error after update | \`php artisan migrate\` in container |
| Import duplicates | Use duplicate detection in importer |
| Wrong balance | Check transfers vs expenses classification |
| 2FA locked out | DB reset or backup restore |
| Slow reports | PostgreSQL indexes, reduce date range |
| OAuth redirect loop | TRUSTED_PROXIES, APP_URL correct |
| CSV encoding wrong | UTF-8 export from bank |
| Timezone off | TZ env + user profile timezone |
| API 401 | Regenerate personal access token |
| Importer connection fail | FIREFLY_III_URL internal docker network |

---

## Связка с экосистемой

- Automation — [n8n](/blog/n8n-self-hosted/)
- Alerts — [ntfy](/blog/ntfy-push-vps/)
- SSO — [Authentik](/blog/authentik-sso-vps/)
- VPN — [Tailscale](/blog/tailscale-vpn-vps/)
- Backup — [Restic](/blog/restic-backup-vps/)
- PostgreSQL — [tuning guide](/blog/postgresql-tuning-vps/)

---

## Итог

Firefly III — лучший self-hosted finance tracker. Полный контроль, мощные rules, красивые reports. Доступ только через VPN — и ваши финансы в безопасности.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/). VPN — [Tailscale](/blog/tailscale-vpn-vps/).`,
	},
	{
		slug: 'woodpecker-ci-vps',
		coverFile: 'cover-woodpecker-vps.png',
		pubDate: '2026-07-09',
		title: 'Woodpecker CI на VPS: лёгкий self-hosted CI/CD с Docker pipelines',
		description:
			'Woodpecker CI на VPS: Docker, Gitea/GitHub integration, pipelines YAML, secrets, agents и SSL. Open-source альтернатива GitHub Actions и Jenkins для своего git.',
		category: 'DevOps',
		keywords: [
			'Woodpecker CI VPS',
			'self-hosted CI/CD',
			'Docker pipelines',
			'GitHub Actions alternative',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** Woodpecker CI — open-source CI/CD, compatible с Drone pipelines. На VPS 2 GB+: server container + agent + [Gitea](/blog/gitea-git-server-vps/) OAuth + [Docker](/blog/docker-compose-vps/) pipeline execution. YAML pipelines как GitHub Actions, но на [вашем VPS](/blog/choose-vps/).

GitHub Actions — minutes billing, [Jenkins](/blog/jenkins-ci-cd-vps/) — Java heavyweight. Woodpecker — минимальный footprint, native Docker pipelines, perfect companion для self-hosted [Gitea](/blog/gitea-git-server-vps/).

---

## Woodpecker vs Jenkins vs GitHub Actions vs Drone

| Критерий | Woodpecker | [Jenkins](/blog/jenkins-ci-cd-vps/) | GitHub Actions | Drone |
| --- | --- | --- | --- | --- |
| RAM server | 512 MB–1 GB | 2 GB+ | N/A | 512 MB |
| Pipeline format | YAML | Groovy/Jenkinsfile | YAML | YAML |
| Docker-native | Да | Plugin | Hosted runners | Да |
| Gitea integration | Native OAuth | Plugin | GitHub only | Native |
| UI | Clean modern | Classic | GitHub UI | Clean |
| Maintenance | Low | High | Zero | Low (archived→Woodpecker) |

Woodpecker — spiritual successor Drone, active development.

---

## Архитектура

\`\`\`
Developer git push
        ↓ webhook
   Gitea / GitHub / GitLab
        ↓
   Woodpecker Server (API + UI)
        ↓
   Woodpecker Agent(s) — Docker socket
        ↓
   Pipeline containers (build, test, deploy)
        ↓
   Target: VPS deploy, [Harbor](/blog/harbor-docker-registry-vps/), SSH
\`\`\`

Server и agent могут быть на одном VPS для small teams.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Server only (1 agent) | 2 GB | 2 vCPU | 20 GB |
| Server + heavy builds | 4 GB | 4 vCPU | 50 GB SSD |
| Multiple agents | 2 GB server + agents on build nodes | | |

Build containers ephemeral — disk fills with dangling images. \`docker system prune\` weekly cron.

---

## Docker Compose

\`\`\`yaml
services:
  woodpecker-server:
    image: woodpeckerci/woodpecker-server:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    volumes:
      - woodpecker-data:/var/lib/woodpecker/
    environment:
      WOODPECKER_OPEN: "false"
      WOODPECKER_HOST: https://ci.example.com
      WOODPECKER_GITEA: "true"
      WOODPECKER_GITEA_URL: https://git.example.com
      WOODPECKER_GITEA_CLIENT: YOUR_GITEA_OAUTH_CLIENT_ID
      WOODPECKER_GITEA_SECRET: YOUR_GITEA_OAUTH_SECRET
      WOODPECKER_AGENT_SECRET: CHANGE_ME_AGENT_SECRET
      WOODPECKER_ADMIN: admin

  woodpecker-agent:
    image: woodpeckerci/woodpecker-agent:latest
    restart: unless-stopped
    depends_on:
      - woodpecker-server
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      WOODPECKER_SERVER: woodpecker-server:9000
      WOODPECKER_AGENT_SECRET: CHANGE_ME_AGENT_SECRET
      WOODPECKER_MAX_WORKFLOWS: 2

volumes:
  woodpecker-data:
\`\`\`

Agent needs Docker socket — security sensitive. Isolate build VPS if possible.

---

## Gitea OAuth setup

1. Gitea → Settings → Applications → Create OAuth2
2. Redirect URI: \`https://ci.example.com/authorize\`
3. Copy Client ID + Secret → Woodpecker env
4. First login Woodpecker → authorize via Gitea
5. Activate repos in Woodpecker UI

Полный Gitea setup — [Gitea на VPS](/blog/gitea-git-server-vps/).

---

## Nginx reverse proxy

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name ci.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /webhook {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
\`\`\`

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Webhooks от Gitea требуют public HTTPS.

---

## Pipeline example (.woodpecker.yml)

\`\`\`yaml
steps:
  - name: test
    image: node:20-alpine
    commands:
      - npm ci
      - npm test

  - name: build
    image: node:20-alpine
    commands:
      - npm run build
    when:
      branch: main

  - name: deploy
    image: appleboy/drone-ssh
    settings:
      host: deploy.example.com
      username: deploy
      key:
        from_secret: ssh_key
      script:
        - cd /app && docker compose pull && docker compose up -d
    when:
      branch: main
      event: push
\`\`\`

Place \`.woodpecker.yml\` in repo root. Woodpecker auto-discovers on push.

---

## Secrets management

\`\`\`bash
# Woodpecker CLI or UI → repository secrets
woodpecker-cli repo secret add --name ssh_key --value @~/.ssh/id_ed25519
woodpecker-cli repo secret add --name registry_password --value "SECRET"
\`\`\`

Secrets encrypted at rest. Не храните в YAML. Для org-wide — [HashiCorp Vault](/blog/vault-secrets-vps/) integration via plugins.

---

## Multi-pipeline и when conditions

\`\`\`yaml
when:
  branch: [main, develop]
  event: [push, pull_request]
  path: ["src/**", "package.json"]
\`\`\`

Path filtering — run only when relevant files change. Matrix builds:

\`\`\`yaml
matrix:
  NODE_VERSION:
    - 18
    - 20
steps:
  - name: test
    image: node:\${NODE_VERSION}-alpine
    commands:
      - npm test
\`\`\`

---

## Docker registry integration

Push images to [Harbor](/blog/harbor-docker-registry-vps/) or Docker Hub:

\`\`\`yaml
  - name: publish
    image: plugins/docker
    settings:
      repo: registry.example.com/app/\${CI_COMMIT_SHA}
      registry: registry.example.com
      username:
        from_secret: registry_user
      password:
        from_secret: registry_password
    when:
      branch: main
\`\`\`

---

## Deploy strategies

| Target | Plugin/method |
| --- | --- |
| SSH + docker compose | appleboy/drone-ssh |
| Kubernetes | kubectl step |
| [PocketBase](/blog/pocketbase-vps/) | rsync + restart |
| Static site | rsync to nginx www |

Notifications — [ntfy](/blog/ntfy-push-vps/) curl step on pipeline fail.

---

## Security hardening

| Пункт | Действие |
| --- | --- |
| WOODPECKER_OPEN=false | No anonymous registration |
| Agent secret | Strong random, server+agent match |
| Docker socket | Dedicated build user, no root in pipelines |
| Trusted repos only | Enable per-repo in Woodpecker UI |
| [Tailscale](/blog/tailscale-vpn-vps/) | Admin UI VPN-only optional |
| Pin images | Don't use :latest in production pipelines |

Malicious \`.woodpecker.yml\` PR = code execution. Protect main branch, require review.

---

## Backup

\`\`\`bash
docker run --rm -v woodpecker-data:/data -v $(pwd):/backup alpine \\
  tar czf /backup/woodpecker-data.tar.gz /data
\`\`\`

Contains: pipeline history, secrets (encrypted), settings. [3-2-1](/blog/backup-vps-3-2-1/).

---

## Мониторинг

- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — CI UI availability
- Failed pipeline → [ntfy](/blog/ntfy-push-vps/) alert
- Agent connected — Woodpecker UI shows agent status
- Disk — build cache growth

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| Agent not connecting | WOODPECKER_AGENT_SECRET mismatch |
| Pipeline not triggered | Webhook URL in Gitea, check deliveries |
| Docker permission denied | Agent user in docker group |
| OOM during build | Increase VPS RAM, limit parallel workflows |
| Secret not found | Repository vs org secret scope |
| OAuth login fail | Redirect URI exact match |
| Stale images fill disk | cron docker system prune -af |
| YAML parse error | Woodpecker lint in UI logs |
| Clone fail | Gitea deploy key or OAuth scope |
| Slow builds | layer caching, registry mirror |

---

## Связка с экосистемой

- Git — [Gitea](/blog/gitea-git-server-vps/)
- Registry — [Harbor](/blog/harbor-docker-registry-vps/)
- Compare — [Jenkins](/blog/jenkins-ci-cd-vps/), [GitHub Actions](/blog/github-actions-cicd/)
- Secrets — [Vault](/blog/vault-secrets-vps/)
- Alerts — [ntfy](/blog/ntfy-push-vps/)
- Docker — [Docker Compose](/blog/docker-compose-vps/)

---

## Итог

Woodpecker CI — идеальный CI/CD для self-hosted git. Лёгкий, Docker-native, YAML pipelines. Пара с Gitea — полноценная dev platform на одном VPS.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Git — [Gitea](/blog/gitea-git-server-vps/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Alerts — [ntfy](/blog/ntfy-push-vps/).`,
	},
	{
		slug: 'freshrss-vps',
		coverFile: 'cover-freshrss-vps.png',
		pubDate: '2026-07-09',
		title: 'FreshRSS на VPS: self-hosted RSS-агрегатор вместо Feedly',
		description:
			'FreshRSS на VPS: Docker, PostgreSQL, fever API, мобильные клиенты, фильтры, SSL и бэкапы. Приватное чтение новостей и блогов без алгоритмов Feedly.',
		category: 'DevOps',
		keywords: [
			'FreshRSS VPS',
			'RSS reader',
			'self-hosted news',
			'Feedly alternative',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** FreshRSS — лёгкий self-hosted RSS reader. На VPS 512 MB–1 GB: Docker + PostgreSQL/SQLite + [Nginx SSL](/blog/ssl-letsencrypt-vps/). Fever API для mobile apps, WebSub для instant updates, filters для шума.

Feedly — freemium с лимитами, Google Reader мёртв, алгоритмические ленты — bubble. FreshRSS на [вашем VPS](/blog/choose-vps/) — все ваши источники, keyboard shortcuts, full-text search, zero tracking.

---

## FreshRSS vs Miniflux vs Tiny Tiny RSS vs Feedly

| Критерий | FreshRSS | Miniflux | TTRSS | Feedly |
| --- | --- | --- | --- | --- |
| Self-hosted | Да | Да | Да | Нет |
| RAM | 512 MB | 256 MB | 1 GB | N/A |
| UI | Feature-rich | Minimal | Classic | Polished |
| Mobile apps | Fever API (many) | Official | Official | Official |
| Filters | Advanced | Basic | Advanced | AI |
| PostgreSQL | Да | Да | Да | N/A |
| Extension API | Google Reader API | Miniflux API | Fever | Proprietary |

FreshRSS — best balance features/resources для power readers.

---

## Архитектура

\`\`\`
RSS/Atom feeds on the internet
        ↓ polling / WebSub
   FreshRSS (PHP)
        ↓
   PostgreSQL or SQLite
        ↓
   Nginx → Browser / Mobile app (Fever API)
        ↓
   Optional: full-text via SQLite FTS or extensions
\`\`\`

FreshRSS cron fetches feeds every 15–60 min. WebSub — push updates для supported feeds.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| <100 feeds personal | 512 MB | 1 vCPU | 5 GB |
| 500 feeds power user | 1 GB | 1 vCPU | 15 GB |
| 1000+ feeds | 2 GB | 2 vCPU | 30 GB SSD |

SQLite OK для personal, PostgreSQL для multi-user и scale.

---

## Docker Compose

\`\`\`yaml
services:
  freshrss:
    image: freshrss/freshrss:latest
    restart: unless-stopped
    depends_on:
      - db
    environment:
      CRON_MIN: "*/15 * * * *"
      TZ: Europe/Moscow
    volumes:
      - freshrss_data:/var/www/FreshRSS/data
      - freshrss_extensions:/var/www/FreshRSS/extensions
    ports:
      - "127.0.0.1:8080:80"

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: freshrss
      POSTGRES_USER: freshrss
      POSTGRES_PASSWORD: CHANGE_ME
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  freshrss_data:
  freshrss_extensions:
  pgdata:
\`\`\`

SQLite alternative — уберите db service, FreshRSS auto-uses SQLite in data volume.

---

## Nginx reverse proxy

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name rss.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Auth — built-in multi-user или [Authentik](/blog/authentik-sso-vps/) proxy.

---

## Первоначальная настройка

1. \`https://rss.example.com\` → installation wizard
2. Check system requirements (all green)
3. Database: PostgreSQL credentials
4. Create admin user
5. **Settings → Reading** — article count, default view
6. **Settings → Authentication** — allow registration off
7. Import OPML from Feedly/Inoreader

---

## Добавление feeds

| Метод | Как |
| --- | --- |
| Manual | Subscribe → URL |
| OPML import | Settings → Import |
| Extension | Firefox FreshRSS subscription |
| Discovery | Auto-detect from website URL |

Рекомендуемые категории: Tech, DevOps, News, Blogs, YouTube (via RSS bridge).

Связка: читайте stormblog и devops feeds в одном UI.

---

## Filters и labels

\`\`\`
# Filter example: mark Kubernetes posts
IF content contains "Kubernetes" THEN add label "k8s"

# Filter: hide sponsored
IF title contains "Sponsored" THEN mark as read

# Filter: priority
IF feed is "CVE Alerts" THEN do not mark as read on scroll
\`\`\`

Filters — мощный инструмент против noise. Regex supported.

---

## Fever API для mobile

FreshRSS → Settings → Authentication → enable Fever API:

\`\`\`
API URL: https://rss.example.com/api/fever.php
Username: your_user
Password: fever_api_password (separate from login)
\`\`\`

Compatible apps:
- **Reeder** (iOS/macOS)
- **FeedMe** (Android)
- **Fluent Reader** (desktop)

---

## Google Reader API (optional)

FreshRSS supports Google Reader compatible API для **Newsboat**, **Readkit**, etc. Enable in extensions/settings.

---

## WebSub и polling

| Механизм | Latency | Feeds supported |
| --- | --- | --- |
| WebSub (PubSubHubbub) | Seconds | Medium.com, many blogs |
| Polling CRON | 15–60 min | All RSS |

\`CRON_MIN: "*/15 * * * *"\` — balance freshness vs VPS load.

---

## Full-text search

Enable extension **full-text search** или built-in depending on version. Index all article content — find old posts by keyword.

PostgreSQL backend — better search performance at scale.

---

## Sharing и integration

- Share to [n8n](/blog/n8n-self-hosted/) webhook → Telegram/Slack
- Save starred articles в [Nextcloud](/blog/nextcloud-oblako-vps/) via export
- Star → trigger [PocketBase](/blog/pocketbase-vps/) API for bookmark DB

\`\`\`bash
# Export starred articles OPML
curl -u user:pass https://rss.example.com/i/export/starred.opml
\`\`\`

---

## Multi-user

FreshRSS supports multiple users с separate feeds or shared categories. Family server: один VPS, individual accounts.

SSO — HTTP auth proxy via [Authentik](/blog/authentik-sso-vps/).

---

## Backup

\`\`\`bash
# PostgreSQL
docker compose exec -T db pg_dump -U freshrss freshrss > freshrss-$(date +%F).sql

# Data volume (config, cache, sqlite if used)
docker run --rm -v freshrss_data:/data -v $(pwd):/backup alpine \\
  tar czf /backup/freshrss-data.tar.gz /data
\`\`\`

OPML export monthly — human-readable feed list backup. [3-2-1](/blog/backup-vps-3-2-1/) + [Restic](/blog/restic-backup-vps/).

---

## Security

| Пункт | Действие |
| --- | --- |
| HTTPS | Required |
| Disable public registration | After users created |
| Strong passwords | Per user |
| [Tailscale](/blog/tailscale-vpn-vps/) | Private access option |
| Update FreshRSS | Docker pull monthly |
| API passwords | Separate from login, rotate |

RSS reader knows your interests — treat as private data.

---

## Performance tuning

- Reduce feed count — unsubscribe dead feeds quarterly
- Increase CRON interval if CPU spikes
- PostgreSQL over SQLite for 500+ feeds
- Enable HTTP caching headers in Nginx for static assets
- \`TTRSS_FEEDS_LIMIT\` equivalent — archive old articles

---

## Мониторинг

- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — ping FreshRSS
- Feed errors — FreshRSS UI → feed management → error column
- [ntfy](/blog/ntfy-push-vps/) alert if feed fetch fails X times (custom script)

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| Feed not updating | Check CRON, feed URL valid, error log |
| Fever API 401 | Separate API password, not login password |
| 500 after update | Check PHP extensions in container logs |
| Duplicate articles | Feed changed GUID, mark as read |
| Slow UI | Too many unread — mark all read archive |
| WebSub not working | Public URL required for callback |
| PostgreSQL connection | Credentials in FreshRSS config |
| Import OPML fail | File encoding UTF-8 |
| Mobile app empty | Wrong API URL path /api/fever.php |
| High memory | Reduce feeds or switch SQLite→PG tuning |

---

## Связка с экосистемой

- Search — [SearXNG](/blog/searxng-poisk-vps/) for finding new blogs
- Automation — [n8n](/blog/n8n-self-hosted/)
- VPN — [Tailscale](/blog/tailscale-vpn-vps/)
- SSO — [Authentik](/blog/authentik-sso-vps/)
- Backup — [Restic](/blog/restic-backup-vps/)
- Docker — [Docker Compose](/blog/docker-compose-vps/)

---

## Итог

FreshRSS — must-have для тех, кто читает интернет осознанно. Без алгоритмов, без tracking, с полным контролем. 512 MB VPS хватит на сотни feeds.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Поиск блогов — [SearXNG](/blog/searxng-poisk-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/).`,
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
