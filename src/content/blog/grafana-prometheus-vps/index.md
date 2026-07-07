---
title: "Grafana и Prometheus на VPS: мониторинг сервера"
description: "Как поднять Prometheus + Grafana на VPS: метрики CPU, RAM, диск, алерты в Telegram. Docker Compose стек."
pubDate: 2026-07-06
category: DevOps
keywords:
  - "Grafana VPS"
  - "Prometheus"
  - "мониторинг сервера"
  - "метрики"
  - "DevOps"
heroImage: ./cover.webp
---

Без мониторинга вы узнаёте о падении сайта от пользователей. Prometheus + Grafana — стандарт open-source.

---

## Что мониторить

- CPU, RAM, disk I/O
- Nginx request rate и 5xx
- Доступность endpoint (blackbox)
- PostgreSQL/MySQL connections

---

## Минимальный стек (Docker Compose)

```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "127.0.0.1:9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: strong_password

  node_exporter:
    image: prom/node-exporter
    network_mode: host
```

Доступ к Grafana — через SSH tunnel или Nginx с auth.

---

## RAM

Минимум **2 GB RAM** для стека. На 1 GB — только node_exporter + внешний Grafana Cloud.

---

## Алерты

Настройте Alertmanager или встроенные Grafana alerts → Telegram/Slack при:
- CPU > 90% 5 мин
- Disk > 85%
- HTTP 5xx > 10/мин

---

## Итог

Мониторинг на VPS окупается при первом инциденте. Начните с node_exporter + Grafana.

VPS для мониторинга — [StormNet Cloud](https://stormnetcloud.com/). Базовый гайд — [VPS monitoring](/blog/vps-monitoring/).
