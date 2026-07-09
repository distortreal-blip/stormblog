---
title: "Audiobookshelf на VPS: self-hosted аудиокниги и подкасты"
description: "Audiobookshelf на VPS: Docker, библиотека аудио, мобильные apps, Nginx, SSL и бэкапы. Ваша коллекция без Audible."
pubDate: 2026-07-05
category: DevOps
keywords:
  - "Audiobookshelf VPS"
  - "audiobooks self-hosted"
  - "podcast server"
  - "Audible alternative"
  - "Storm Cloud"
heroImage: ./cover.webp
imageAlt: "Audiobookshelf — self-hosted сервер аудиокниг и подкастов на VPS с мобильными приложениями"
---

**Краткий ответ:** Audiobookshelf — self-hosted аудиокниги и подкасты с progress sync. На VPS 2 GB+: [Docker Compose](/blog/docker-compose-vps/) + [Nginx SSL](/blog/ssl-letsencrypt-vps/) + NAS mount.

Audible — DRM, нет ownership. Plex — video-first. Audiobookshelf на [вашем VPS](/blog/choose-vps/) — MP3/M4B library, mobile apps, multi-user.

---

## Audiobookshelf vs Audible vs Plex vs Booksonic

| Критерий | Audiobookshelf | SaaS Leader | Alternative OSS | Enterprise |
| --- | --- | --- | --- | --- |
| Self-hosted | Да | Нет | Да | Нет |
| Цена | Free (VPS) | $10+/user | Free | $$$ |
| RAM на VPS | 1–4 GB | N/A | 1 GB | N/A |
| API | REST | Pro | REST | Pro |
| Приватность | Полная | Cloud | Полная | Vendor |

Audiobookshelf — оптимальный self-hosted выбор для аудиокниг на VPS.

---

## Архитектура production stack

```
Users / Agents
        ↓ HTTPS
   Nginx + Let's Encrypt
        ↓
   Audiobookshelf container (port 13378)
        ↓
   Database + volumes
        ↓
   Optional: [Authentik](/blog/authentik-sso-vps/) / [CrowdSec](/blog/crowdsec-zashchita-vps/)
```

Опционально: [Authentik](/blog/authentik-sso-vps/) SSO, [CrowdSec](/blog/crowdsec-zashchita-vps/) WAF, [Tailscale](/blog/tailscale-vpn-vps/) private access.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Личное использование | 1 GB | 1 vCPU | 10 GB SSD |
| Команда / small org | 2 GB | 2 vCPU | 20 GB SSD |
| Production + HA | 4 GB | 2 vCPU | 40 GB SSD |

Audiobookshelf на [Docker Compose](/blog/docker-compose-vps/) — предсказуемое потребление ресурсов. Bottleneck чаще диск при media-heavy workloads.

---

## Подготовка VPS

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin nginx certbot
sudo usermod -aG docker $USER
```

DNS: `A` запись `audio.example.com` → IP VPS. Firewall: [nftables](/blog/nftables-firewall-vps/) — 80, 443. Email alerts — [Postfix](/blog/postfix-dovecot-pochta-vps/).

---

## Docker Compose (production)

```yaml
services:
  audiobookshelf:
    image: ghcr.io/advplyr/audiobookshelf:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:13378:80"
    volumes:
      - ./audiobooks:/audiobooks
      - ./podcasts:/podcasts
      - ./config:/config
    environment:
      TZ: Europe/Moscow
```

Первый запуск: `docker compose up -d`, затем `https://audio.example.com`.

---

## Nginx reverse proxy

