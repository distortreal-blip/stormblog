---
title: "Redis на VPS: кэширование, сессии и очереди"
description: "Как поднять Redis на VPS: установка, настройка памяти, persistence, безопасность. Кэш для API, сессии и фоновые задачи."
pubDate: 2026-07-06
category: DevOps
keywords:
  - "Redis VPS"
  - "кэширование Redis"
  - "Redis Linux"
  - "очереди"
  - "Storm Cloud"
heroImage: ./cover.webp
---

Redis — самый популярный in-memory store для кэша, сессий и очередей. На VPS он поднимается за 10 минут.

---

## Когда нужен Redis на VPS

- Кэш ответов API (снижение нагрузки на БД)
- Хранение сессий пользователей
- Очереди задач (Sidekiq, Bull, Celery)
- Rate limiting и pub/sub

---

## Установка

```bash
sudo apt update
sudo apt install redis-server -y
sudo systemctl enable redis-server
redis-cli ping
# PONG
```

---

## Базовая настройка

```ini
# /etc/redis/redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
bind 127.0.0.1 ::1
requirepass YOUR_STRONG_PASSWORD
```

**Важно:** не открывайте порт 6379 в интернет без VPN и пароля.

---

## RAM на VPS

| Нагрузка | RAM для Redis |
| --- | --- |
| Малый сайт | 128–256 MB |
| API средний | 512 MB–1 GB |
| Высокий трафик | 2 GB+ |

---

## Итог

Redis на VPS ускоряет приложение в разы. Держите его на localhost, задайте maxmemory и пароль.

VPS от 2 GB RAM — [StormNet Cloud](https://stormnetcloud.com/). См. также [PostgreSQL на VPS](/blog/postgresql-tuning-vps/).
