---
title: "PostgreSQL на VPS: установка, тюнинг и безопасность"
description: "Как установить PostgreSQL на VPS, настроить shared_buffers и work_mem под RAM, удалённый доступ и бэкапы."
pubDate: 2026-07-07
updatedDate: 2026-07-13
category: DevOps
keywords:
  - "PostgreSQL VPS"
  - "тюнинг PostgreSQL"
  - "база данных VPS"
  - "shared_buffers"
  - "Linux"
heroImage: ./cover.webp
---

PostgreSQL на VPS — стандарт для backend. Но из коробки он не оптимизирован под ваши ресурсы.

---

## Установка на Ubuntu

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
```

```bash
sudo -u postgres createuser --interactive
sudo -u postgres createdb myapp
```

---

## Тюнинг под RAM VPS

Для VPS с **4 GB RAM**:

```ini
# /etc/postgresql/16/main/postgresql.conf
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 16MB
maintenance_work_mem = 256MB
max_connections = 100
```

| RAM VPS | shared_buffers |
| --- | --- |
| 2 GB | 512 MB |
| 4 GB | 1 GB |
| 8 GB | 2 GB |

---

## Безопасность

- Не открывайте порт 5432 в интернет
- Приложение подключается через `localhost` или Docker network
- Сильный пароль + `pg_hba.conf`

```
# Только локально
host  all  all  127.0.0.1/32  scram-sha-256
```

---

## Бэкапы

```bash
pg_dump -U myuser mydb | gzip > backup.sql.gz
```

Автоматизация — [правило 3-2-1](/blog/backup-vps-3-2-1/).

---

## Итог

PostgreSQL на VPS требует тюнинга под RAM и закрытого внешнего доступа. На 2 GB VPS — легковесные нагрузки или managed DB.

VPS для БД — минимум 4 GB RAM. [StormNet Cloud](https://stormnetcloud.com/).
