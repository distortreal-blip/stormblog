---
title: "Мониторинг VPS: Uptime Kuma, Grafana и алерты в Telegram"
description: "Настраиваем мониторинг VPS с нуля: Uptime Kuma для проверки доступности, Grafana для метрик, алерты в Telegram. Практическая схема для одного сервера и небольшой инфраструктуры."
pubDate: 2026-07-06
category: DevOps
keywords:
  - "мониторинг vps"
  - "uptime kuma"
  - "grafana vps"
  - "алерты telegram"
  - "prometheus"
  - "node exporter"
  - "devops monitoring"
heroImage: ./cover.png
---

Сервер упал ночью — вы узнали от клиента. Так бывает без мониторинга. Uptime Kuma проверяет доступность сервисов, Grafana показывает метрики CPU и RAM, Telegram-бот шлёт алерт за секунды. Соберём рабочий стек на одном VPS или отдельном monitoring-сервере.

Для одного-двух VPS достаточно лёгкой схемы без Kubernetes и тяжёлого Prometheus-кластера. Расширим её по мере роста.

---

## Uptime Kuma: проверка доступности

Uptime Kuma — self-hosted альтернатива UptimeRobot. Ставится через Docker за 5 минут:

```bash
docker run -d --restart=always \
  -p 3001:3001 \
  -v uptime-kuma:/app/data \
  --name uptime-kuma \
  louislam/uptime-kuma:1
```

Откройте `http://IP:3001`, создайте админа. Добавьте мониторы:

- **HTTP(s)** — главная страница сайта, API health endpoint
- **TCP Port** — SSH (22), PostgreSQL (5432) — проверка, что порт отвечает
- **Ping** — базовая доступность VPS
- **Docker Container** — если Uptime Kuma видит Docker socket

Интервал проверки: 60 секунд для критичных сервисов, 300 — для второстепенных. Настройте retries: 3 неудачи подряд → алерт, чтобы не спамить при кратковременных сбоях.

Status page — публичная страница статуса для клиентов. Полезно для SaaS и агентств.

---

## Алерты в Telegram из Uptime Kuma

В настройках Uptime Kuma → Notifications → Telegram:

- Создайте бота через @BotFather
- Получите chat_id через @userinfobot или API
- Вставьте token и chat_id в Uptime Kuma
- Привяжите notification к каждому монитору

Формат алерта:

```
🔴 [DOWN] api.example.com
HTTP 502 — Bad Gateway
Time: 2026-07-05 03:14 UTC
```

При восстановлении приходит зелёный UP. Для команды создайте групповой чат и добавьте бота — все получат алерт одновременно.

Альтернатива: webhook на свой скрипт, который форматирует сообщение и шлёт в Slack, Discord или email.

---

## Grafana + Prometheus: метрики VPS

Uptime Kuma отвечает на вопрос «сервис жив?». Grafana отвечает «почему тормозит?». Минимальный стек:

**node_exporter** на каждом VPS — отдаёт метрики CPU, RAM, disk, network:

```bash
docker run -d --name node-exporter \
  --net="host" --pid="host" \
  -v /:/host:ro,rslave \
  quay.io/prometheus/node-exporter:latest \
  --path.rootfs=/host
```

**Prometheus** — собирает метрики каждые 15 секунд. **Grafana** — визуализация и алерты.

docker-compose для monitoring-стека:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - promdata:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafanadata:/var/lib/grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}

volumes:
  promdata:
  grafanadata:
```

В `prometheus.yml` добавьте targets — IP ваших VPS с портом 9100 (node_exporter).

---

## Дашборды и алерты в Grafana

Импортируйте готовый dashboard: ID **1860** (Node Exporter Full) — покрывает 95% потребностей.

Ключевые панели:

- CPU usage — алерт при >85% более 5 минут
- Memory available — алерт при <10% свободной RAM
- Disk usage — алерт при >80% заполнения
- Network traffic — аномальные всплески (DDoS, утечка)

Alert rules в Grafana → Contact points → Telegram:

- URL: `https://api.telegram.org/bot<TOKEN>/sendMessage`
- Настройте template с переменными `$labels` и `$values`

Пример правила: `100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85`

---

## Архитектура для нескольких VPS

Рекомендуемая схема:

- **Monitoring VPS** (1 vCPU, 1 ГБ) — Uptime Kuma + Grafana + Prometheus
- **Production VPS** — node_exporter, ваши сервисы
- **Staging VPS** — те же мониторы, другие пороги алертов

Не ставьте мониторинг на тот же VPS, который мониторите — при падении сервера вы не получите алерт. Отдельный дешёвый VPS за 200 ₽/мес решает проблему.

Для 5+ серверов добавьте Loki для логов и Alertmanager для маршрутизации алертов по severity.

---

## Практические советы

- Тестируйте алерты: `systemctl stop nginx` и проверьте, что Telegram получил сообщение за 2 минуты
- Настройте silence на время плановых работ — иначе false positive
- Храните promdata и uptime-kuma data в Docker volumes с бэкапом
- Закройте Grafana и Prometheus за VPN или basic auth — не выставляйте 9090 наружу
- Добавьте мониторинг SSL-сертификатов в Uptime Kuma — истечение cert ломает HTTPS тихо

Минимальный бюджет времени: 2–3 часа на полную настройку стека для 2–3 VPS.

---

## Итог

Uptime Kuma закрывает вопрос доступности, Grafana + node_exporter — вопрос производительности. Telegram-алерты связывают всё в систему, которая будит вас раньше клиентов. Начните с Uptime Kuma и пяти HTTP-мониторов — это 30 минут. Метрики добавите, когда поймаете первый инцидент «сервер жив, но CPU 100%».

Для monitoring-VPS хватит минимального тарифа — посмотрите Storm Cloud, если нужен отдельный недорогой сервер под Uptime Kuma без лишних наворотов.
