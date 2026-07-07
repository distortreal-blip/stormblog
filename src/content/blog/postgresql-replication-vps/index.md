---
title: "PostgreSQL replication на VPS: streaming replica и failover"
description: "Настройка PostgreSQL streaming replication на VPS: primary/replica, pg_basebackup, мониторинг lag. High availability для малого проекта."
pubDate: 2026-07-06
category: DevOps
keywords:
  - "PostgreSQL replication"
  - "streaming replica VPS"
  - "PostgreSQL HA"
  - "pg_basebackup"
  - "failover"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Primary принимает записи, replica — read-only копия через WAL streaming. Два VPS или primary + replica на разных AZ — защита от падения диска/сервера.

Не заменяет полноценный Patroni-кластер, но для SaaS на 2 VPS — must-have step перед ростом.

---

## Архитектура

```
App → Primary (read/write)
         ↓ WAL stream
      Replica (read-only, backup)
```

Тюнинг primary — [PostgreSQL tuning](/blog/postgresql-tuning-vps/). Выбор БД — [MySQL vs PostgreSQL](/blog/mysql-ili-postgresql-vps/).

---

## Primary: postgresql.conf

```ini
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB
```

```ini
# pg_hba.conf — разрешить replica IP
host replication replicator REPLICA_IP/32 scram-sha-256
```

```sql
CREATE USER replicator WITH REPLICATION PASSWORD 'secret';
```

---

## Replica: pg_basebackup

```bash
sudo systemctl stop postgresql
sudo rm -rf /var/lib/postgresql/16/main/*
sudo -u postgres pg_basebackup -h PRIMARY_IP -D /var/lib/postgresql/16/main -U replicator -P -R
sudo systemctl start postgresql
```

Флаг `-R` создаёт `standby.signal` и `primary_conninfo`.

---

## Проверка lag

```sql
-- на primary
SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn
FROM pg_stat_replication;
```

```sql
-- на replica
SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn();
```

Алерты — [Prometheus](/blog/grafana-prometheus-vps/) + [Alertmanager](/blog/prometheus-alertmanager-vps/).

---

## Read-only на replica

```sql
-- replica по умолчанию hot standby
SELECT pg_is_in_recovery(); -- true
```

Приложение: read queries → replica, writes → primary. Laravel/Django — database routing.

---

## Failover (ручной)

1. Promote replica: `pg_ctl promote` или `pg_promote()`
2. Переключить DNS/apps на новый primary
3. Старый primary — rebuild как replica

Автоматический failover — Patroni/etcd (отдельная тема, 3+ nodes).

---

## Бэкапы

Replica — удобно для `pg_dump` без нагрузки на primary. Плюс [Restic](/blog/restic-backup-vps/) WAL archive (опционально).

---

## Итог

PostgreSQL streaming replication на двух VPS — первый шаг к HA. Primary + replica, мониторинг lag, plan ручного failover.

VPS 2× — [StormNet Cloud](https://stormnetcloud.com/). Балансировка — [HAProxy](/blog/haproxy-load-balancer-vps/). VPN между серверами — [WireGuard](/blog/wireguard-vpn-na-vps/).
