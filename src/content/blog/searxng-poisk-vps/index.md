---
title: "SearXNG на VPS: приватная метапоисковая система для команды"
description: "SearXNG на VPS: Docker, Nginx, SSL, engines, rate limit, Tor и интеграция в браузер. Self-hosted поиск без трекинга Google и без рекламы."
pubDate: 2026-07-04
category: DevOps
keywords:
  - "SearXNG VPS"
  - "private search"
  - "metasearch"
  - "Google alternative"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** SearXNG — open-source метапоисковик, агрегирующий Google, Bing, DuckDuckGo и др. без трекинга. На VPS 512 MB–1 GB: Docker + [Nginx + SSL](/blog/ssl-letsencrypt-vps/) + `settings.yml` hardening. Доступ через [Tailscale](/blog/tailscale-vpn-vps/) или public с rate limit.

Google профилирует запросы, DuckDuckGo — чужой сервер. SearXNG на [вашем VPS](/blog/choose-vps/) — ваши запросы, ваши логи (или их отсутствие), выбор engines и zero ads.

---

## SearXNG vs DuckDuckGo vs Google vs Whoogle

| Критерий | SearXNG | DuckDuckGo | Google | Whoogle |
| --- | --- | --- | --- | --- |
| Self-hosted | Да | Нет | Нет | Да |
| Metasearch | Да (many engines) | Свой index | Свой index | Google scrape |
| Tracking | Нет (ваш контроль) | Minimal | Extensive | Minimal |
| RAM | 512 MB | N/A | N/A | 256 MB |
| CAPTCHA issues | Sometimes | Rare | N/A | Often |
| Image/video search | Да | Да | Да | Limited |

SearXNG — лучший баланс приватности и качества результатов.

---

## Архитектура

```
Browser / Browser extension
        ↓ HTTPS
   Nginx reverse proxy + rate limit
        ↓
   SearXNG container (Python/uWSGI)
        ↓
   Outbound queries → Google, Bing, DDG, Wikipedia...
        ↓
   Optional: Tor proxy for sensitive queries
```

SearXNG **не хранит** user profiles. Логи — только на вашей совести (отключите в production).

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Личный use | 512 MB | 1 vCPU | 2 GB |
| Семья/команда 10 users | 1 GB | 1 vCPU | 5 GB |
| Public instance | 2 GB | 2 vCPU | 10 GB |

Outbound IP VPS важен — некоторые engines банят datacenter IP. Residential proxy — advanced workaround.

---

## Docker Compose

```yaml
services:
  searxng:
    image: searxng/searxng:latest
    restart: unless-stopped
    volumes:
      - ./searxng:/etc/searxng
    environment:
      SEARXNG_BASE_URL: https://search.example.com/
      SEARXNG_SECRET: CHANGE_ME_LONG_RANDOM
    ports:
      - "127.0.0.1:8080:8080"
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
```

Первый запуск создаст default `settings.yml` — сразу harden.

---

## settings.yml (ключевые настройки)

```yaml
use_default_settings: true

general:
  instance_name: "My Private Search"
  privacypolicy_url: false
  donation_url: false
  contact_url: false
  enable_stats: false

search:
  safe_search: 1
  autocomplete: "duckduckgo"
  default_lang: "ru-RU"
  formats:
    - html
    - json

server:
  secret_key: "CHANGE_ME"
  limiter: true
  image_proxy: true
  public_instance: false

engines:
  - name: google
    disabled: false
  - name: duckduckgo
    disabled: false
  - name: wikipedia
    disabled: false
```

`public_instance: false` — отключает публичные API. `limiter: true` — anti-abuse.

---

## Nginx + rate limiting

```nginx
limit_req_zone $binary_remote_addr zone=search:10m rate=10r/s;

server {
    listen 443 ssl http2;
    server_name search.example.com;

    limit_req zone=search burst=20 nodelay;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Script-Name /;
    }
}
```

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Для internal only — [Tailscale](/blog/tailscale-vpn-vps/) без public DNS.

---

## Доступ: public vs private

| Модель | Когда | Как |
| --- | --- | --- |
| Tailscale only | Максимальная приватность | Bind 127.0.0.1, access via mesh IP |
| Authentik forward auth | Team shared | [Authentik](/blog/authentik-sso-vps/) + Nginx auth_request |
| Public + rate limit | Family bookmark | HTTPS + strong rate limits |
| VPN wireguard | Remote team | [WireGuard](/blog/wireguard-vpn-na-vps/) |

