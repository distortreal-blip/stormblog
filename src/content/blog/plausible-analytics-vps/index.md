---
title: "Plausible Analytics на VPS: приватная веб-аналитика"
description: "Self-hosted Plausible на VPS: Docker, GDPR-friendly метрики без cookies, альтернатива Google Analytics для блога и SaaS."
pubDate: 2026-07-04
category: DevOps
keywords:
  - "Plausible Analytics"
  - "self-hosted analytics"
  - "VPS метрики"
  - "GDPR"
  - "веб-аналитика"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Plausible — лёгкая privacy-first аналитика. Self-hosted на VPS 2 GB: Docker Compose, PostgreSQL + ClickHouse, snippet на сайт. Без cookie banner в EU (проверьте юриста).

Для блога вроде Storm Cloud Blog — альтернатива GA без «накрутки ботами» и без передачи данных Google.

---

## Plausible vs GA vs Matomo

| | Plausible CE | Google Analytics | Matomo |
| --- | --- | --- | --- |
| RAM | ~2 GB | SaaS | 4 GB+ |
| Cookies | Нет | Да | Опционально |
| Self-hosted | Да (CE) | Нет | Да |
| Сложность | Средняя | Низкая | Высокая |

Логи сервера — [journalctl](/blog/journalctl-logi-linux-vps/). Uptime — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).

---

## Требования

- VPS 2 GB RAM минимум (ClickHouse + Postgres)
- Домен `analytics.example.com`
- [SSL](/blog/ssl-letsencrypt-vps/)

---

## Docker Compose (упрощённо)

Клонируйте официальный community edition:

```bash
git clone https://github.com/plausible/community-edition plausible-ce
cd plausible-ce
cp plausible-conf.env.example plausible-conf.env
# Задайте BASE_URL, SECRET_KEY_BASE, TOTP_VAULT_KEY
docker compose up -d
```

Reverse proxy — [Nginx](/blog/nginx-ili-caddy/) → `127.0.0.1:8000`.

---

## Snippet на сайт

```html
<script defer data-domain="blog.example.com"
  src="https://analytics.example.com/js/script.js"></script>
```

Для Astro — в `BaseLayout.astro` или через env-переменную только в production.

---

## Что отслеживать

- Pageviews, referrers, countries
- UTM-кампании
- 404 страницы (custom events)

Не ждите «SEO-ранга от аналитики» — метрики для решений, не для накрутки.

---

## Бэкапы

```bash
docker compose exec db pg_dump -U postgres plausible_db > backup.sql
```

Стратегия [3-2-1](/blog/backup-vps-3-2-1/) + [Restic](/blog/restic-backup-vps/).

---

## Безопасность

- Не открывайте Plausible без auth в интернет — используйте SSO или VPN ([Tailscale](/blog/tailscale-vpn-vps/))
- Обновляйте CE регулярно
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на login

---

## Итог

Plausible CE на VPS — своя аналитика без GA и cookie-баннеров. 2 GB RAM, Docker, SSL — и вы видите реальный трафик.

VPS 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Мониторинг — [Grafana](/blog/grafana-prometheus-vps/).
