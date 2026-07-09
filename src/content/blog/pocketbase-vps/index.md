---
title: "PocketBase на VPS: лёгкий BaaS с SQLite, auth и realtime"
description: "PocketBase на VPS: Docker, Nginx, SSL, collections, auth, files, hooks и backup SQLite. Self-hosted Backend-as-a-Service для MVP и side projects."
pubDate: 2026-07-06
category: DevOps
keywords:
  - "PocketBase VPS"
  - "BaaS self-hosted"
  - "SQLite backend"
  - "Firebase alternative"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** PocketBase — single-binary BaaS: SQLite, REST/Realtime API, auth, file storage, admin UI. На VPS 512 MB–1 GB: один Docker container + [Nginx SSL](/blog/ssl-letsencrypt-vps/) + backup `pb_data`. Идеален для MVP, mobile backends, internal tools.

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

```
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
```

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

```yaml
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
```

Первый запуск: `https://api.example.com/_/` — create superuser admin.

---

## Nginx reverse proxy

```nginx
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
```

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

**API rules** — PocketBase superpower. Example list rule: `@request.auth.id != ""` — auth required.

```javascript
// Frontend SDK
import PocketBase from 'pocketbase';
const pb = new PocketBase('https://api.example.com');
await pb.collection('posts').getList(1, 20);
```

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

Files в `pb_data/storage/`. Для S3 offload — custom hook или periodic sync to [MinIO](/blog/minio-s3-na-vps/).

```javascript
// pb_hooks onRecordCreate — example resize
onRecordAfterCreateRequest((e) => {
  // custom logic
}, "posts")
```

Hooks — JavaScript в `pb_hooks/` folder, hot reload.

---

## Realtime subscriptions

```javascript
pb.collection('posts').subscribe('*', (e) => {
  console.log(e.action, e.record);
});
```

WebSocket через `/api/realtime` — Nginx upgrade header обязателен (см. выше).

---

## Migrations и версионирование

```bash
# Export collections schema
./pocketbase migrate collections export.json
# Git track schema, not data.db
```

CI: [GitHub Actions](/blog/github-actions-cicd/) deploy schema → VPS reload. Data migrations — PocketBase migrate command.

---

## Backup

```bash
# PocketBase built-in
./pocketbase backup create

# Or simple copy (stop container first for consistency)
docker compose stop pocketbase
tar czf pb_data-$(date +%F).tar.gz ./pb_data/
docker compose start pocketbase
```

SQLite — один файл `data.db`. Стратегия [3-2-1](/blog/backup-vps-3-2-1/) + [Restic](/blog/restic-backup-vps/). **PB_ENCRYPTION_KEY** — backup separately в [Vaultwarden](/blog/vaultwarden-paroli-vps/)!

---

## Security hardening

| Пункт | Действие |
| --- | --- |
| PB_ENCRYPTION_KEY | 32+ random chars, never change after data |
| API rules | Deny by default, allow explicitly |
| Rate limiting | Nginx `limit_req` |
| Admin UI | [Tailscale](/blog/tailscale-vpn-vps/) only or IP whitelist |
| HTTPS | Mandatory |
| Updates | Track PocketBase releases, breaking changes in changelog |

---

## Scaling limits

SQLite write concurrency ~1. When to migrate away:
- >100 writes/sec sustained
- Multi-server horizontal scale needed
- Complex analytics queries

Migration path: export data → PostgreSQL backend (custom) or Supabase. PocketBase author acknowledges SQLite limits.

---

## Frontend deployment

SPA (Svelte/React/Vue) на [отдельном subdomain](/blog/nextjs-deploy-na-vps/) или Cloudflare Pages. PocketBase = API only.

```
app.example.com  → static frontend
api.example.com  → PocketBase
```

CORS: allow `app.example.com` in PocketBase settings.

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

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/).
