---
title: "Prometheus Alertmanager на VPS: алерты в Telegram"
description: "Настройка Alertmanager: правила Prometheus, группировка, silence, Telegram/Slack. Завершение monitoring-стека."
pubDate: 2026-07-02
category: DevOps
keywords:
  - "Alertmanager VPS"
  - "Prometheus alerts"
  - "Telegram алерты"
  - "мониторинг"
  - "DevOps alerting"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Prometheus собирает метрики, Alertmanager отправляет алерты. Настройте alert rules → Alertmanager → Telegram. Завершает стек [Grafana + Prometheus](/blog/grafana-prometheus-vps/).

Метрики без алертов бесполезны — узнаёте о проблеме из [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/), когда уже поздно.

---

## Стек мониторинга

```
exporters → Prometheus → Alertmanager → Telegram
                ↓
             Grafana
```

Логи — [Loki](/blog/loki-grafana-logi-vps/). Uptime — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).

---

## alert rules

```yaml
# /etc/prometheus/alerts.yml
groups:
  - name: vps
    rules:
      - alert: HighCPU
        expr: 100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU > 90% on {{ $labels.instance }}"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 15
        for: 10m
        labels:
          severity: critical
```

---

## Alertmanager config

```yaml
# alertmanager.yml
route:
  receiver: telegram
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m

receivers:
  - name: telegram
    telegram_configs:
      - bot_token: YOUR_BOT_TOKEN
        chat_id: YOUR_CHAT_ID
        parse_mode: HTML
```

---

## Docker Compose фрагмент

```yaml
  alertmanager:
    image: prom/alertmanager
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    ports:
      - "127.0.0.1:9093:9093"
```

---

## Silence и inhibition

```bash
# Maintenance window — silence через UI :9093
amtool silence add alertname=HighCPU --duration=2h
```

Inhibition — не спамить DiskSpaceLow если NodeDown.

---

## RAM

Alertmanager лёгкий (~50 MB). Весь стек Prometheus + Grafana + Alertmanager — 2 GB VPS минимум.

---

## Итог

Alertmanager превращает Prometheus в actionable monitoring. Telegram-алерт при CPU/disk — must-have для production.

VPS 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Базовый стек — [Grafana Prometheus](/blog/grafana-prometheus-vps/). Enterprise — [Zabbix](/blog/zabbix-monitoring-vps/).
