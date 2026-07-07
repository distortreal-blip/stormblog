---
title: "Restic на VPS: зашифрованные бэкапы на S3 и диск"
description: "Настройка Restic на VPS: инкрементальные бэкапы, шифрование, S3/MinIO, cron и восстановление. Практика правила 3-2-1."
pubDate: 2026-07-03
category: DevOps
keywords:
  - "Restic VPS"
  - "бэкап сервера"
  - "encrypted backup"
  - "S3 backup"
  - "инкрементальный бэкап"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Restic — инкрементальные зашифрованные бэкапы в один репозиторий (локально, S3, [MinIO](/blog/minio-s3-na-vps/)). Установите бинарник, инициализируйте repo, настройте cron — данные защищены по [правилу 3-2-1](/blog/backup-vps-3-2-1/).

tar.gz бэкапы не масштабируются: каждый полный архив — гигабайты и часы. Restic хранит только изменения и шифрует end-to-end.

---

## Restic vs rsync vs mysqldump

| | Restic | rsync | mysqldump |
| --- | --- | --- | --- |
| Инкрементальный | Да | Да (файлы) | Нет |
| Шифрование | Да | Нет | Нет |
| Дедупликация | Да | Нет | Нет |
| S3/облако | Да | Через rclone | Вручную |

---

## Установка

```bash
curl -L https://github.com/restic/restic/releases/latest/download/restic_linux_amd64.bz2 | bunzip2
sudo mv restic_linux_amd64 /usr/local/bin/restic
sudo chmod +x /usr/local/bin/restic
```

---

## Инициализация репозитория

Локально:

```bash
export RESTIC_PASSWORD="STRONG_REPO_PASSWORD"
restic init --repo /backup/restic-repo
```

На [MinIO S3](/blog/minio-s3-na-vps/):

```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export RESTIC_REPOSITORY=s3:https://s3.example.com/backups/restic
restic init
```

---

## Первый бэкап

```bash
restic backup /var/www /etc/nginx /home/deploy
restic snapshots
```

Исключения:

```bash
restic backup /var/www --exclude='*.log' --exclude='node_modules'
```

---

## Автоматизация cron

```bash
# /etc/cron.d/restic-backup
0 3 * * * deploy RESTIC_PASSWORD=xxx /usr/local/bin/restic -r /backup/restic-repo backup /var/www /etc 2>&1 | logger -t restic
```

Проверка:

```bash
restic check
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
```

---

## Восстановление

```bash
restic snapshots
restic restore latest --target /restore-test
restic restore abc123def --target /restore --include /var/www/app
```

Перед restore на production — тест на staging VPS ([почасовая аренда](/blog/pochasovaya-arenda-vps/)).

---

## Бэкап PostgreSQL/MySQL

```bash
pg_dump mydb | restic backup --stdin --stdin-filename mydb.sql
```

Или dump в файл → restic backup. См. [PostgreSQL tuning](/blog/postgresql-tuning-vps/) и [MariaDB](/blog/mariadb-optimizaciya-vps/).

---

## Мониторинг

- Алерт если cron не отработал — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)
- restic stats --mode raw-data
- Логи в [journalctl](/blog/journalctl-logi-linux-vps/)

---

## Итог

Restic — лучший выбор для encrypted off-site бэкапов на VPS. Один инструмент для файлов, конфигов и дампов БД.

VPS + [MinIO](/blog/minio-s3-na-vps/) — [StormNet Cloud](https://stormnetcloud.com/).
