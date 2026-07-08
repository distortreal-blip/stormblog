---
title: "Immich на VPS: self-hosted бэкап фото как Google Photos"
description: "Immich на VPS: Docker Compose, ML face recognition, mobile backup, PostgreSQL + Redis. Приватное облако для семейных фото."
pubDate: 2026-07-08
category: DevOps
keywords:
  - "Immich VPS"
  - "Google Photos alternative"
  - "self-hosted photos"
  - "backup фото"
  - "Immich Docker"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Immich — open-source Google Photos: auto-upload с телефона, timeline, albums, face/search ML. VPS 4 GB + большой диск: official docker-compose, PostgreSQL, Redis, [SSL](/blog/ssl-letsencrypt-vps/).

Фото семьи не должны уезжать в чужое облако. Immich на [вашем VPS](/blog/choose-vps/) + backup [3-2-1](/blog/backup-vps-3-2-1/) = privacy + control.

---

## Immich vs Nextcloud Photos vs Google Photos

| | Immich | Nextcloud | Google Photos |
| --- | --- | --- | --- |
| Mobile UX | Отличный | Средний | Эталон |
| ML search | Да (local) | Plugins | Cloud AI |
| Self-hosted | Да | Да | Нет |
| RAM | 4 GB+ | 2 GB+ | N/A |

Для файлов — [Nextcloud](/blog/nextcloud-oblako-vps/). Для фото-first UX — Immich.

---

## Требования

| | Минимум | Комфорт |
| --- | --- | --- |
| RAM | 4 GB | 8 GB (ML) |
| Disk | 100 GB | 1 TB+ |
| CPU | 2 vCPU | 4 vCPU (face recognition) |
| Uplink | 10 Mbps+ | 100 Mbps для initial sync |

ML container (machine learning) — самый прожорливый. На 4 GB отключите optional models или limit workers.

---

## Установка (official compose)

```bash
mkdir immich && cd immich
wget -O docker-compose.yml https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
wget -O .env https://github.com/immich-app/immich/releases/latest/download/example.env
# Отредактируйте UPLOAD_LOCATION, DB_PASSWORD, IMMICH_VERSION
docker compose up -d
```

Порт `2283` — за [Nginx](/blog/nginx-ili-caddy/) + HTTPS `photos.example.com`.

---

## .env ключевые параметры

```env
UPLOAD_LOCATION=./library
DB_DATA_LOCATION=./postgres
IMMICH_VERSION=release
DB_PASSWORD=long_random_password
```

`UPLOAD_LOCATION` на отдельном volume — легче расширять диск.

---

## Reverse proxy

```nginx
location / {
  proxy_pass http://127.0.0.1:2283;
  proxy_set_header Host \$host;
  client_max_body_size 50000M;
  proxy_request_buffering off;
}
```

Большие video upload — нужен `client_max_body_size` и timeout 3600s.

---

## Mobile backup

1. App Store / F-Droid → Immich
2. Server URL: `https://photos.example.com`
3. Enable background backup (WiFi only recommended)
4. Select albums / entire gallery

Первый sync 50 GB — часы/days. Планируйте uplink и disk.

---

## ML и face recognition

Immich microservices:

- `immich-machine-learning` — CLIP, face detection
- Первый import — длительная индексация

На слабом VPS:

```env
# .env — reduce load
MACHINE_LEARNING_ENABLED=true
# или временно false до upgrade RAM
```

---

## Multi-user семья

Admin создаёт users для членов семьи. Shared albums для events. External library — optional read-only folders.

SSO — [Authentik OIDC](/blog/authentik-sso-vps/) (advanced).

---

## Бэкапы (критично!)

Фото — irreplaceable data.

```bash
# Stop для consistent backup (или use pg_dump online)
docker compose stop
tar czf immich-library-$(date +%F).tar.gz ./library
docker compose exec database pg_dump -U postgres immich > immich-db.sql
docker compose start
```

Offsite:

- [Restic](/blog/restic-backup-vps/) → S3/[MinIO](/blog/minio-s3-na-vps/)
- Second VPS geo-redundant
- External HDD monthly

Тест restore: поднять Immich на staging VPS из backup.

---

## Мониторинг

- Disk: `df -h` alert 80%
- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)
- `docker compose ps` — all healthy
- Logs: `docker compose logs -f immich-server`

---

## Hardening

- HTTPS only, HSTS
- Strong passwords, 2FA when available
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/)
- Admin UI не в open internet без VPN ([Tailscale](/blog/tailscale-vpn-vps/)) — optional paranoia mode
- Regular updates: `docker compose pull && up -d`

---

## Типичные проблемы

| Проблема | Fix |
| --- | --- |
| Upload stuck | proxy buffer off, body size |
| ML OOM | More RAM or disable ML |
| Duplicate photos | Immich dedup settings |
| Slow timeline | DB index, SSD disk |
| App can't connect | SSL cert, trusted URL |

Community: GitHub immich-app/discussions.

---

## Стоимость vs iCloud

iCloud 2 TB ~€10/мес. VPS 4 GB + 500 GB disk — фиксированно, unlimited users. Окупается для семьи 3+ человек.

---

## Связка с экосистемой

- Документы — [Nextcloud](/blog/nextcloud-oblako-vps/)
- Видео фильмы — [Jellyfin](/blog/jellyfin-media-server-vps/)
- Wiki — [BookStack](/blog/bookstack-wiki-vps/)
- SSO — [Authentik](/blog/authentik-sso-vps/)

---

## Итог

Immich на VPS — лучший self-hosted Google Photos в 2026. Docker official stack, mobile backup, ML search, strict backup discipline.

VPS 4 GB+ — [StormNet Cloud](https://stormnetcloud.com/). Storage strategy — [Restic](/blog/restic-backup-vps/) + [правило 3-2-1](/blog/backup-vps-3-2-1/).
