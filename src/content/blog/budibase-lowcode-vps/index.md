---
title: "Budibase на VPS: low-code платформа для internal apps"
description: "Budibase на VPS: Docker, visual builder, databases, automations, Nginx, SSL и бэкапы. Internal tools без Retool pricing."
pubDate: 2026-07-08
category: DevOps
keywords:
  - "Budibase VPS"
  - "low-code platform"
  - "internal tools"
  - "Retool alternative"
  - "Storm Cloud"
heroImage: ./cover.webp
imageAlt: "Budibase — self-hosted low-code платформа на VPS для внутренних приложений и дашбордов"
---

**Краткий ответ:** Budibase — low-code builder для internal apps, forms, dashboards. На VPS 2 GB+: [Docker Compose](/blog/docker-compose-vps/) + [SSL](/blog/ssl-letsencrypt-vps/).

Retool — $10+/user, Appsmith — competitor. Budibase на [вашем VPS](/blog/choose-vps/) — unlimited apps, self-hosted data.

---

## Budibase vs Retool vs Appsmith vs Tooljet

| Критерий | Budibase | SaaS Leader | Alternative OSS | Enterprise |
| --- | --- | --- | --- | --- |
| Self-hosted | Да | Нет | Да | Нет |
| Цена | Free (VPS) | $10+/user | Free | $$$ |
| RAM на VPS | 1–4 GB | N/A | 1 GB | N/A |
| API | REST | Pro | REST | Pro |
| Приватность | Полная | Cloud | Полная | Vendor |

Budibase — оптимальный self-hosted выбор для low-code приложений на VPS.

---

## Архитектура production stack

```
Users / Agents
        ↓ HTTPS
   Nginx + Let's Encrypt
        ↓
   Budibase container (port 10000)
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

Budibase на [Docker Compose](/blog/docker-compose-vps/) — предсказуемое потребление ресурсов. Bottleneck чаще диск при media-heavy workloads.

---

## Подготовка VPS

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin nginx certbot
sudo usermod -aG docker $USER
```

DNS: `A` запись `apps.example.com` → IP VPS. Firewall: [nftables](/blog/nftables-firewall-vps/) — 80, 443. Email alerts — [Postfix](/blog/postfix-dovecot-pochta-vps/).

---

## Docker Compose (production)

```yaml
services:
  budibase:
    image: budibase/budibase:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:10000:80"
    environment:
      JWT_SECRET: CHANGE_ME_RANDOM
      MINIO_URL: http://minio:9000
    volumes:
      - ./data:/data
```

Первый запуск: `docker compose up -d`, затем `https://apps.example.com`.

---

## Nginx reverse proxy

```nginx
server {
    listen 443 ssl http2;
    server_name apps.example.com;
    ssl_certificate /etc/letsencrypt/live/apps.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apps.example.com/privkey.pem;
    client_max_body_size 100M;
    location / {
        proxy_pass http://127.0.0.1:10000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

SSL: [Let's Encrypt certbot](/blog/ssl-letsencrypt-vps/). Альтернатива — [Caddy](/blog/nginx-ili-caddy/) с auto-HTTPS.

---

## Первоначальная настройка Budibase

1. `docker compose up -d`
2. Откройте https://apps.example.com
3. Создайте admin account
4. Configure core settings
5. Import/migrate existing data
6. Test core workflow

---

## Ключевые возможности Budibase

| Функция | Описание |
| --- | --- |
| Core feature 1 | Primary Budibase capability |
| Core feature 2 | Secondary workflow |
| Core feature 3 | Integration ready |

Полный контроль над low-code приложений на VPS.

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
curl -s https://apps.example.com/api/health
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
| 3 | Redirect URI: https://apps.example.com/oauth/callback |
| 4 | Disable public registration |

Альтернатива — [Tailscale](/blog/tailscale-vpn-vps/) mesh-only access без публичного exposure.

---

## Backup и disaster recovery

| Что бэкапить | Как | Частота |
| --- | --- | --- |
| budibase data volume | tar/rsync | Daily |
| Database dump | pg_dump / mysqldump | Daily |
| docker-compose.yml + .env | git secret repo | On change |

```bash
#!/bin/bash
docker compose exec -T db pg_dump -U budibase budibase > /backup/budibase-$(date +%F).sql
tar czf /backup/budibase-data-$(date +%F).tar.gz ./data
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

Не публикуйте Budibase без аутентификации в production.

---

## Мониторинг

- **Uptime** — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) ping `https://apps.example.com`
- **Logs** — `docker compose logs -f budibase`
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
| Cloud SaaS | Export data → import в Budibase |
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

Единый [VPS](/blog/choose-vps/) — Budibase + [Nginx](/blog/nginx-ili-caddy/) + [SSL](/blog/ssl-letsencrypt-vps/) + [backup](/blog/backup-vps-3-2-1/).

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

Budibase на VPS — production-ready self-hosted решение для low-code приложений. Setup за день, полный контроль данных.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/). Security — [CrowdSec](/blog/crowdsec-zashchita-vps/).
