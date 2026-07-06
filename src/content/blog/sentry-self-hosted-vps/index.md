---
title: "Sentry self-hosted на VPS: отслеживание ошибок в production"
description: "Развёртывание Sentry на VPS: Docker Compose, алерты, интеграция с Node.js, Python, Go. Свой error tracking без облачной подписки."
pubDate: 2026-07-10
category: DevOps
keywords:
  - "Sentry VPS"
  - "error tracking"
  - "self-hosted Sentry"
  - "мониторинг ошибок"
  - "Sentry Docker"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Sentry self-hosted на VPS ловит ошибки frontend и backend, показывает stack trace и контекст. Официальный Docker Compose — 4+ GB RAM, для малых проектов рассмотрите GlitchTip как лёгкую альтернативу.

Без error tracking production слепой. Sentry — стандарт индустрии, self-hosted снимает лимиты бесплатного tier.

---

## Sentry cloud vs self-hosted

| | Cloud free | Self-hosted VPS |
| --- | --- | --- |
| События/мес | Лимит | Без лимита |
| RAM | — | 4 GB+ |
| Обновления | Авто | Вручную |
| Данные | У Sentry | У вас |

---

## Требования к VPS

| Компонент | RAM |
| --- | --- |
| Sentry minimal | 4 GB |
| Comfortable | 8 GB |
| + PostgreSQL + Redis | Включено в compose |

Для 2 GB VPS — **GlitchTip** (совместим с Sentry SDK) или cloud Sentry free tier.

---

## Установка (официальный self-hosted)

```bash
git clone https://github.com/getsentry/self-hosted.git
cd self-hosted
./install.sh
docker compose up -d
```

Первый запуск — 15–30 мин. UI на порту 9000.

---

## Nginx + SSL

```nginx
server {
    listen 443 ssl;
    server_name sentry.example.com;
    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        client_max_body_size 10M;
    }
}
```

[SSL](/blog/ssl-letsencrypt-vps/) обязателен — SDK шлёт ошибки по HTTPS.

---

## Интеграция Node.js

```javascript
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: 'https://key@sentry.example.com/1' });
```

Аналогично для [Next.js](/blog/nextjs-deploy-na-vps/), [Django](/blog/django-deploy-na-vps/), [Go](/blog/go-golang-deploy-vps/).

---

## Алерты

- Email при новой ошибке
- Slack / Telegram webhook
- Issue assignment в команде

Дополняет [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) (доступность) и [Grafana](/blog/grafana-prometheus-vps/) (метрики).

---

## Бэкапы

Sentry хранит события в PostgreSQL + ClickHouse (в новых версиях). Бэкап volumes:

```bash
docker compose stop
tar czf sentry-backup.tar.gz ./sentry-data
```

Off-site — [MinIO](/blog/minio-s3-na-vps/) + [правило 3-2-1](/blog/backup-vps-3-2-1/).

---

## Безопасность

- Не публикуйте без auth
- Ротация DSN keys per project
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на Nginx
- Обновляйте self-hosted — security patches

---

## Итог

Sentry self-hosted — для команд с объёмом ошибок выше free tier. Закладывайте 4+ GB VPS и время на обслуживание.

VPS 8 GB — [StormNet Cloud](https://stormnetcloud.com/). Логи ОС — [journalctl](/blog/journalctl-logi-linux-vps/).
