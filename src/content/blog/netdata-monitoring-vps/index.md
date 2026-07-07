---
title: "Netdata на VPS: мониторинг в реальном времени"
description: "Установка Netdata на VPS: CPU, RAM, диск, сеть за 1 минуту. Красивый dashboard без настройки Prometheus."
pubDate: 2026-07-12
updatedDate: 2026-07-13
category: DevOps
keywords:
  - "Netdata VPS"
  - "мониторинг сервера"
  - "real-time metrics"
  - "Netdata install"
  - "dashboard VPS"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Netdata ставится одной командой и сразу показывает метрики каждую секунду. Проще [Prometheus + Grafana](/blog/grafana-prometheus-vps/), но менее гибок для кастомных алертов.

Первый мониторинг на VPS — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) (доступность). Netdata — второй шаг (ресурсы).

---

## Netdata vs Prometheus vs Zabbix

| | Netdata | Prometheus | Zabbix |
| --- | --- | --- | --- |
| Установка | 1 мин | 30+ мин | 1+ час |
| RAM | ~100 MB | 1 GB+ | 1 GB+ |
| Алерты | Базовые | Мощные | Мощные |
| Retention | Короткий | Настраиваемый | БД |

---

## Установка

```bash
wget -O /tmp/netdata-kickstart.sh https://my-netdata.io/kickstart.sh
sh /tmp/netdata-kickstart.sh
```

Dashboard: `http://VPS:19999` — **закройте firewall** или Nginx + auth.

---

## Nginx reverse proxy

```nginx
location / {
    proxy_pass http://127.0.0.1:19999;
    proxy_set_header Host $host;
}
```

Доступ через [Tailscale](/blog/tailscale-vpn-vps/) или VPN — не публикуйте без auth.

---

## Алерты

Netdata Cloud (free tier) — уведомления в Slack/Telegram. Self-hosted — health entities в конфиге.

Для production SLA — добавьте [Alertmanager](/blog/prometheus-alertmanager-vps/).

---

## Что смотреть

- CPU steal time (noisy neighbor на VPS)
- Disk latency
- RAM pressure / swap
- Network drops

При проблемах — [journalctl](/blog/journalctl-logi-linux-vps/) и [логи Nginx](/blog/nginx-logi-i-oshibki/).

---

## Итог

Netdata — лучший «первый взгляд» на VPS. Ставьте в первый день, дополняйте Prometheus позже.

VPS — [StormNet Cloud](https://stormnetcloud.com/). Полный стек — [Grafana](/blog/grafana-prometheus-vps/).
