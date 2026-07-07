---
title: "RabbitMQ на VPS: очереди задач для приложений"
description: "Установка RabbitMQ на VPS: exchanges, queues, workers, management UI. Интеграция с Laravel, Node.js и Python. Надёжная доставка сообщений."
pubDate: 2026-07-09
updatedDate: 2026-07-13
category: DevOps
keywords:
  - "RabbitMQ VPS"
  - "очереди сообщений"
  - "message queue"
  - "Laravel queue"
  - "background jobs"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** RabbitMQ — брокер сообщений для фоновых задач: отправка email, обработка изображений, синхронизация данных. На VPS ставится через apt или Docker, management UI — на localhost за Nginx.

Синхронный код не масштабируется. Когда API должен отвечать за 100 мс, а задача занимает 30 секунд — нужна очередь. RabbitMQ — классика рядом с [Redis](/blog/redis-kesh-vps/) (который тоже умеет очереди, но проще).

---

## RabbitMQ vs Redis vs SQS

| | RabbitMQ | Redis (Bull/Celery) | AWS SQS |
| --- | --- | --- | --- |
| Сложность | Средняя | Низкая | Низкая (managed) |
| Гарантии доставки | Сильные | Зависит от настройки | Сильные |
| Routing | Гибкий (exchanges) | Базовый | Базовый |
| Self-hosted | Да | Да | Нет |

Для [Laravel на VPS](/blog/laravel-na-vps/) RabbitMQ — стандарт production-очередей.

---

## Установка (Docker)

```yaml
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "127.0.0.1:5672:5672"
      - "127.0.0.1:15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: STRONG_PASS
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    restart: unless-stopped

volumes:
  rabbitmq_data:
```

Management UI: `http://127.0.0.1:15672` (через SSH tunnel).

---

## Базовые концепции

- **Producer** — отправляет сообщение
- **Exchange** — маршрутизирует в очереди
- **Queue** — хранит сообщения
- **Consumer/Worker** — обрабатывает

Типы exchange: direct, fanout, topic, headers.

---

## Laravel + RabbitMQ

```bash
composer require php-amqplib/php-amqplib
```

```ini
QUEUE_CONNECTION=rabbitmq
RABBITMQ_HOST=127.0.0.1
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=...
```

```bash
php artisan queue:work --tries=3
```

Supervisor или [systemd](/blog/systemd-linux-servisy/) для автозапуска воркеров.

---

## Node.js (amqplib)

```javascript
const amqp = require('amqplib');
const conn = await amqp.connect('amqp://admin:pass@localhost');
const ch = await conn.createChannel();
await ch.assertQueue('tasks');
ch.sendToQueue('tasks', Buffer.from(JSON.stringify({ job: 'send-email' })));
```

---

## Python (Celery)

```python
# celery.py
app = Celery('tasks', broker='amqp://admin:pass@localhost//')
```

---

## RAM и производительность

| Очередей/сообщений | RAM |
| --- | --- |
| Dev | 512 MB |
| Production малый | 1–2 GB |
| High throughput | 4 GB+ |

Мониторьте queue depth через management UI или [Grafana](/blog/grafana-prometheus-vps/).

---

## Надёжность

- Durable queues + persistent messages
- Publisher confirms
- Dead letter exchange для failed jobs
- Бэкап `rabbitmq_data` volume — [бэкапы 3-2-1](/blog/backup-vps-3-2-1/)

---

## Безопасность

- Не открывайте 5672/15672 в интернет
- Отдельные vhost и пользователи per app
- TLS для production между VPS
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на Nginx

---

## Итог

RabbitMQ на VPS — фундамент для асинхронной архитектуры. Начните с Docker, одной очереди и одного воркера — масштабируйте по мере роста.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). PHP-стек — [Laravel на VPS](/blog/laravel-na-vps/).
