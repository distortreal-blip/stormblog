---
title: "Zabbix на VPS: enterprise-мониторинг инфраструктуры"
description: "Развёртывание Zabbix на VPS: агенты, триггеры, оповещения, карты сети. Мониторинг нескольких серверов из одной точки."
pubDate: 2026-07-02
category: DevOps
keywords:
  - "Zabbix VPS"
  - "мониторинг серверов"
  - "Zabbix agent"
  - "инфраструктура"
  - "алерты Zabbix"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Zabbix — полноценная система мониторинга: агент на каждом VPS, central server, триггеры, эскалация. Нужен при 5+ серверах. Минимум 2 GB RAM на Zabbix server.

[Netdata](/blog/netdata-monitoring-vps/) — для одного VPS. Zabbix — когда инфраструктура растёт.

---

## Zabbix vs Prometheus

| | Zabbix | Prometheus |
| --- | --- | --- |
| Модель | Push/pull agents | Pull metrics |
| UI | Встроенный | Grafana |
| Learning curve | Высокая | Средняя |
| Legacy enterprise | Да | Cloud-native |

---

## Docker Compose (быстрый старт)

```yaml
services:
  zabbix-server:
    image: zabbix/zabbix-server-mysql:ubuntu-6.4-latest
    environment:
      DB_SERVER_HOST: mysql
      MYSQL_USER: zabbix
      MYSQL_PASSWORD: zabbix
      MYSQL_DATABASE: zabbix
    ports:
      - "10051:10051"

  zabbix-web:
    image: zabbix/zabbix-web-nginx-mysql:ubuntu-6.4-latest
    ports:
      - "8080:8080"
    environment:
      ZBX_SERVER_HOST: zabbix-server
      DB_SERVER_HOST: mysql
```

Production — отдельный VPS только под Zabbix.

---

## Zabbix agent на monitored VPS

```bash
sudo apt install zabbix-agent2
```

```ini
# /etc/zabbix/zabbix_agent2.conf
Server=ZABBIX_SERVER_IP
Hostname=vps-prod-01
```

---

## Типичные триггеры

- CPU > 90% 5 min
- Disk > 85%
- Service down (Nginx, [PostgreSQL](/blog/postgresql-tuning-vps/))
- SSL expiry < 14 days

---

## Итог

Zabbix — для команд с десятками VPS. Overkill для одного pet-проекта — начните с [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) + Netdata.

VPS 4 GB для Zabbix — [StormNet Cloud](https://stormnetcloud.com/). Метрики — [Prometheus](/blog/grafana-prometheus-vps/).
