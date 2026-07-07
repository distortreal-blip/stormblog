---
title: "MinIO на VPS: своё S3-хранилище для файлов и бэкапов"
description: "Развёртывание MinIO на VPS: S3-совместимое хранилище, buckets, политики доступа, интеграция с приложениями и бэкапами. Docker и bare metal."
pubDate: 2026-07-05
category: DevOps
keywords:
  - "MinIO VPS"
  - "S3 хранилище"
  - "object storage"
  - "бэкапы S3"
  - "self-hosted S3"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** MinIO — S3-совместимое хранилище, которое поднимается на VPS за 10 минут. Используйте для загрузки файлов приложения, бэкапов БД и статики — дешевле и приватнее публичного S3.

AWS S3 удобен, но для pet-проектов и [бэкапов по правилу 3-2-1](/blog/backup-vps-3-2-1/) своё хранилище на втором VPS часто выгоднее.

---

## Зачем MinIO на VPS

- Загрузка аватаров, документов, медиа
- Хранение бэкапов PostgreSQL/MySQL
- Совместимость с AWS SDK (drop-in замена)
- Полный контроль над данными

Связка: app VPS + MinIO VPS + [WireGuard](/blog/wireguard-vpn-na-vps/) между ними.

---

## Требования к VPS

| Нагрузка | RAM | Диск |
| --- | --- | --- |
| Dev / тесты | 1 GB | 20 GB |
| Production малый | 2 GB | 100 GB+ |
| Много файлов | 4 GB | 500 GB+ SSD |

Диск важнее CPU. Используйте SSD/NVMe.

---

## Установка через Docker

```yaml
# docker-compose.yml
services:
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: STRONG_PASSWORD_HERE
    volumes:
      - minio_data:/data
    restart: unless-stopped

volumes:
  minio_data:
```

```bash
docker compose up -d
```

**Не открывайте** порты 9000/9001 в интернет без Nginx + SSL + auth.

---

## Nginx + SSL для MinIO

```nginx
server {
    listen 443 ssl;
    server_name s3.example.com;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        client_max_body_size 100M;
    }
}
```

Console — отдельный поддомен `minio-console.example.com` на порт 9001.

---

## Создание bucket и ключей

```bash
mc alias set local https://s3.example.com admin PASSWORD
mc mb local/uploads
mc mb local/backups
mc admin user add local appuser APP_SECRET_KEY
mc admin policy attach local readwrite --user appuser
```

---

## Интеграция с приложением

```javascript
// AWS SDK v3 — endpoint MinIO
const s3 = new S3Client({
  endpoint: 'https://s3.example.com',
  region: 'us-east-1',
  credentials: { accessKeyId: '...', secretAccessKey: '...' },
  forcePathStyle: true,
});
```

Laravel, Next.js, FastAPI — все работают с S3 API.

---

## Бэкапы в MinIO

```bash
# PostgreSQL dump → MinIO
pg_dump mydb | gzip | mc pipe local/backups/mydb-$(date +%F).sql.gz
```

Автоматизируйте через cron или [Ansible](/blog/ansible-avtomatizaciya-servera/).

---

## Безопасность

- TLS обязателен
- Отдельные ключи для каждого приложения
- Versioning buckets для защиты от случайного удаления
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на Nginx
- Репликация на второй VPS для DR

---

## MinIO vs облачный S3

| | MinIO на VPS | AWS S3 |
| --- | --- | --- |
| Цена | Диск VPS | Pay per GB + requests |
| Контроль | Полный | AWS |
| Масштаб | До TB | Практически безлимит |
| Надёжность | Ваша ответственность | 99.99% SLA |

---

## Итог

MinIO превращает VPS в персональный S3. Идеален для бэкапов, медиа и приложений с file upload.

VPS с большим диском — [StormNet Cloud](https://stormnetcloud.com/). Docker-стек — [Docker Compose на VPS](/blog/docker-compose-vps/).
