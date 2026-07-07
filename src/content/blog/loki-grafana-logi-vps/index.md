---
title: "Loki на VPS: централизованные логи с Grafana"
description: "Установка Grafana Loki на VPS: сбор логов приложений, Promtail, запросы LogQL, алерты. Лёгкая альтернатива ELK."
pubDate: 2026-07-03
category: DevOps
keywords:
  - "Loki VPS"
  - "Grafana Loki"
  - "централизация логов"
  - "Promtail"
  - "LogQL"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Loki — хранилище логов от создателей Grafana. Promtail собирает логи с VPS → Loki → запросы в Grafana. Легче ELK, идеальная связка с [Prometheus](/blog/grafana-prometheus-vps/).

Логи разбросаны по [journalctl](/blog/journalctl-logi-linux-vps/), Nginx files, Docker — Loki собирает в одно место.

---

## Loki vs ELK vs файлы

| | Loki | ELK | grep /var/log |
| --- | --- | --- | --- |
| RAM | 1–2 GB | 8 GB+ | 0 |
| Поиск | LogQL | Elasticsearch | rg/grep |
| Grafana | Нативно | Плагин | Нет |

---

## Docker Compose стек

```yaml
services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "127.0.0.1:3100:3100"
    volumes:
      - loki_data:/loki

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./promtail.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml

  grafana:
    image: grafana/grafana
    ports:
      - "127.0.0.1:3000:3000"

volumes:
  loki_data:
```

---

## promtail.yml

```yaml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: nginx
    static_configs:
      - targets: [localhost]
        labels:
          job: nginx
          __path__: /var/log/nginx/*.log
```

---

## LogQL запросы

```logql
{job="nginx"} |= "error"
{job="nginx"} | json | status >= 500
rate({job="nginx"}[5m])
```

Алерты при росте 5xx — в Grafana Alerting → Telegram.

---

## RAM

| Нагрузка | RAM |
| --- | --- |
| 1 VPS, 7 дней retention | 1–2 GB |
| Несколько VPS | 2–4 GB |

Для аналитики больших логов — [ClickHouse](/blog/clickhouse-analytics-vps/).

---

## Безопасность

- Loki/Grafana на localhost + Nginx + [SSL](/blog/ssl-letsencrypt-vps/)
- Или доступ через [Tailscale](/blog/tailscale-vpn-vps/)
- Не храните пароли в логах

---

## Итог

Loki + Grafana — стандартный стек логов на VPS в 2026. Дополняет метрики Prometheus и [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).

VPS 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Nginx логи — [разбор ошибок](/blog/nginx-logi-i-oshibki/).
