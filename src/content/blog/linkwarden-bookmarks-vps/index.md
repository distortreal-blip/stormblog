---
title: "Linkwarden на VPS: self-hosted менеджер закладок без Pocket"
description: "Linkwarden на VPS: Docker, PostgreSQL, архивация страниц, теги, Nginx, SSL и бэкапы. Приватные закладки с полным контролем данных."
pubDate: 2026-07-02
category: DevOps
keywords:
  - "Linkwarden VPS"
  - "bookmarks self-hosted"
  - "Pocket alternative"
  - "link archive"
  - "Storm Cloud"
heroImage: ./cover.webp
imageAlt: "Linkwarden — self-hosted менеджер закладок на VPS с архивацией веб-страниц"
---

**Краткий ответ:** Linkwarden — open-source менеджер закладок с архивацией страниц, тегами и коллекциями. На VPS 1 GB+: [Docker Compose](/blog/docker-compose-vps/) + PostgreSQL + [Nginx SSL](/blog/ssl-letsencrypt-vps/) + [backup](/blog/backup-vps-3-2-1/). Альтернатива Pocket без Mozilla cloud.

Pocket — закрытый код, данные у Mozilla, платный premium. Raindrop — подписка. Linkwarden на [вашем VPS](/blog/choose-vps/) — закладки, full-page archive, поиск, sharing collections. Интеграция с [Authentik](/blog/authentik-sso-vps/) и [Tailscale](/blog/tailscale-vpn-vps/).

---

## Linkwarden vs Pocket vs Raindrop vs Shaarli

| Критерий | Linkwarden | Pocket | Raindrop | Shaarli |
| --- | --- | --- | --- | --- |
| Self-hosted | Да | Нет | Нет | Да |
| Цена | Free (VPS) | Freemium | $28/год | Free |
| RAM на VPS | 1–4 GB | N/A | N/A | 256 MB |
| API | REST | Pro | Pro | Basic |
| Приватность | Полная | Mozilla | Cloud | Полная |

Linkwarden — оптимальный self-hosted выбор для закладок на VPS.

---

## Архитектура production stack

```
Browser extension / Web UI
        ↓ HTTPS
   Nginx reverse proxy + Let's Encrypt
        ↓
   Linkwarden (Next.js, port 3000)
        ↓
   PostgreSQL (bookmarks, archives)
        ↓
   /data/archives (saved pages, screenshots)
```

Опционально: [Authentik](/blog/authentik-sso-vps/) SSO, [CrowdSec](/blog/crowdsec-zashchita-vps/) WAF, [Tailscale](/blog/tailscale-vpn-vps/) private access.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Личное использование | 1 GB | 1 vCPU | 10 GB SSD |
| Команда / small org | 2 GB | 2 vCPU | 20 GB SSD |
| Production + HA | 4 GB | 2 vCPU | 40 GB SSD |

Linkwarden на [Docker Compose](/blog/docker-compose-vps/) — предсказуемое потребление ресурсов. Bottleneck чаще диск при media-heavy workloads.

---

## Подготовка VPS

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin nginx certbot
sudo usermod -aG docker $USER
```

DNS: `A` запись `links.example.com` → IP VPS. Firewall: [nftables](/blog/nftables-firewall-vps/) — 80, 443. Email alerts — [Postfix](/blog/postfix-dovecot-pochta-vps/).

---

## Docker Compose (production)

```yaml
services:
  linkwarden:
    image: linkwarden/linkwarden:latest
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      NEXTAUTH_URL: https://links.example.com
      NEXTAUTH_SECRET: CHANGE_ME_RANDOM_32_CHARS
      DATABASE_URL: postgresql://linkwarden:CHANGE_ME@db:5432/linkwarden
    volumes:
      - ./data:/data/data
    ports:
      - "127.0.0.1:3000:3000"
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: linkwarden
      POSTGRES_USER: linkwarden
      POSTGRES_PASSWORD: CHANGE_ME
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U linkwarden"]
      interval: 10s
      retries: 5
volumes:
  pgdata:
```

Первый запуск: `docker compose up -d`, затем `https://links.example.com`.

---

## Nginx reverse proxy

```nginx
server {
    listen 443 ssl http2;
    server_name links.example.com;
    ssl_certificate /etc/letsencrypt/live/links.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/links.example.com/privkey.pem;
    client_max_body_size 100M;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

SSL: [Let's Encrypt certbot](/blog/ssl-letsencrypt-vps/). Альтернатива — [Caddy](/blog/nginx-ili-caddy/) с auto-HTTPS.

---

## Первоначальная настройка Linkwarden

1. `docker compose up -d` → откройте https://links.example.com
2. Создайте admin account
3. **Settings** — включите archive pages (screenshot + HTML)
4. Установите browser extension (Chrome/Firefox)
5. Создайте коллекции: Work, DevOps, Reading
6. Import из Pocket OPML/CSV

---

## Архивация и коллекции

| Функция | Описание |
| --- | --- |
| Full-page archive | HTML + screenshot каждой ссылки |
| Collections | Папки и shared links |
| Tags | Cross-collection организация |
| Full-text search | По archived content |

Архивы переживут dead links — must-have для research.

---

## Browser extension и mobile

Extension сохраняет URL одним кликом с выбором коллекции.

| Платформа | Поддержка |
| --- | --- |
| Chrome / Edge | Official extension |
| Firefox | Official extension |
| Mobile | PWA через браузер |

PWA: Add to Home Screen на iOS/Android.

---

## Sharing и collaboration

| Режим | Применение |
| --- | --- |
| Public collection | Share reading list |
| Team access | Multi-user via SSO |
| API | Programmatic bookmark add |

SSO через [Authentik](/blog/authentik-sso-vps/) — единый login для команды.

---

## API и автоматизация

```bash
curl -X POST "https://links.example.com/api/v1/links" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","name":"Example","collectionId":1}'
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
| 3 | Redirect URI: https://links.example.com/oauth/callback |
| 4 | Disable public registration |

Альтернатива — [Tailscale](/blog/tailscale-vpn-vps/) mesh-only access без публичного exposure.

---

## Backup и disaster recovery

| Что бэкапить | Как | Частота |
| --- | --- | --- |
| linkwarden data volume | tar/rsync | Daily |
| Database dump | pg_dump / mysqldump | Daily |
| docker-compose.yml + .env | git secret repo | On change |

```bash
#!/bin/bash
docker compose exec -T db pg_dump -U linkwarden linkwarden > /backup/linkwarden-$(date +%F).sql
tar czf /backup/linkwarden-data-$(date +%F).tar.gz ./data
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

Не публикуйте Linkwarden без аутентификации в production.

---

## Мониторинг

- **Uptime** — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) ping `https://links.example.com`
- **Logs** — `docker compose logs -f linkwarden`
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
| Cloud SaaS | Export data → import в Linkwarden |
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

Единый [VPS](/blog/choose-vps/) — Linkwarden + [Nginx](/blog/nginx-ili-caddy/) + [SSL](/blog/ssl-letsencrypt-vps/) + [backup](/blog/backup-vps-3-2-1/).

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

Linkwarden на VPS — идеальный Pocket replacement с архивацией. Ваши закладки и snapshots — только на вашем сервере. Setup за вечер.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). SSO — [Authentik](/blog/authentik-sso-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/). RSS — [FreshRSS](/blog/freshrss-vps/).
