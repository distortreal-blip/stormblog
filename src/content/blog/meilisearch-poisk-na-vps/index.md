---
title: "Meilisearch на VPS: мгновенный поиск для сайта и API"
description: "Meilisearch на VPS: установка, индексация, typo-tolerance, интеграция с Laravel/Django/Next.js. Альтернатива Elasticsearch для малого и среднего проекта."
pubDate: 2026-07-01
category: DevOps
keywords:
  - "Meilisearch VPS"
  - "full-text search"
  - "поиск на сайте"
  - "Laravel Scout"
  - "Elasticsearch альтернатива"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Meilisearch — быстрый full-text search с typo-tolerance и простым REST API. На VPS 1 GB RAM: Docker, master key, индексация из [PostgreSQL](/blog/postgresql-tuning-vps/) или приложения.

SQL `LIKE '%query%'` ломается на 100k+ строк. Elasticsearch тяжёлый для pet-проекта. Meilisearch — зол середины.

---

## Meilisearch vs Elasticsearch

| | Meilisearch | Elasticsearch |
| --- | --- | --- |
| RAM | 512 MB–2 GB | 4 GB+ |
| Setup | Минуты | Часы |
| Typo-tolerance | Из коробки | Плагины |
| Analytics/logs | Нет | Да ([ClickHouse](/blog/clickhouse-analytics-vps/)) |

Для логов — [Loki](/blog/loki-grafana-logi-vps/). Для поиска товаров/статей — Meilisearch.

---

## Docker

```yaml
services:
  meilisearch:
    image: getmeili/meilisearch:v1.11
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      MEILI_ENV: production
    volumes:
      - ./meili_data:/meili_data
    ports:
      - "127.0.0.1:7700:7700"
```

```bash
openssl rand -hex 32  # master key
```

Nginx reverse proxy + [SSL](/blog/ssl-letsencrypt-vps/). Не открывайте 7700 без auth.

---

## Индексация

```bash
curl -X POST 'https://search.example.com/indexes/articles/documents' \
  -H "Authorization: Bearer MASTER_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary @articles.json
```

```json
[
  {"id": 1, "title": "VPS для новичка", "content": "..."},
  {"id": 2, "title": "Docker Compose", "content": "..."}
]
```

Поиск:

```bash
curl 'https://search.example.com/indexes/articles/search' \
  -H "Authorization: Bearer MASTER_KEY" \
  -d '{"q": "docker vps"}'
```

---

## Laravel Scout

```php
// .env
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=https://search.example.com
MEILISEARCH_KEY=MASTER_KEY
```

```bash
php artisan scout:import "App\\Models\\Article"
```

См. также [Laravel на VPS](/blog/laravel-na-vps/) и [Redis](/blog/redis-kesh-vps/) для кеша.

---

## Django / Next.js

- Django: `django-meilisearch` или прямой HTTP client
- Next.js: server action → Meilisearch API, UI — instant search

Деплой приложения — [Django](/blog/django-deploy-na-vps/) / [Next.js](/blog/nextjs-deploy-na-vps/).

---

## Бэкапы индекса

```bash
curl -X POST 'https://search.example.com/dumps' \
  -H "Authorization: Bearer MASTER_KEY"
```

Volume `meili_data` — в [Restic](/blog/restic-backup-vps/). При падении — переиндексация из БД.

---

## RAM и production

- Dev: 512 MB
- 100k документов: 1–2 GB
- Несколько индексов: 2 GB VPS

Мониторинг — [Netdata](/blog/netdata-monitoring-vps/) или [Grafana](/blog/grafana-prometheus-vps/).

---

## Итог

Meilisearch на VPS — поиск за вечер. Docker + master key + reverse proxy = production-ready для SaaS и e-commerce.

VPS 1–2 GB — [StormNet Cloud](https://stormnetcloud.com/). Стек приложения — [Docker Compose](/blog/docker-compose-vps/).
