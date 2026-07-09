---
title: "FreshRSS на VPS: self-hosted RSS-агрегатор вместо Feedly"
description: "FreshRSS на VPS: Docker, PostgreSQL, fever API, мобильные клиенты, фильтры, SSL и бэкапы. Приватное чтение новостей и блогов без алгоритмов Feedly."
pubDate: 2026-07-09
category: DevOps
keywords:
  - "FreshRSS VPS"
  - "RSS reader"
  - "self-hosted news"
  - "Feedly alternative"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** FreshRSS — лёгкий self-hosted RSS reader. На VPS 512 MB–1 GB: Docker + PostgreSQL/SQLite + [Nginx SSL](/blog/ssl-letsencrypt-vps/). Fever API для mobile apps, WebSub для instant updates, filters для шума.

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

```
RSS/Atom feeds on the internet
        ↓ polling / WebSub
   FreshRSS (PHP)
        ↓
   PostgreSQL or SQLite
        ↓
   Nginx → Browser / Mobile app (Fever API)
        ↓
   Optional: full-text via SQLite FTS or extensions
```

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

```yaml
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
```

SQLite alternative — уберите db service, FreshRSS auto-uses SQLite in data volume.

---

## Nginx reverse proxy

```nginx
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
```

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Auth — built-in multi-user или [Authentik](/blog/authentik-sso-vps/) proxy.

---

## Первоначальная настройка

1. `https://rss.example.com` → installation wizard
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

```
# Filter example: mark Kubernetes posts
IF content contains "Kubernetes" THEN add label "k8s"

# Filter: hide sponsored
IF title contains "Sponsored" THEN mark as read

# Filter: priority
IF feed is "CVE Alerts" THEN do not mark as read on scroll
```

Filters — мощный инструмент против noise. Regex supported.

---

## Fever API для mobile

FreshRSS → Settings → Authentication → enable Fever API:

```
API URL: https://rss.example.com/api/fever.php
Username: your_user
Password: fever_api_password (separate from login)
```

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

`CRON_MIN: "*/15 * * * *"` — balance freshness vs VPS load.

---

## Full-text search

Enable extension **full-text search** или built-in depending on version. Index all article content — find old posts by keyword.

PostgreSQL backend — better search performance at scale.

---

## Sharing и integration

- Share to [n8n](/blog/n8n-self-hosted/) webhook → Telegram/Slack
- Save starred articles в [Nextcloud](/blog/nextcloud-oblako-vps/) via export
- Star → trigger [PocketBase](/blog/pocketbase-vps/) API for bookmark DB

```bash
# Export starred articles OPML
curl -u user:pass https://rss.example.com/i/export/starred.opml
```

---

## Multi-user

FreshRSS supports multiple users с separate feeds or shared categories. Family server: один VPS, individual accounts.

SSO — HTTP auth proxy via [Authentik](/blog/authentik-sso-vps/).

---

## Backup

```bash
# PostgreSQL
docker compose exec -T db pg_dump -U freshrss freshrss > freshrss-$(date +%F).sql

# Data volume (config, cache, sqlite if used)
docker run --rm -v freshrss_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/freshrss-data.tar.gz /data
```

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
- `TTRSS_FEEDS_LIMIT` equivalent — archive old articles

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

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Поиск блогов — [SearXNG](/blog/searxng-poisk-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/).
