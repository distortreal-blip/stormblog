---
title: "Nextcloud на VPS: своё облако для файлов и команд"
description: "Полный гайд Nextcloud на VPS: Docker, PostgreSQL, Redis, OnlyOffice, бэкапы и hardening. Self-hosted альтернатива Google Drive и Dropbox."
pubDate: 2026-07-04
category: DevOps
keywords:
  - "Nextcloud VPS"
  - "self-hosted cloud"
  - "файловое хранилище"
  - "OnlyOffice"
  - "Dropbox альтернатива"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Nextcloud — self-hosted облако: файлы, календарь, контакты, совместный доступ, OnlyOffice. На VPS 2–4 GB: Docker Compose + PostgreSQL + Redis + [SSL](/blog/ssl-letsencrypt-vps/) + регулярные [бэкапы](/blog/backup-vps-3-2-1/).

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

```
Клиенты (WebDAV, app, sync)
        ↓
   Nginx + SSL
        ↓
   Nextcloud (PHP-FPM / Apache in container)
        ↓
PostgreSQL + Redis + /data volume
```

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

```yaml
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
```

Reverse proxy — [Nginx](/blog/nginx-ili-caddy/) или [Traefik](/blog/traefik-reverse-proxy-vps/).

---

## Первоначальная настройка

1. Откройте `https://cloud.example.com`
2. Создайте admin (сильный пароль + 2FA позже)
3. **Settings → Overview** — устраните все warnings (HTTPS, memory, cron)
4. Включите **Server-side encryption** только если понимаете recovery (ключи!)

---

## Cron и background jobs

Nextcloud требует cron каждые 5 минут:

```bash
docker compose exec -u www-data app php occ background:cron
```

Crontab на хосте:

```cron
*/5 * * * * cd /opt/nextcloud && docker compose exec -T -u www-data app php occ background:cron
```

Без cron — медленный UI и «зависшие» uploads.

---

## OnlyOffice / Collabora

Редактирование docx/xlsx в браузере:

```yaml
  onlyoffice:
    image: onlyoffice/documentserver
    restart: unless-stopped
    ports:
      - "127.0.0.1:9980:80"
```

В Nextcloud: Apps → OnlyOffice → URL document server. RAM +1 GB минимум.

---

## Desktop и mobile sync

- Windows/macOS/Linux — официальный Nextcloud client
- Android/iOS — Nextcloud app
- WebDAV — `https://cloud.example.com/remote.php/dav`

Для больших файлов увеличьте лимиты Nginx:

```nginx
client_max_body_size 10G;
proxy_read_timeout 3600;
```

---

## SSO через Authentik

Если уже есть [Authentik](/blog/authentik-sso-vps/):

1. OIDC provider в Authentik
2. Nextcloud app «OpenID Connect Login»
3. Redirect URI `https://cloud.example.com/apps/user_oidc/code`

Один логин для wiki, git, cloud.

---

## Бэкапы (обязательно)

**3-2-1 правило** — [гайд](/blog/backup-vps-3-2-1/):

```bash
# PostgreSQL
docker compose exec -T db pg_dump -U nextcloud nextcloud > nc-db-$(date +%F).sql

# Data
tar czf nc-data-$(date +%F).tar.gz ./nextcloud
```

Offsite — [Restic](/blog/restic-backup-vps/) → [MinIO](/blog/minio-s3-na-vps/) или S3.

Тестируйте restore раз в квартал. Backup без restore — иллюзия.

---

## Hardening

- [nftables/UFW](/blog/nftables-firewall-vps/) — только 443 снаружи
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на Nginx auth
- Brute-force protection в Nextcloud settings
- Admin panel — IP allowlist или [Tailscale](/blog/tailscale-vpn-vps/)
- Обновления: `docker compose pull && docker compose up -d`

---

## Типичные проблемы

| Симптом | Решение |
| --- | --- |
| «Maintenance mode» | `occ maintenance:mode --off` |
| Медленный список файлов | Redis + PostgreSQL, не SQLite |
| Upload 413 | `client_max_body_size` в Nginx |
| Trusted domain error | `occ config:system:set trusted_domains` |
| High CPU | cron не работает или antivirus scan |

```bash
docker compose exec -u www-data app php occ status
docker compose exec -u www-data app php occ check
```

---

## Мониторинг

- Disk usage: `df -h`, алерт при 85%
- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — HTTP check
- [Prometheus node_exporter](/blog/grafana-prometheus-vps/) — RAM/disk
- Логи: `docker compose logs -f app`

---

## Стоимость vs SaaS

Dropbox Business 5 TB — десятки €/мес. VPS 4 GB + 200 GB NVMe — фиксированная цена, данные ваши. Окупается от ~5 активных пользователей.

VPS в EU — [StormNet Cloud](https://stormnetcloud.com/). Почасовая аренда для теста — [server-na-chas](/blog/server-na-chas/).

---

## Итог

Nextcloud на VPS — полноценное облако под вашим контролем. Docker + PostgreSQL + Redis + SSL + cron + бэкапы = production baseline. OnlyOffice и SSO — следующий уровень для команды.

Дальше: [BookStack wiki](/blog/bookstack-wiki-vps/) для доков, [Gitea](/blog/gitea-git-server-vps/) для кода, [Plausible](/blog/plausible-analytics-vps/) для метрик сайта.
