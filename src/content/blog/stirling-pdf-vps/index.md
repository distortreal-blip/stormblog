---
title: "Stirling PDF на VPS: self-hosted PDF-инструменты без Adobe Cloud"
description: "Stirling PDF на VPS: Docker, OCR, merge/split, подпись, Nginx, SSL и бэкапы. Полный набор PDF-операций на своём сервере без подписки Adobe."
pubDate: 2026-07-01
category: DevOps
keywords:
  - "Stirling PDF VPS"
  - "PDF tools self-hosted"
  - "OCR PDF"
  - "Adobe alternative"
  - "Storm Cloud"
heroImage: ./cover.webp
imageAlt: "Stirling PDF — self-hosted PDF-инструменты на VPS: merge, split, OCR и подпись документов"
---

**Краткий ответ:** Stirling PDF — open-source веб-приложение для работы с PDF: merge, split, OCR, конвертация, подпись. На VPS 2 GB+: [Docker Compose](/blog/docker-compose-vps/) + [Nginx + SSL](/blog/ssl-letsencrypt-vps/) + [backup](/blog/backup-vps-3-2-1/). Без Adobe Cloud и без отправки документов на чужие серверы.

Adobe Acrobat — подписка, закрытый код, документы уходят в облако. Онлайн-конвертеры — риск утечки. Stirling PDF на [вашем VPS](/blog/choose-vps/) — 50+ инструментов в браузере, данные не покидают сервер, интеграция с [Authentik](/blog/authentik-sso-vps/) и [Tailscale](/blog/tailscale-vpn-vps/).

---

## Stirling PDF vs Adobe Acrobat vs Smallpdf vs PDF24

| Критерий | Stirling PDF | Adobe Acrobat | Smallpdf | PDF24 |
| --- | --- | --- | --- | --- |
| Self-hosted | Да | Нет | Нет | Нет |
| Цена | Free (VPS cost) | $20+/мес | Freemium | Freemium |
| OCR | Tesseract | Да | Да | Да |
| RAM на VPS | 1–4 GB | N/A | N/A | N/A |
| API | REST (Pro) | Да | Pro | Нет |
| Приватность | Полная | Adobe cloud | Third-party | Ads |

Stirling PDF — лучший выбор для команд, которым нужны PDF-операции без SaaS.

---

## Архитектура production stack

```
Users / Browser
        ↓ HTTPS
   Nginx reverse proxy + Let's Encrypt
        ↓
   Stirling PDF container (Java/Spring, port 8080)
        ↓
   /configs (settings) + /logs
        ↓
   Optional: Tesseract OCR, LibreOffice (conversion)
        ↓
   Optional: [Authentik](/blog/authentik-sso-vps/) OIDC / [CrowdSec](/blog/crowdsec-zashchita-vps/)
```

Stirling PDF stateless для большинства операций — файлы обрабатываются в памяти и удаляются после сессии.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Личное использование, без OCR | 1 GB | 1 vCPU | 10 GB SSD |
| Команда 10 человек + OCR | 2 GB | 2 vCPU | 20 GB SSD |
| Heavy OCR / batch convert | 4 GB | 2 vCPU | 40 GB SSD |

OCR и конвертация через LibreOffice — CPU-intensive. Swap 2 GB рекомендуется на 1 GB VPS.

---

## Подготовка VPS

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin nginx certbot
sudo usermod -aG docker $USER
```

DNS: `A` запись `pdf.example.com` → IP VPS. Firewall: [nftables](/blog/nftables-firewall-vps/) — 80, 443. Для приватного доступа — [Tailscale](/blog/tailscale-vpn-vps/).

---

## Docker Compose (production)

```yaml
services:
  stirling-pdf:
    image: frooodle/s-pdf:latest
    restart: unless-stopped
    environment:
      DOCKER_ENABLE_SECURITY: "true"
      SECURITY_ENABLELOGIN: "true"
      SECURITY_INITIALLOGIN_USERNAME: admin
      SECURITY_INITIALLOGIN_PASSWORD: CHANGE_ME_STRONG
      SYSTEM_DEFAULTLOCALE: ru-RU
      UI_APPNAME: Stirling PDF
      UI_HOMEDESCRIPTION: Self-hosted PDF tools
      SYSTEM_MAXFILESIZE: "200"
      SYSTEM_GOOGLEVISIBILITY: "false"
    volumes:
      - ./stirling-configs:/configs
      - ./stirling-logs:/logs
      - ./stirling-customFiles:/customFiles
    ports:
      - "127.0.0.1:8080:8080"
```

Первый запуск: `docker compose up -d`, затем `https://pdf.example.com` → смените пароль admin.

---

## Nginx reverse proxy

