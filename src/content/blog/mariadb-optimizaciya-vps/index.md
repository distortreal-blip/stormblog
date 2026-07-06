---
title: "MariaDB на VPS: оптимизация и тюнинг производительности"
description: "Тюнинг MariaDB на VPS: innodb_buffer_pool, соединения, индексы, slow query log. WordPress и Laravel без тормозов на 2 GB RAM."
pubDate: 2026-07-10
category: DevOps
keywords:
  - "MariaDB VPS"
  - "оптимизация MySQL"
  - "innodb_buffer_pool"
  - "тюнинг БД"
  - "MariaDB tuning"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** на VPS с 2 GB RAM задайте `innodb_buffer_pool_size = 512M–768M`, включите slow query log, проверьте индексы. MariaDB по умолчанию жадная — без тюнинга съест всю память.

MariaDB — форк MySQL, дефолт для Ubuntu и [WordPress](/blog/wordpress-vps-2026/). Сравнение с PostgreSQL — [MySQL vs PostgreSQL](/blog/mysql-ili-postgresql-vps/).

---

## MariaDB vs MySQL на VPS

| | MariaDB | MySQL 8 |
| --- | --- | --- |
| Лицензия | GPL | Dual |
| WordPress | Нативно | Нативно |
| Производительность | Сопоставима | Сопоставима |
| На Ubuntu | apt install mariadb | Отдельный репо |

Для новых проектов на SQL — также рассмотрите [PostgreSQL](/blog/postgresql-tuning-vps/).

---

## Базовый тюнинг для 2 GB VPS

```ini
# /etc/mysql/mariadb.conf.d/50-server.cnf
[mysqld]
innodb_buffer_pool_size = 512M
innodb_log_file_size = 64M
max_connections = 100
query_cache_type = 0
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

```bash
sudo systemctl restart mariadb
```

---

## Расчёт innodb_buffer_pool

| VPS RAM | buffer_pool (приложение на том же VPS) |
| --- | --- |
| 1 GB | 256M |
| 2 GB | 512M |
| 4 GB | 1–1.5G |
| 8 GB | 3–4G |

Правило: **50–70% RAM**, если БД на dedicated VPS — до 80%.

---

## Мониторинг медленных запросов

```bash
sudo mysqldumpslow /var/log/mysql/slow.log
```

Типичные проблемы WordPress/Laravel:
- SELECT без индекса на meta_key
- JOIN без индекса
- ORDER BY на большой таблице

---

## Индексы и EXPLAIN

```sql
EXPLAIN SELECT * FROM wp_posts WHERE post_status = 'publish' ORDER BY post_date DESC LIMIT 10;
```

`type: ALL` + высокий `rows` = нужен индекс.

---

## Бэкапы

```bash
mysqldump --single-transaction -u root mydb | gzip > backup.sql.gz
```

Автоматизация + off-site — [бэкапы 3-2-1](/blog/backup-vps-3-2-1/). Хранение — [MinIO](/blog/minio-s3-na-vps/).

---

## Кэширование поверх MariaDB

- [Redis](/blog/redis-kesh-vps/) — object cache WordPress/Laravel
- [Memcached](/blog/memcached-kesh-vps/) — проще, без persistence
- Query cache в MariaDB 10.6+ удалён — не включайте

---

## Безопасность

```bash
sudo mysql_secure_installation
```

- bind-address = 127.0.0.1
- Отдельный пользователь per app
- Не открывайте 3306 в интернет

---

## Итог

MariaDB на VPS с 2 GB жизнеспособна после тюнинга buffer pool и индексов. Мониторьте slow log — он покажет 80% проблем.

VPS для БД — [StormNet Cloud](https://stormnetcloud.com/). PHP-стек — [PHP-FPM тюнинг](/blog/php-fpm-tuning-vps/).
