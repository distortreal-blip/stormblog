---
title: "MongoDB на VPS: установка и production-настройка"
description: "MongoDB на VPS: установка, аутентификация, репликация, бэкапы, RAM tuning. NoSQL для Node.js и современных приложений."
pubDate: 2026-07-03
category: DevOps
keywords:
  - "MongoDB VPS"
  - "NoSQL VPS"
  - "MongoDB production"
  - "установка MongoDB"
  - "MongoDB backup"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** MongoDB на VPS ставится через apt или Docker. Включите auth, bind 127.0.0.1, настройте WiredTiger cache ≤ 50% RAM. Бэкапы — mongodump + [Restic](/blog/restic-backup-vps/).

SQL или NoSQL? [MySQL vs PostgreSQL](/blog/mysql-ili-postgresql-vps/) — для реляционных данных. MongoDB — для гибкой схемы, документов, прототипов с [Node.js](/blog/nodejs-pm2-deploy/).

---

## MongoDB vs PostgreSQL на VPS

| | MongoDB | PostgreSQL |
| --- | --- | --- |
| Схема | Гибкая | Строгая |
| JSON | Нативно | JSONB |
| Транзакции | Да (multi-doc) | Да |
| RAM | Жадная | Умеренная |
| Типичный стек | MERN, NestJS | Laravel, Django |

---

## Установка (Ubuntu)

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
# Добавьте repo по документации MongoDB для вашей Ubuntu
sudo apt install mongodb-org -y
sudo systemctl enable mongod
```

---

## Безопасность

```yaml
# /etc/mongod.conf
net:
  bindIp: 127.0.0.1
security:
  authorization: enabled
```

```javascript
use admin
db.createUser({ user: "admin", pwd: "STRONG", roles: ["root"] })
```

Никогда не открывайте 27017 в интернет — см. [защита VPS](/blog/zashchita-vps-ot-vzloma/).

---

## RAM tuning (2 GB VPS)

```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.5
```

Правило: WiredTiger cache ≈ 50% RAM минус ОС и приложение.

---

## Docker альтернатива

```yaml
services:
  mongo:
    image: mongo:7
    ports:
      - "127.0.0.1:27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: STRONG
    volumes:
      - mongo_data:/data/db
```

[Docker Compose](/blog/docker-compose-vps/) — проще изоляция.

---

## Бэкапы

```bash
mongodump --uri="mongodb://admin:pass@127.0.0.1" --out=/backup/mongo-$(date +%F)
```

Off-site — [Restic](/blog/restic-backup-vps/) или [MinIO](/blog/minio-s3-na-vps/). Стратегия — [3-2-1](/blog/backup-vps-3-2-1/).

---

## Репликация (2+ VPS)

Replica Set: primary + secondary на разных VPS. Автоматический failover при падении primary. Связь — [Tailscale](/blog/tailscale-vpn-vps/) или private network.

---

## Мониторинг

- mongostat, mongotop
- [Grafana](/blog/grafana-prometheus-vps/) + mongodb_exporter
- Алерты на connections, replication lag

---

## Итог

MongoDB на VPS — для MERN-стека и document-oriented apps. Auth + localhost bind + бэкапы — обязательный минимум.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Node.js деплой — [PM2](/blog/nodejs-pm2-deploy/).