```nginx
server {
    listen 443 ssl http2;
    server_name audio.example.com;
    ssl_certificate /etc/letsencrypt/live/audio.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/audio.example.com/privkey.pem;
    client_max_body_size 100M;
    location / {
        proxy_pass http://127.0.0.1:13378;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

SSL: [Let's Encrypt certbot](/blog/ssl-letsencrypt-vps/). Альтернатива — [Caddy](/blog/nginx-ili-caddy/) с auto-HTTPS.

---

## Первоначальная настройка Audiobookshelf

1. `docker compose up -d`
2. Откройте https://audio.example.com
3. Создайте admin account
4. Configure core settings
5. Import/migrate existing data
6. Test core workflow

---

## Ключевые возможности Audiobookshelf

| Функция | Описание |
| --- | --- |
| Core feature 1 | Primary Audiobookshelf capability |
| Core feature 2 | Secondary workflow |
| Core feature 3 | Integration ready |

Полный контроль над аудиокниг на VPS.

---

## Расширенная конфигурация

| Параметр | Рекомендация |
| --- | --- |
| Memory | 2+ GB для production |
| Storage | SSD, monitor growth |
| Networking | [Tailscale](/blog/tailscale-vpn-vps/) for admin |

Документируйте конфиг в [Gitea](/blog/gitea-git-server-vps/).

---

## Интеграции и workflows

| Интеграция | Применение |
| --- | --- |
| [n8n](/blog/n8n-self-hosted/) | Automation |
| [Gitea](/blog/gitea-git-server-vps/) | GitOps deploy |
| [Authentik](/blog/authentik-sso-vps/) | SSO login |

Единый VPS stack с [Docker Compose](/blog/docker-compose-vps/).

---

## API и автоматизация

```bash
curl -s https://audio.example.com/api/health
```

Связки:
- **[n8n](/blog/n8n-self-hosted/)** — webhook automation
- **[Gitea](/blog/gitea-git-server-vps/)** — CI/CD deploy hooks
- **[Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)** — health checks

---

## SSO и аутентификация

| Шаг | Действие |
| --- | --- |
| 1 | [Authentik](/blog/authentik-sso-vps/) → OAuth2/OIDC provider |
| 2 | Configure OIDC client ID/secret в env |
| 3 | Redirect URI: https://audio.example.com/oauth/callback |
| 4 | Disable public registration |

Альтернатива — [Tailscale](/blog/tailscale-vpn-vps/) mesh-only access без публичного exposure.

---

## Backup и disaster recovery

| Что бэкапить | Как | Частота |
| --- | --- | --- |
| audiobookshelf data volume | tar/rsync | Daily |
| Database dump | pg_dump / mysqldump | Daily |
| docker-compose.yml + .env | git secret repo | On change |

```bash
#!/bin/bash
docker compose exec -T db pg_dump -U audiobookshelf audiobookshelf > /backup/audiobookshelf-$(date +%F).sql
tar czf /backup/audiobookshelf-data-$(date +%F).tar.gz ./data
```

Стратегия [3-2-1](/blog/backup-vps-3-2-1/): local + [Restic offsite](/blog/restic-backup-vps/). Тест restore на staging VPS раз в квартал.

---

## Security hardening

| Пункт | Реализация |
| --- | --- |
| HTTPS only | Nginx redirect 80→443 |
| Strong auth | OIDC / local admin |
| Rate limiting | Nginx `limit_req` |
| [CrowdSec](/blog/crowdsec-zashchita-vps/) | Bouncer на Nginx |
| Updates | `docker compose pull` monthly |
| [Tailscale](/blog/tailscale-vpn-vps/) | Private admin access |

Не публикуйте Audiobookshelf без аутентификации в production.

---

## Мониторинг

- **Uptime** — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) ping `https://audio.example.com`
- **Logs** — `docker compose logs -f audiobookshelf`
- **Disk** — alert при 80% usage
- **DB** — connection pool, slow queries
- **[ntfy](/blog/ntfy-push-vps/)** — push alerts on downtime

---

## Performance tuning

- Upgrade RAM при OOM или slow response
- PostgreSQL tuning: `shared_buffers`, `work_mem`
- Nginx gzip + cache static assets
- Redis cache layer если поддерживается
- Horizontal scale — второй VPS + load balancer (advanced)

---

## Миграция с SaaS-альтернатив

| Источник | Метод |
| --- | --- |
| Cloud SaaS | Export data → import в Audiobookshelf |
| Self-hosted legacy | Docker volume migration |
| Manual | API bulk import scripts |

Планируйте downtime window и verify data integrity после миграции.

---

## Интеграция с экосистемой

| Сервис | Связка |
| --- | --- |
| [Docker Compose](/blog/docker-compose-vps/) | Unified VPS stack |
| [Authentik](/blog/authentik-sso-vps/) | SSO для всех сервисов |
| [Immich](/blog/immich-foto-bekap-vps/) | Media complement |
| [Gitea](/blog/gitea-git-server-vps/) | Git + CI integration |
| [CrowdSec](/blog/crowdsec-zashchita-vps/) | Shared security layer |

Единый [VPS](/blog/choose-vps/) — Audiobookshelf + [Nginx](/blog/nginx-ili-caddy/) + [SSL](/blog/ssl-letsencrypt-vps/) + [backup](/blog/backup-vps-3-2-1/).

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| 502 Bad Gateway | Container down, `docker compose ps` |
| 413 Entity Too Large | Nginx `client_max_body_size` |
| DB connection error | Check credentials, healthcheck |
| Login loop | X-Forwarded-Proto header |
| SSO redirect fail | OIDC redirect URI exact match |
| Slow performance | Upgrade RAM, check DB indexes |
| SSL certificate error | [Certbot renew](/blog/ssl-letsencrypt-vps/) |
| OOM killed | Increase RAM or reduce workers |
| Import fails | Check file encoding UTF-8 |
| API 401/403 | Token scope, CORS settings |

---

## Связка с экосистемой Storm

- Reverse proxy — [Nginx vs Caddy](/blog/nginx-ili-caddy/)
- SSO — [Authentik](/blog/authentik-sso-vps/)
- Защита — [CrowdSec](/blog/crowdsec-zashchita-vps/)
- VPN — [Tailscale](/blog/tailscale-vpn-vps/)
- Docker — [Docker Compose patterns](/blog/docker-compose-vps/)
- Backup — [3-2-1 rule](/blog/backup-vps-3-2-1/)

---

## Итог

Audiobookshelf на VPS — production-ready self-hosted решение для аудиокниг. Setup за день, полный контроль данных.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/). Security — [CrowdSec](/blog/crowdsec-zashchita-vps/).
