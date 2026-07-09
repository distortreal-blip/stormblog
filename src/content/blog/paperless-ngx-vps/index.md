---
title: "Paperless-ngx на VPS: OCR-архив документов, счетов и договоров"
description: "Paperless-ngx на VPS: Docker, PostgreSQL, Redis, Tika, Gotenberg, OCR, теги, full-text search и бэкапы. Self-hosted DMS для семьи и малого бизнеса."
pubDate: 2026-07-05
category: DevOps
keywords:
  - "Paperless-ngx VPS"
  - "OCR documents"
  - "DMS self-hosted"
  - "document archive"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Paperless-ngx — система управления документами с OCR, full-text search и auto-tagging. На VPS 2 GB+: Docker stack (PostgreSQL + Redis + Tika + Gotenberg) + [Nginx SSL](/blog/ssl-letsencrypt-vps/) + [backup](/blog/backup-vps-3-2-1/) media volume.

Счета в email, договоры в Downloads, сканы на полке — хаос. Paperless-ngx на [вашем VPS](/blog/choose-vps/) — загрузил PDF/photo → OCR → поиск по тексту → теги, correspondents, ASN. Альтернатива Evernote и Google Drive для документов.

---

## Paperless-ngx vs Nextcloud Files vs Teedy vs Mayan EDMS

| Критерий | Paperless-ngx | [Nextcloud](/blog/nextcloud-oblako-vps/) | Teedy | Mayan EDMS |
| --- | --- | --- | --- | --- |
| OCR focus | Excellent | Plugin | Basic | Good |
| Auto consume | Email, folder, API | Manual mostly | Folder | Watch folders |
| RAM | 2 GB | 2–4 GB | 512 MB | 4 GB+ |
| UI simplicity | Clean | Full cloud suite | Minimal | Complex |
| Mobile app | Community | Official | Limited | Web |
| Full-text search | PostgreSQL FTS | Elasticsearch optional | Basic | Good |

Paperless-ngx — best for «scan everything and find by content».

---

## Архитектура

```
Scanner / Email / Mobile upload
        ↓ HTTPS
   Nginx reverse proxy
        ↓
   Paperless-ngx (Django)
        ↓
   PostgreSQL (metadata + FTS index)
        ↓
   Redis (Celery task queue)
        ↓
   Apache Tika (document parsing)
        ↓
   Gotenberg (office → PDF conversion)
        ↓
   /usr/src/paperless/media (originals + thumbnails)
```

OCR: Tesseract внутри paperless container. Языки: `PAPERLESS_OCR_LANGUAGE=rus+eng`.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Семья, 5k documents | 2 GB | 2 vCPU | 30 GB |
| Малый бизнес 20k docs | 4 GB | 2 vCPU | 100 GB |
| Heavy OCR batch import | 4–8 GB | 4 vCPU | 200 GB SSD |

OCR CPU-intensive — batch import ночью. SSD critical для PostgreSQL FTS.

---

## Docker Compose (full stack)

```yaml
services:
  broker:
    image: docker.io/library/redis:7
    restart: unless-stopped
    volumes:
      - redisdata:/data

  db:
    image: docker.io/library/postgres:16
    restart: unless-stopped
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: paperless
      POSTGRES_USER: paperless
      POSTGRES_PASSWORD: CHANGE_ME

  webserver:
    image: ghcr.io/paperless-ngx/paperless-ngx:latest
    restart: unless-stopped
    depends_on:
      - db
      - broker
      - gotenberg
      - tika
    ports:
      - "127.0.0.1:8000:8000"
    volumes:
      - data:/usr/src/paperless/data
      - media:/usr/src/paperless/media
      - ./export:/usr/src/paperless/export
      - ./consume:/usr/src/paperless/consume
    environment:
      PAPERLESS_REDIS: redis://broker:6379
      PAPERLESS_DBHOST: db
      PAPERLESS_DBUSER: paperless
      PAPERLESS_DBPASS: CHANGE_ME
      PAPERLESS_SECRET_KEY: CHANGE_ME_LONG
      PAPERLESS_URL: https://docs.example.com
      PAPERLESS_OCR_LANGUAGE: rus+eng
      PAPERLESS_TIME_ZONE: Europe/Moscow
      PAPERLESS_ADMIN_USER: admin
      PAPERLESS_ADMIN_PASSWORD: CHANGE_ME
      PAPERLESS_TIKA_ENABLED: 1
      PAPERLESS_TIKA_GOTENBERG_ENDPOINT: http://gotenberg:3000
      PAPERLESS_TIKA_ENDPOINT: http://tika:9998

  gotenberg:
    image: docker.io/gotenberg/gotenberg:8
    restart: unless-stopped
    command:
      - "gotenberg"
      - "--chromium-disable-javascript=true"

  tika:
    image: docker.io/apache/tika:latest
    restart: unless-stopped

volumes:
  data:
  media:
  pgdata:
  redisdata:
```

