---
title: "Ghost CMS на VPS: self-hosted блог и newsletter без Substack"
description: "Ghost на VPS: Docker, MySQL, Nginx, SSL, темы, Members, Stripe, email newsletter и бэкапы. Полный гайд по независимому блогу и монетизации контента."
pubDate: 2026-07-01
category: DevOps
keywords:
  - "Ghost CMS VPS"
  - "self-hosted blog"
  - "newsletter"
  - "Substack alternative"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Ghost — Node.js CMS для блогов и email-рассылок. На VPS 2 GB+: [Docker Compose](/blog/docker-compose-vps/) + MySQL + [Nginx + SSL](/blog/ssl-letsencrypt-vps/) + ежедневный [backup](/blog/backup-vps-3-2-1/). Members и Stripe — без комиссии платформы.

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

```
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
```

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

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin nginx certbot
sudo usermod -aG docker $USER
```

DNS: `A` запись `blog.example.com` → IP VPS. Для newsletter — SPF, DKIM, DMARC на домене ([Postfix guide](/blog/postfix-dovecot-pochta-vps/)).

---

## Docker Compose (production)

```yaml
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
```

Первый запуск: `docker compose up -d`, затем `https://blog.example.com/ghost` для создания admin.

---

## Nginx reverse proxy

```nginx
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
```

SSL: [Let's Encrypt certbot](/blog/ssl-letsencrypt-vps/). Альтернатива — [Caddy](/blog/nginx-ili-caddy/) с auto-HTTPS.

---

## Первоначальная настройка Ghost

1. Откройте `/ghost` → создайте owner account
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

Темы живут в `content/themes/`. После изменений: **Settings → Design → Restart**.

Code injection (head/footer) — для [Plausible](/blog/plausible-analytics-vps/) script без правки темы.

---

## Members, tiers и Stripe

Ghost Members — встроенная подписка без Substack:

1. **Settings → Membership → Stripe** — подключите Stripe account
2. Создайте **Tiers** (free / monthly / yearly)
3. **Posts** → выберите visibility: Public / Members only / Paid only
4. Portal URL: `/signup/` — self-service управление подпиской

Комиссия: только Stripe (~2.9%), Ghost не берёт platform fee. Данные members в вашей MySQL.

---

## Email newsletter best practices

| Практика | Зачем |
| --- | --- |
| Dedicated subdomain | `news.example.com` — reputation isolation |
| SPF + DKIM + DMARC | Inbox delivery, не spam |
| Double opt-in | GDPR, меньше жалоб |
| Unsubscribe one-click | Legal requirement |
| Batch size tuning | MySQL load при 10k+ subs |

Для больших рассылок — внешний ESP (Mailgun, SES) через SMTP. Ghost queue обрабатывает асинхронно.

---

## SEO и performance

- **Canonical URLs** — Ghost генерирует автоматически
- **Sitemap** — `/sitemap.xml`
- **Structured data** — JSON-LD для articles
- **Image optimization** — загружайте WebP, lazy load в теме
- **CDN** — Cloudflare перед Nginx (cache static, не HTML admin)

Lighthouse: Ghost с Casper обычно 90+ performance out of box.

---

## Интеграции и автоматизация

```bash
# Публикация через Admin API (CI)
curl -X POST "https://blog.example.com/ghost/api/admin/posts/" \
  -H "Authorization: Ghost YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"posts":[{"title":"New post","status":"published"}]}'
```

Связки:
- **Zapier/n8n** — [n8n self-hosted](/blog/n8n-self-hosted/) для webhook → Telegram
- **GitHub Actions** — draft из markdown в repo
- **Analytics** — [Plausible](/blog/plausible-analytics-vps/)

---

## Backup и disaster recovery

| Что бэкапить | Как | Частота |
| --- | --- | --- |
| MySQL dump | `mysqldump ghost` | Daily |
| ghost-content volume | tar/rsync | Daily |
| Ghost config (env) | git secret repo | On change |

```bash
#!/bin/bash
# /opt/backup-ghost.sh
docker compose exec -T db mysqldump -u ghost -p$DB_PASS ghost > /backup/ghost-db.sql
tar czf /backup/ghost-content-$(date +%F).tar.gz ./ghost-content/
```

Стратегия [3-2-1](/blog/backup-vps-3-2-1/): local + [Restic offsite](/blog/restic-backup-vps/). Тест restore на staging VPS раз в квартал.

---

## Security hardening

| Пункт | Реализация |
| --- | --- |
| HTTPS only | Nginx redirect 80→443 |
| Admin 2FA | Ghost native TOTP в staff settings |
| Rate limiting | Nginx `limit_req` на /ghost/api/ |
| Firewall | [nftables](/blog/nftables-firewall-vps/) — 80, 443 only |
| Updates | `docker compose pull && up -d` monthly |
| Admin via VPN | [Tailscale](/blog/tailscale-vpn-vps/) restrict /ghost to mesh |

Не храните Stripe keys в git. Используйте `.env` с restricted permissions.

---

## Мониторинг

- **Uptime** — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) ping `/api/health/` (если plugin) или homepage
- **Logs** — `docker compose logs -f ghost`
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
| 502 Bad Gateway | Ghost container down, check `docker compose ps` |
| Images not loading | `url` в env не совпадает с реальным доменом |
| Email not sending | SMTP creds, port 587 TLS, check spam score |
| Slow admin | MySQL indexes, upgrade RAM, enable swap |
| Theme broken after update | `ghost restart`, check theme compatibility v5 |
| Stripe webhook fail | Verify endpoint URL HTTPS, check Stripe logs |
| Database connection | MySQL healthcheck, password mismatch in compose |
| Redirect loop | `X-Forwarded-Proto` в Nginx |

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

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/). Аналитика — [Plausible](/blog/plausible-analytics-vps/).
