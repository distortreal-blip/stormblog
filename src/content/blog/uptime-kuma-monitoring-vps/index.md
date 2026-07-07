---
title: "Uptime Kuma на VPS: мониторинг доступности сайтов"
description: "Установка Uptime Kuma на VPS: HTTP/TCP/ping мониторы, алерты в Telegram, status page. Лёгкая альтернатива Grafana для uptime."
pubDate: 2026-07-09
updatedDate: 2026-07-13
category: DevOps
keywords:
  - "Uptime Kuma VPS"
  - "мониторинг uptime"
  - "проверка сайта"
  - "status page"
  - "алерты Telegram"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Uptime Kuma — self-hosted мониторинг доступности с красивым UI. Ставится через Docker за 5 минут, шлёт алерты в Telegram/Slack при падении сайта. Дополняет [Grafana/Prometheus](/blog/grafana-prometheus-vps/), но не заменяет метрики CPU/RAM.

Без мониторинга вы узнаёте о падении от клиентов. Uptime Kuma — самый быстрый способ получить алерт за 0 ₽.

---

## Uptime Kuma vs Grafana vs внешние сервисы

| | Uptime Kuma | Grafana | UptimeRobot |
| --- | --- | --- | --- |
| Self-hosted | Да | Да | Нет (free tier) |
| Метрики CPU/RAM | Нет | Да | Нет |
| Status page | Да | С плагинами | Да |
| RAM | ~200 MB | 1 GB+ | — |

Идеальная связка: **Uptime Kuma** (доступность) + **Prometheus** (ресурсы).

---

## Установка

```yaml
# docker-compose.yml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    ports:
      - "127.0.0.1:3001:3001"
    volumes:
      - uptime_data:/app/data
    restart: unless-stopped

volumes:
  uptime_data:
```

```bash
docker compose up -d
```

Доступ: SSH tunnel или Nginx reverse proxy + [SSL](/blog/ssl-letsencrypt-vps/).

---

## Nginx reverse proxy

```nginx
server {
    listen 443 ssl;
    server_name status.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Настройка мониторов

Типы проверок:
- **HTTP(s)** — код ответа, keyword, JSON query
- **TCP** — порт открыт
- **Ping** — ICMP
- **DNS** — резолв записи
- **Docker container** — статус контейнера

Рекомендуемые интервалы:
- Production API: 60 сек
- Блог/лендинг: 120 сек
- Внутренние сервисы: 300 сек

---

## Алерты в Telegram

1. Создайте бота через @BotFather
2. В Uptime Kuma → Settings → Notifications → Telegram
3. Укажите Bot Token и Chat ID

Дублируйте критичные алерты в Grafana Alertmanager.

---

## Status Page

Публичная страница статуса для клиентов:
- Settings → Status Pages
- Добавьте мониторы
- Опубликуйте на `status.example.com`

Повышает доверие B2B-клиентов.

---

## Что мониторить на VPS

- Главный сайт (HTTPS 200)
- API health endpoint (`/health`)
- [PostgreSQL](/blog/postgresql-tuning-vps/) / [Redis](/blog/redis-kesh-vps/) TCP порты (localhost)
- SSL expiry (встроено в HTTP monitor)
- Внешний [MinIO](/blog/minio-s3-na-vps/) endpoint

---

## Несколько VPS

Один Uptime Kuma на отдельном «management» VPS мониторит все проекты. Не ставьте мониторинг на тот же VPS, который мониторите — при падении сервера упадёт и алерт.

---

## Бэкап

```bash
docker run --rm -v uptime-kuma_uptime_data:/data -v $(pwd):/backup alpine   tar czf /backup/uptime-kuma-backup.tar.gz /data
```

Храните на [MinIO](/blog/minio-s3-na-vps/) или втором VPS — [бэкапы 3-2-1](/blog/backup-vps-3-2-1/).

---

## Итог

Uptime Kuma — первый мониторинг, который стоит поставить на VPS. 5 минут установки, алерты в Telegram, бесплатная status page.

Отдельный VPS для мониторинга — [StormNet Cloud](https://stormnetcloud.com/). Метрики сервера — [Grafana + Prometheus](/blog/grafana-prometheus-vps/).