**Не открывайте** public SearXNG без limiter — abuse для scraping и DDoS amplification.

---

## Браузерная интеграция

**Firefox:**
1. Settings → Search → Add → `https://search.example.com/search?q=%s`
2. Set as default

**Chromium / Chrome:** Manage search engines → Add custom.

**Mobile:** SearXNG PWA bookmark или Firefox Sync search settings.

**Browser extension:** Official SearXNG redirect extensions sync settings.

---

## Engines tuning

| Engine | Плюсы | Минусы |
| --- | --- | --- |
| Google | Best results | CAPTCHA on DC IP |
| Bing | Stable | Microsoft tracking at source |
| DuckDuckGo | Privacy | Rate limits |
| Brave | Independent | Newer |
| Wikipedia | Facts | Encyclopedia only |
| GitHub | Code search | Niche |

Отключите engines которые не нужны — faster response. `engines:` в settings.yml per-engine `timeout` и `disabled`.

---

## Image proxy

`server.image_proxy: true` — картинки через ваш сервер, скрывает referrer от источника. Дополнительная RAM/bandwidth на VPS. Для privacy worth it.

---

## Tor integration (advanced)

```yaml
# settings.yml outgoing proxies
outgoing:
  request_timeout: 10.0
  max_request_timeout: 15.0
  pools:
    - url: socks5h://tor:9050
```

Tor container в compose — для sensitive queries. Медленнее, но скрывает VPS IP от engines.

---

## uBlock / CAPTCHA проблемы

Google часто показывает CAPTCHA datacenter IP:

| Решение | Эффект |
| --- | --- |
| Disable Google engine | Use Bing/DDG only |
| Reduce Google weight | Less CAPTCHA frequency |
| Residential proxy | Expensive, grey area |
| Rotating engines | SearXNG fallback automatic |

---

## Backup

Бэкапить `./searxng/` folder (settings.yml, custom templates). No database.

```bash
tar czf searxng-config-$(date +%F).tar.gz ./searxng/
```

[3-2-1 backup](/blog/backup-vps-3-2-1/) — config в git (без secrets) + secret в [Vaultwarden](/blog/vaultwarden-paroli-vps/).

---

## Security checklist

| Пункт | Статус |
| --- | --- |
| SECRET_KEY random | Required |
| limiter enabled | Required for public |
| public_instance false | Unless intentional |
| HTTPS only | Required |
| No query logging | Disable in nginx access log or anonymize |
| [nftables](/blog/nftables-firewall-vps/) | 443 only if public |
| Updates | Monthly docker pull |

---

## Мониторинг

- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — search test query
- Response time — slow engines degrade UX
- Error rate in container logs — `docker compose logs searxng`

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| No results | All engines timeout — check outbound firewall |
| CAPTCHA loop | Disable Google, use Bing/DDG |
| 429 Too Many Requests | Your rate limit too strict, tune nginx |
| CSRF error | SECRET_KEY changed — clear browser cookies |
| Wrong language | default_lang in settings.yml |
| Image search broken | Enable image_proxy, check engine support |
| Slow searches | Reduce active engines count |
| 502 Bad Gateway | Container OOM — upgrade RAM |
| JSON API 403 | public_instance false — expected |
| Styles broken | SEARXNG_BASE_URL mismatch with real URL |

---

## Связка с экосистемой

- DNS для домена — [AdGuard](/blog/adguard-dns-vps/) custom DNS record
- Privacy stack — [Tailscale](/blog/tailscale-vpn-vps/) + SearXNG + [AdGuard](/blog/adguard-dns-vps/)
- Reverse proxy — [Nginx vs Caddy](/blog/nginx-ili-caddy/)
- Docker — [Docker Compose](/blog/docker-compose-vps/)
- SSO — [Authentik](/blog/authentik-sso-vps/)

---

## Итог

SearXNG — один из самых лёгких и полезных self-hosted сервисов. 512 MB RAM, десятки поисковиков, zero tracking. Идеальный companion к [AdGuard Home](/blog/adguard-dns-vps/).

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Приватный доступ — [Tailscale](/blog/tailscale-vpn-vps/).
