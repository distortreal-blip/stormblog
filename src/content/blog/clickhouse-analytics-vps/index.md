---
title: "ClickHouse на VPS: аналитика и OLAP на своём сервере"
description: "Установка ClickHouse на VPS: колоночная БД для логов и аналитики, запросы, интеграция с Grafana. Когда нужен OLAP."
pubDate: 2026-07-11
category: DevOps
keywords:
  - "ClickHouse VPS"
  - "OLAP"
  - "аналитика"
  - "колоночная БД"
  - "логи аналитика"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** ClickHouse — колоночная СУБД для аналитики миллиардов строк. На VPS подходит для логов, метрик, event tracking. Минимум 4 GB RAM для production.

PostgreSQL и [MariaDB](/blog/mariadb-optimizaciya-vps/) — для OLTP (транзакции). ClickHouse — для OLAP (агрегации, отчёты, дашборды).

---

## ClickHouse vs PostgreSQL vs Elasticsearch

| | ClickHouse | PostgreSQL | Elasticsearch |
| --- | --- | --- | --- |
| Тип | OLAP | OLTP | Search/Logs |
| Сжатие | Отличное | Среднее | Среднее |
| RAM | 4 GB+ | 2 GB+ | 4 GB+ |
| SQL | Да | Да | Нет (DSL) |

Для логов проще — [Loki](/blog/loki-grafana-logi-vps/). ClickHouse — когда нужен SQL на больших данных.

---

## Установка (Docker)

```yaml
services:
  clickhouse:
    image: clickhouse/clickhouse-server
    ports:
      - "127.0.0.1:8123:8123"
    volumes:
      - ch_data:/var/lib/clickhouse
    ulimits:
      nofile: 262144

volumes:
  ch_data:
```

На VPS **4+ GB RAM**, SSD обязателен.

---

## Создание таблицы

```sql
CREATE TABLE events (
    ts DateTime,
    user_id UInt64,
    event String,
    properties String
) ENGINE = MergeTree()
ORDER BY (ts, user_id);
```

```sql
INSERT INTO events VALUES (now(), 1, 'page_view', '{}');
SELECT event, count() FROM events GROUP BY event;
```

---

## Импорт логов Nginx

```bash
# Парсинг access.log → INSERT
clickhouse-client --query "INSERT INTO nginx_logs FORMAT JSONEachRow" < parsed.json
```

Связка с [Nginx логами](/blog/nginx-logi-i-oshibki/) и [Grafana](/blog/grafana-prometheus-vps/).

---

## Безопасность

- bind только 127.0.0.1
- Пароль default user
- Не открывайте 8123 в интернет
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на Nginx перед CH

---

## RAM и диск

| Данные | RAM | Диск |
| --- | --- | --- |
| 10M events | 4 GB | 50 GB |
| 100M+ | 8 GB+ | 200 GB+ |

Бэкапы — [Restic](/blog/restic-backup-vps/) на volume.

---

## Итог

ClickHouse на VPS — для аналитики без облачного BigQuery. Закладывайте RAM и SSD, не ставьте на 2 GB VPS.

VPS 4–8 GB — [StormNet Cloud](https://stormnetcloud.com/). Лёгкие логи — [Loki](/blog/loki-grafana-logi-vps/).
