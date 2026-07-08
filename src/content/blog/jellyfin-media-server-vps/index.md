---
title: "Jellyfin на VPS: медиасервер для фильмов и сериалов"
description: "Jellyfin media server на VPS: Docker, hardware transcoding, reverse proxy, SSL. Бесплатная альтернатива Plex без подписок."
pubDate: 2026-07-06
category: DevOps
keywords:
  - "Jellyfin VPS"
  - "media server"
  - "Plex альтернатива"
  - "streaming VPS"
  - "self-hosted video"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Jellyfin — open-source медиасервер без paywall. VPS 2–4 GB + большой диск (или mount): Docker, [Nginx](/blog/nginx-ili-caddy/) + [SSL](/blog/ssl-letsencrypt-vps/), клиенты на TV/phone.

Контент вы храните легально (свои rips, Creative Commons, личные видео). Jellyfin индексирует библиотеку и стримит домашним пользователям.

---

## Jellyfin vs Plex vs Emby

| | Jellyfin | Plex | Emby |
| --- | --- | --- | --- |
| Open-source | Да | Freemium | Freemium |
| Phone sync fee | Нет | Plex Pass | Premium |
| Plugins | Да | Да | Да |
| Self-hosted | Полностью | Частично | Да |

Для семьи без подписок — Jellyfin. Для IoT — [EMQX](/blog/emqx-mqtt-na-vps/), не путать.

---

## Когда VPS, а когда домашний NAS

| VPS | NAS дома |
| --- | --- |
| Доступ из любой точки | Локальная скорость 1 Gbit |
| Нужен большой uplink | 4K direct play без transcoding |
| Нет домашнего IP | Дешевле TB storage |

VPS 2 TB дорого — часто **VPS proxy + storage дома через [Tailscale](/blog/tailscale-vpn-vps/)** или только metadata на VPS.

---

## Требования

- **RAM:** 2 GB минимум, 4 GB если transcoding
- **CPU:** transcoding 1080p — 4 vCPU; 4K — GPU или не transcode
- **Disk:** библиотека медиа (100 GB – несколько TB)
- **Bandwidth:** 1080p ~5–10 Mbps на поток

---

## Docker установка

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8096:8096"
    volumes:
      - ./config:/config
      - ./cache:/cache
      - /mnt/media:/media:ro
    environment:
      - JELLYFIN_PublishedServerUrl=https://jelly.example.com
```

`/mnt/media` — attach volume или [MinIO mount](/blog/minio-s3-na-vps/) (не ideal для streaming latency).

---

## Reverse proxy + SSL

```nginx
location / {
  proxy_pass http://127.0.0.1:8096;
  proxy_set_header Host \$host;
  proxy_set_header X-Real-IP \$remote_addr;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
}
```

WebSocket для некоторых клиентов — включите upgrade headers. SSL — [certbot](/blog/certbot-dns-ssl-vps/) или Caddy.

---

## Библиотеки и naming

Структура для автоматического метadata:

```
/media
  /movies
    /The Matrix (1999)
      The Matrix (1999).mkv
  /tv
    /Breaking Bad
      /Season 01
        Breaking Bad - S01E01.mkv
```

Jellyfin → Dashboard → Libraries → Scan. Metadata plugins: TMDB, TVDB (API keys опционально).

---

## Transcoding

Settings → Playback → Transcoding:

- **Software** — работает везде, грузит CPU
- **Hardware** — Intel QuickSync / NVIDIA на bare metal; на VPS редко есть GPU
- **Стратегия:** direct play когда клиент поддерживает codec

На VPS без GPU ограничьте max simultaneous transcodes = 1–2.

```bash
# Мониторинг CPU при transcode
htop
```

---

## Доступ извне

1. **HTTPS** обязателен (credentials!)
2. [Authentik](/blog/authentik-sso-vps/) — optional SSO
3. Не открывайте 8096 напрямую — только через Nginx
4. [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на auth failures

Для семьи — отдельные user accounts, Kids profile с рейтинг limit.

---

## Клиенты

- **TV:** Android TV, Fire TV, Roku (Jellyfin app)
- **Mobile:** iOS/Android official apps
- **Web:** браузер через ваш domain
- **Desktop:** Jellyfin Media Player

---

## Live TV / IPTV (опционально)

Jellyfin поддерживает M3U tuner — legal IPTV subscriptions. Настройка Tuner → M3U URL. EPG через xmltv.

---

## Мониторинг и логи

```bash
docker compose logs -f jellyfin
```

- Disk space на `/media` и `/cache`
- [Netdata](/blog/netdata-monitoring-vps/) — CPU spikes при transcode
- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — HTTP 200 on /web

---

## Бэкапы

- `./config` — users, watch state, settings (backup daily)
- `/media` — [Restic](/blog/restic-backup-vps/) (heavy, но critical)

```bash
tar czf jellyfin-config-$(date +%F).tar.gz ./config
```

---

## Типичные проблемы

| Проблема | Решение |
| --- | --- |
| Buffering | Uplink VPS / transcoding overload |
| No metadata | Naming convention + scan library |
| Login loop behind proxy | X-Forwarded-Proto, PublishedServerUrl |
| Subtitles burn-in slow | Disable burn, use direct stream |
| 413 upload | Nginx client_max_body_size |

---

## Юридическое

Jellyfin — инструмент. Вы отвечаете за легальность контента. Не используйте для пиратского distribution. VPS ToS некоторых провайдеров ограничивает DMCA-heavy usage.

---

## Итог

Jellyfin на VPS — свой Netflix без абонплаты Plex Pass. Docker + Nginx + SSL + правильная структура папок = семейный streaming.

VPS с хорошим uplink — [StormNet Cloud](https://stormnetcloud.com/). Большие файлы — [Nextcloud](/blog/nextcloud-oblako-vps/) для sync + Jellyfin для play.
