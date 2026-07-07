---
title: "EMQX на VPS: MQTT-брокер для IoT"
description: "Установка EMQX MQTT broker на VPS: IoT устройства, pub/sub, TLS, WebSocket. Self-hosted альтернатива облачному IoT Hub."
pubDate: 2026-07-12
category: DevOps
keywords:
  - "EMQX VPS"
  - "MQTT broker"
  - "IoT VPS"
  - "MQTT self-hosted"
  - "pub sub"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** EMQX — MQTT-брокер для IoT: датчики публикуют в topics, подписчики получают. Docker на VPS за 5 минут. TLS + auth для production.

MQTT — лёгкий протокол для умного дома, телеметрии, [Telegram-ботов](/blog/telegram-bot-vps/) с hardware.

---

## MQTT vs HTTP для IoT

| | MQTT | HTTP |
| --- | --- | --- |
| Overhead | Минимальный | Высокий |
| Push от server | Да | Polling |
| Offline queue | Да | Нет |
| Battery devices | Идеально | Плохо |

---

## Docker установка

```yaml
services:
  emqx:
    image: emqx/emqx:5
    ports:
      - "1883:1883"
      - "8883:8883"
      - "127.0.0.1:18083:18083"
    environment:
      EMQX_NAME: emqx
    volumes:
      - emqx_data:/opt/emqx/data
```

Dashboard: `http://127.0.0.1:18083` (admin/public → смените пароль).

---

## TLS

Порт 8883 — MQTT over TLS. Сертификат — [Let's Encrypt](/blog/ssl-letsencrypt-vps/) или [wildcard DNS](/blog/certbot-dns-ssl-vps/).

---

## Масштабирование

| Устройств | RAM |
| --- | --- |
| < 1000 | 512 MB–1 GB |
| 10k+ | 2 GB+ |

Мониторинг — [Netdata](/blog/netdata-monitoring-vps/) + EMQX metrics.

---

## Связка с приложением

Backend на [Node.js](/blog/nodejs-pm2-deploy/) или [Go](/blog/go-golang-deploy-vps/) подписывается на MQTT → пишет в [MongoDB](/blog/mongodb-na-vps/) или [PostgreSQL](/blog/postgresql-tuning-vps/).

---

## Безопасность

- Смените default credentials
- ACL per device
- Не открывайте 1883 без TLS в интернет
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/)

---

## Итог

EMQX на VPS — свой IoT hub без облачной подписки. Docker + TLS + ACL = production-ready.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). Очереди — [RabbitMQ](/blog/rabbitmq-ocheredi-na-vps/).