---

## Nginx reverse proxy

```nginx
server {
    listen 443 ssl http2;
    server_name docs.example.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

SSL — [certbot](/blog/ssl-letsencrypt-vps/). Большие PDF — увеличьте `client_max_body_size`.

---

## Consumption: как загружать документы

| Метод | Настройка |
| --- | --- |
| Web UI | Drag & drop |
| Consume folder | Copy to `./consume/` — auto-watch |
| Email | IMAP fetch в PAPERLESS_EMAIL_* env |
| Mobile | Paperless-ngx mobile apps (third-party) |
| API | REST для [n8n](/blog/n8n-self-hosted/) automation |

**Email workflow:** счета на `invoices@example.com` → IMAP → auto-tag «invoice» + correspondent.

---

## Организация: tags, correspondents, document types

| Сущность | Пример |
| --- | --- |
| Tags | `tax`, `2025`, `medical`, `contract` |
| Correspondents | «Ростелеком», «Банк», «Клиент X» |
| Document types | Invoice, Contract, Receipt, ID |
| Storage path | `{created_year}/{correspondent}/` |
| ASN | Auto-increment ID на коробке архива |

**Matching rules** — auto-assign tags/correspondents по OCR content regex.

---

## OCR и языки

```yaml
PAPERLESS_OCR_LANGUAGE: rus+eng
PAPERLESS_OCR_MODE: skip_noarchive  # skip already searchable PDFs
PAPERLESS_OCR_CLEAN: clean
PAPERLESS_OCR_DESKEW: true
```

Установка tesseract langs в container — обычно pre-installed rus+eng. Для украинского: `ukr` в language string.

---

## Full-text search

PostgreSQL FTS — мгновенный поиск по OCR text. Tips:
- Используйте `+word` для required terms
- `correspondent:"Bank Name"` — field search
- Saved views — filter combinations as virtual folders

Reindex: `docker compose exec webserver document_index reindex` при проблемах.

---

## Multi-user и права

Paperless supports multiple users с object-level permissions. Для SSO — proxy auth header или OAuth2 proxy перед [Authentik](/blog/authentik-sso-vps/).

Family setup: один admin + read-only users для просмотра.

---

## Backup (критично!)

| Компонент | Метод |
| --- | --- |
| PostgreSQL | `pg_dump` daily |
| media volume | tar/rsync — originals + thumbnails |
| data volume | config, index snippets |

```bash
# Built-in exporter
docker compose exec webserver document_exporter ../export --zip
```

Стратегия [3-2-1](/blog/backup-vps-3-2-1/): local + [Restic](/blog/restic-backup-vps/) offsite. Media volume растёт — monitor disk.

---

## Security

| Пункт | Действие |
| --- | --- |
| HTTPS | Обязательно — документы sensitive |
| Strong admin password | 20+ chars |
| [Tailscale](/blog/tailscale-vpn-vps/) | Private access preferred |
| Firewall | [nftables](/blog/nftables-firewall-vps/) |
| 2FA | Via Authentik forward auth |
| Export encryption | ZIP password for offsite backup |

Документы = налоги, медицина, договоры. Treat as highly confidential.

---

## Performance tuning

- `PAPERLESS_TASK_WORKERS: 2` — parallel OCR (more CPU)
- Batch import overnight — `docker compose exec` throttle
- PostgreSQL [tuning](/blog/postgresql-tuning-vps/) — `shared_buffers` 25% RAM
- SSD only — HDD unusable for FTS at scale

---

## Мониторинг

- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — web UI ping
- Celery queue — Admin → Tasks, failed OCR jobs
- Disk alerts — media growth
- [Netdata](/blog/netdata-monitoring-vps/) — CPU spikes during OCR

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| OCR пустой | Wrong language pack, low quality scan |
| Consume not picking files | File permissions, watch folder path |
| Email fetch fail | IMAP creds, app password, TLS |
| 502 timeout on upload | Increase nginx timeout, client_max_body_size |
| Duplicate documents | Matching rules too broad |
| Slow search | Reindex, PostgreSQL vacuum |
| Gotenberg fail | Office formats — check gotenberg logs |
| Tika OOM | Upgrade RAM, reduce concurrent tasks |
| Thumbnail missing | Re-process document in UI |
| Permission denied | User roles, object permissions |

---

## Связка с экосистемой

- Облако файлов — [Nextcloud](/blog/nextcloud-oblako-vps/) (complementary)
- Email — [Postfix](/blog/postfix-dovecot-pochta-vps/)
- Automation — [n8n](/blog/n8n-self-hosted/)
- Backup — [Restic](/blog/restic-backup-vps/)
- SSO — [Authentik](/blog/authentik-sso-vps/)

---

## Итог

Paperless-ngx — killer app для paperless office. OCR + search превращает хаос сканов в searchable archive. 2 GB VPS достаточно для семьи.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Backup — [3-2-1](/blog/backup-vps-3-2-1/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/).
