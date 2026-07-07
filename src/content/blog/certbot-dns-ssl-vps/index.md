---
title: "Certbot DNS challenge на VPS: wildcard SSL-сертификат"
description: "Let's Encrypt через DNS challenge: wildcard SSL для *.example.com, Cloudflare API, автообновление certbot. Когда HTTP challenge не подходит."
pubDate: 2026-07-12
category: DevOps
keywords:
  - "Certbot DNS"
  - "wildcard SSL"
  - "Let's Encrypt VPS"
  - "DNS challenge"
  - "Cloudflare certbot"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** DNS challenge выпускает wildcard-сертификат (`*.example.com`) без открытого HTTP на каждый поддомен. Certbot + API DNS-провайдера (Cloudflare) — TXT-запись, сертификат, cron для renew.

HTTP challenge из [базового SSL-гайда](/blog/ssl-letsencrypt-vps/) не покрывает wildcard и не работает, если backend скрыт за [Cloudflare](/blog/cloudflare-i-vps/) proxy без origin-доступа.

---

## HTTP vs DNS challenge

| | HTTP-01 | DNS-01 |
| --- | --- | --- |
| Wildcard | Нет | Да |
| Нужен порт 80 | Да | Нет |
| Автоматизация | Простая | API DNS |
| Cloudflare proxy | Сложнее | Идеально |

---

## Cloudflare + certbot

```bash
sudo apt install certbot python3-certbot-dns-cloudflare -y
```

```ini
# /root/.secrets/cloudflare.ini
dns_cloudflare_api_token = YOUR_TOKEN
```

```bash
chmod 600 /root/.secrets/cloudflare.ini
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /root/.secrets/cloudflare.ini \
  -d example.com -d '*.example.com'
```

---

## Автообновление

```bash
sudo certbot renew --dry-run
```

Certbot добавляет systemd timer. После renew — reload [Nginx](/blog/nginx-ili-caddy/) или [Traefik](/blog/traefik-reverse-proxy-vps/):

```bash
# /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
#!/bin/bash
systemctl reload nginx
```

---

## Несколько сервисов на поддоменах

Wildcard покрывает `api.example.com`, `app.example.com`, `s3.example.com` — один cert для [MinIO](/blog/minio-s3-na-vps/), API и админки.

---

## Безопасность API token

- Только DNS Edit для нужной zone
- Не коммитьте credentials
- Храните на VPS chmod 600

---

## Итог

DNS challenge — must-have для wildcard и Cloudflare-full setup. Один раз настроили API — certbot обновляет автоматически.

VPS + домен — [StormNet Cloud](https://stormnetcloud.com/). Базовый SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/).