```nginx
server {
    listen 443 ssl http2;
    server_name pdf.example.com;

    ssl_certificate /etc/letsencrypt/live/pdf.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pdf.example.com/privkey.pem;

    client_max_body_size 200M;
    proxy_read_timeout 300s;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

SSL: [Let's Encrypt certbot](/blog/ssl-letsencrypt-vps/). Альтернатива — [Caddy](/blog/nginx-ili-caddy/) с auto-HTTPS.

---

## Первоначальная настройка

1. Откройте UI → войдите admin / initial password
2. **Settings → Security** — смените пароль, включите login
3. **Settings → System** — locale ru-RU, max file size
4. **Settings → UI** — отключите ненужные tools для упрощения меню
5. **Settings → Premium** — API key если нужна автоматизация
6. Тест: загрузите PDF → merge двух файлов

---

## Основные инструменты Stirling PDF

| Категория | Инструменты |
| --- | --- |
| Organize | Merge, Split, Rotate, Remove pages |
| Convert | PDF→Word, PDF→Image, Image→PDF |
| Security | Password, Sign, Redact, Watermark |
| OCR | Tesseract OCR для сканов |
| Advanced | Compare PDFs, Repair, Compress |

Все операции в браузере — сервер не хранит файлы после обработки (по умолчанию).

---

## OCR и конвертация

OCR требует Tesseract в контейнере (включён в official image). Для русского языка:

```bash
# Проверка языков OCR в контейнере
docker compose exec stirling-pdf tesseract --list-langs
```

| Формат | Инструмент | Примечание |
| --- | --- | --- |
| Скан → searchable PDF | OCR | rus+eng languages |
| PDF → DOCX | Convert | LibreOffice backend |
| Images → PDF | Image to PDF | Batch upload |
| PDF → JPG/PNG | PDF to Image | DPI настройка |

Большие файлы — увеличьте `client_max_body_size` в Nginx и `SYSTEM_MAXFILESIZE`.

---

## API и автоматизация

```bash
# Merge PDFs via API
curl -X POST "https://pdf.example.com/api/v1/general/merge-pdfs" \
  -H "X-API-KEY: YOUR_API_KEY" \
  -F "fileInput=@doc1.pdf" \
  -F "fileInput=@doc2.pdf" \
  -o merged.pdf
```

Связки:
- **[n8n](/blog/n8n-self-hosted/)** — webhook → merge → email via [Postfix](/blog/postfix-dovecot-pochta-vps/)
- **[Paperless-ngx](/blog/paperless-ngx-vps/)** — OCR pipeline complement
- **CI/CD** — compress PDF artifacts в [Woodpecker](/blog/woodpecker-ci-vps/)

---

## SSO через Authentik

| Шаг | Действие |
| --- | --- |
| 1 | Authentik → Application → OAuth2/OIDC |
| 2 | Stirling env: OIDC client ID/secret |
| 3 | Redirect URI: https://pdf.example.com/login/oauth2/code/oidc |
| 4 | Disable local registration |

Гайд: [Authentik SSO на VPS](/blog/authentik-sso-vps/). Альтернатива — Nginx `auth_request` proxy.

---

## Backup и disaster recovery

| Что бэкапить | Как | Частота |
| --- | --- | --- |
| stirling-configs | tar/rsync | Daily |
| stirling-customFiles | tar/rsync | Weekly |
| docker-compose.yml + .env | git | On change |

```bash
#!/bin/bash
tar czf /backup/stirling-$(date +%F).tar.gz ./stirling-configs ./stirling-customFiles
```

Стратегия [3-2-1](/blog/backup-vps-3-2-1/): local + [Restic offsite](/blog/restic-backup-vps/). PDF-файлы пользователей не хранятся — бэкап только конфигов.

---

## Security hardening

| Пункт | Реализация |
| --- | --- |
| HTTPS only | Nginx redirect 80→443 |
| Login required | SECURITY_ENABLELOGIN=true |
| Rate limiting | Nginx `limit_req` на /api/ |
| [CrowdSec](/blog/crowdsec-zashchita-vps/) | Bouncer на Nginx |
| Updates | `docker compose pull && up -d` monthly |
| Private access | [Tailscale](/blog/tailscale-vpn-vps/) only |

Не публикуйте Stirling PDF без аутентификации — upload endpoint = attack surface.

---

## Мониторинг

- **Uptime** — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) ping homepage
- **Logs** — `docker compose logs -f stirling-pdf`
- **Disk** — configs/logs growth, alert 80%
- **CPU** — OCR spikes, consider queue via [n8n](/blog/n8n-self-hosted/)

---

## Performance tuning

- Увеличьте RAM до 4 GB для batch OCR 50+ страниц
- `proxy_read_timeout 600s` для больших merge операций
- Отключите неиспользуемые tools в UI settings — меньше memory footprint
- JVM heap: `JAVA_OPTS=-Xmx2g` в environment при OOM
- CDN не нужен — dynamic processing, только static assets cache

---

## Интеграция с документооборотом

| Сервис | Связка |
| --- | --- |
| [Paperless-ngx](/blog/paperless-ngx-vps/) | OCR complement, archive |
| [Nextcloud](/blog/nextcloud-oblako-vps/) | Share PDF → Stirling process |
| [Gitea](/blog/gitea-git-server-vps/) | CI compress release PDFs |
| [Immich](/blog/immich-foto-bekap-vps/) | Photo→PDF albums |

Единый VPS stack: документы, PDF tools, бэкапы — [Docker Compose](/blog/docker-compose-vps/).

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| 502 Bad Gateway | Container down, check `docker compose ps` |
| 413 Request Entity Too Large | Nginx `client_max_body_size` + Stirling MAXFILESIZE |
| OCR пустой текст | Установите rus language pack, DPI скана 300+ |
| OOM kill при merge | Upgrade RAM, JAVA_OPTS -Xmx |
| Login loop | Cookie secure flag, check X-Forwarded-Proto |
| Slow conversion | LibreOffice cold start, pre-warm container |
| API 401 | X-API-KEY header, enable in settings |
| SSO redirect error | OIDC redirect URI exact match |
| Tesseract not found | Re-pull latest image, check container logs |
| Timeout on large PDF | Increase proxy_read_timeout to 600s |

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

Stirling PDF на VPS — must-have для команд с регулярной работой с PDF. Без подписки Adobe, без утечки документов, 50+ tools в браузере. Setup за час.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). SSO — [Authentik](/blog/authentik-sso-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/). Документы — [Paperless-ngx](/blog/paperless-ngx-vps/).
