---
title: "ntfy на VPS: self-hosted push-уведомления для серверов и автоматизаций"
description: "ntfy на VPS: Docker, Nginx, SSL, topics, auth, Android/iOS клиенты, curl-интеграции и мониторинг. Альтернатива Pushover и Telegram-ботам для алертов."
pubDate: 2026-07-07
category: DevOps
keywords:
  - "ntfy VPS"
  - "push notifications"
  - "self-hosted alerts"
  - "Pushover alternative"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** ntfy — HTTP-based push notification server. На VPS 256 MB+: один Docker container + [Nginx SSL](/blog/ssl-letsencrypt-vps/). Publish: `curl -d "message" https://ntfy.example.com/topic`. Subscribe: mobile app или WebSocket.

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

```
Cron / CI / Monitoring / Scripts
        ↓ HTTP POST
   Nginx (443) → ntfy server (8080)
        ↓
   SQLite (users, tokens) + cache
        ↓
   Firebase/APNs (mobile push relay)
        ↓
   Android / iOS / Web / RSS subscribers
```

Topics — pub/sub channels. `server-alerts`, `backup-status`, `deploy-prod` — separate channels.

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

```yaml
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
```

`NTFY_AUTH_DEFAULT_ACCESS: deny-all` — все topics требуют auth по умолчанию (secure).

---

## Nginx reverse proxy

```nginx
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
```

`proxy_buffering off` — critical для streaming/subscribe long-poll.

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/).

---

## Users, tokens и ACL

```bash
# Create admin user
docker compose exec ntfy ntfy user add admin
docker compose exec ntfy ntfy user passwd admin

# Create access token for scripts
docker compose exec ntfy ntfy token add admin scripts-token

# ACL: allow admin publish to server-alerts
docker compose exec ntfy ntfy access admin server-alerts write
docker compose exec ntfy ntfy access admin server-alerts read
```

Tokens в [Vaultwarden](/blog/vaultwarden-paroli-vps/) — не в git repos.

---

## Publishing messages

```bash
# Simple
curl -d "Backup completed OK" https://ntfy.example.com/server-alerts

# With title, priority, tags
curl -H "Title: Disk Alert" \
     -H "Priority: urgent" \
     -H "Tags: warning,red_circle" \
     -d "Disk 90% full on prod-db" \
     https://ntfy.example.com/server-alerts

# Auth token
curl -H "Authorization: Bearer TOKEN" \
     -d "Deploy finished" \
     https://ntfy.example.com/deploy-prod
```

Priority: `min`, `low`, `default`, `high`, `urgent` — urgent bypasses DND on Android.

---

## Mobile apps

1. Install ntfy app (Android/iOS)
2. Add server: `https://ntfy.example.com`
3. Login with user credentials
4. Subscribe to topics: `server-alerts`, etc.

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

```yaml
# docker-compose healthcheck notify example
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost"]
  interval: 30s
```

---

## Attachments и actions

```bash
# Send image
curl -H "Attach: https://example.com/graph.png" \
     -d "CPU spike detected" \
     https://ntfy.example.com/metrics

# Action buttons (open URL)
curl -H "Actions: view, Open Dashboard, https://grafana.example.com" \
     -d "Check metrics" \
     https://ntfy.example.com/alerts
```

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

```bash
tar czf ntfy-cache-$(date +%F).tar.gz ./cache/
# Contains: auth.db, cache.db, attachments
```

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

Не используйте guessable topic names (`alerts`, `test`) без auth — enumeration risk.

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

VPS от 512 MB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Мониторинг — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).
