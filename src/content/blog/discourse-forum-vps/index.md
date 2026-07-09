---
title: "Discourse на VPS: self-hosted форум вместо Reddit и phpBB"
description: "Discourse на VPS: Docker, PostgreSQL, Redis, SMTP, SSL, плагины, модерация и бэкапы. Полный гайд по современному community forum для продукта или команды."
pubDate: 2026-07-02
category: DevOps
keywords:
  - "Discourse VPS"
  - "self-hosted forum"
  - "community"
  - "Reddit alternative"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Discourse — Ruby on Rails форум нового поколения. На VPS 4 GB+: official Docker image + PostgreSQL + Redis + [Nginx SSL](/blog/ssl-letsencrypt-vps/) + SMTP. Минимум 2 GB RAM, рекомендуется 4 GB для активного community.

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

```
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
```

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

Официальный метод — `discourse_docker` launcher:

```bash
sudo apt update && sudo apt install -y git
sudo mkdir -p /var/discourse
sudo git clone https://github.com/discourse/discourse_docker.git /var/discourse
cd /var/discourse
```

Интерактивная настройка:

```bash
sudo ./discourse-setup
```

Вопросы: hostname (`forum.example.com`), email admin, SMTP server, Let's Encrypt email.

---

## containers/app.yml (ключевые параметры)

```yaml
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
```

Rebuild после изменений: `sudo ./launcher rebuild app`.

---

## Nginx перед Discourse (optional)

Discourse standalone включает свой Nginx + Let's Encrypt. Если нужен единый reverse proxy:

```nginx
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
```

Отключите встроенный SSL в `app.yml` если терминируете на внешнем [Nginx](/blog/nginx-ili-caddy/).

---

## Первоначальная настройка

1. Откройте `https://forum.example.com` → wizard setup
2. **Settings → Required** — confirm email works (test email)
3. **Settings → Login** — enable Google/GitHub OAuth или [Authentik OIDC](/blog/authentik-sso-vps/)
4. **Categories** — создайте структуру (Announcements, Support, General)
5. **Trust levels** — настройте пороги для TL1–TL4
6. **About topic** — закрепите правила community

---

## SSO через Authentik (OIDC)

В `app.yml` добавьте:

```yaml
env:
  DISCOURSE_ENABLE_DISCOURSE_CONNECT: true
  DISCOURSE_DISCOURSE_CONNECT_URL: https://auth.example.com/application/o/discourse/.well-known/openid-configuration
  DISCOURSE_DISCOURSE_CONNECT_CLIENT_ID: discourse
  DISCOURSE_DISCOURSE_CONNECT_CLIENT_SECRET: SECRET
```

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

Установка: `app.yml` → `hooks:` → `after_code:` → git clone plugin → rebuild.

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

SPF, DKIM, DMARC обязательны. Используйте dedicated subdomain `mail.example.com`. Гайд — [Postfix на VPS](/blog/postfix-dovecot-pochta-vps/).

---

## Performance tuning

```yaml
# app.yml
env:
  UNICORN_WORKERS: 4          # 2 * CPU cores
  DISCOURSE_DB_POOL: 25
  DISCOURSE_SIDEKIQ_WORKERS: 5
```

- **CDN** — Cloudflare cache static assets
- **PostgreSQL tuning** — [PostgreSQL guide](/blog/postgresql-tuning-vps/)
- **Redis memory** — monitor `used_memory`
- **Rebuild indexes** — Admin → reindex search (off-peak hours)

---

## Backup

```bash
# Discourse built-in backup (Admin → Backups)
# Or manual:
sudo ./launcher enter app
discourse backup
```

Бэкап включает PostgreSQL dump + uploads. Храните offsite — [Restic](/blog/restic-backup-vps/), стратегия [3-2-1](/blog/backup-vps-3-2-1/).

Расписание: Admin → Backups → enable automatic daily + S3 ([MinIO](/blog/minio-s3-na-vps/) compatible).

---

## Security hardening

| Пункт | Действие |
| --- | --- |
| 2FA for staff | Settings → enforce for moderators |
| Rate limits | `web.ratelimited.template.yml` enabled |
| Firewall | [nftables](/blog/nftables-firewall-vps/) — 80, 443 |
| Admin via VPN | [Tailscale](/blog/tailscale-vpn-vps/) restrict admin paths |
| Updates | Monthly `launcher rebuild app` |
| Crawler protection | Cloudflare bot fight mode |

---

## Мониторинг

- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — ping homepage + /login
- Sidekiq queue depth — Admin → Sidekiq (failed jobs alert)
- PostgreSQL connections — `SELECT count(*) FROM pg_stat_activity;`
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

VPS от 4 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/). SSO — [Authentik](/blog/authentik-sso-vps/).
