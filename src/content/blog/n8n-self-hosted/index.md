---
title: "n8n на своём VPS: автоматизация без Zapier"
description: "Self-hosted n8n на VPS: установка через Docker, webhooks, интеграции с Telegram и Google Sheets. Как заменить Zapier в pet-проекте и сохранить контроль над данными и бюджетом."
pubDate: 2026-07-06
updatedDate: 2026-07-13
category: Облака
keywords:
  - "n8n self hosted"
  - "n8n vps"
  - "автоматизация без zapier"
  - "workflow automation"
  - "n8n docker"
  - "open source automation"
  - "n8n webhook"
heroImage: ./cover.webp
---

Zapier и Make отлично автоматизируют рутину, пока счёт не переваливает за $50/мес, а webhook с персональными данными уходит через чужой SaaS. n8n — open-source альтернатива с визуальным редактором, 400+ интegrаций и self-host на любом VPS. Один инстанс на cloud-сервере закрывает сценарии от «форма → Telegram» до синхронизации CRM и CI-уведомлений.

Fair-code лицензия разрешает бесплатный self-host; платите только за VPS и своё время.

---

## Чем n8n лучше SaaS для своих задач

- **Данные у вас** — workflow и credentials на вашем диске;
- **Без лимита на операции** — ограничение только CPU/RAM VPS;
- **JavaScript в nodes** — кастомная логика без enterprise-тарифа;
- **Webhook и API** — n8n как backend для pet-проекта;
- **Экспорт workflow** — JSON в Git, code review для автоматизаций.

Минус — вы сами админите обновления, бэкапы и HTTPS. Для одного разработчика это 1–2 часа в месяц.

---

## Требования к VPS и установка Docker

Минимум: 2 vCPU, 2 GB RAM, 20 GB SSD. Для десятков активных workflow — 4 GB RAM.

`docker-compose.yml`:

```yaml
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=n8n.example.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.example.com/
      - GENERIC_TIMEZONE=Europe/Moscow
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

Перед production поставьте Nginx/Caddy с Let's Encrypt. Не выставляйте 5678 без TLS — credentials workflow передаются в открытом виде.

Запуск: `docker compose up -d`. Первый визит — создание admin-пользователя.

---

## Первые workflow: от простого к полезному

**Telegram-бот о новых заявках**

1. Trigger: Webhook (POST от формы на сайте).
2. Node Set: нормализация полей.
3. Telegram: Send Message в ваш чат.

**GitHub → Slack/Telegram**

1. Trigger: GitHub Trigger (push, PR).
2. IF: ветка main.
3. HTTP Request или Telegram — уведомление о деплое.

**Google Sheets как лёгкая БД**

1. Schedule Trigger — раз в час.
2. Google Sheets: Read Rows.
3. HTTP Request — sync на ваш API на том же VPS.

Каждый workflow тестируйте кнопкой **Execute Workflow** с mock-данными до активации.

---

## Credentials, секреты и масштабирование

Credentials хранятся зашифрованными (ключ из env `N8N_ENCRYPTION_KEY` — задайте при первом деплое и сохраните в password manager). Бэкап volume `n8n_data` — ежедневный cron + rclone в object storage облака.

Продакшен-практики:

- отдельный subdomain `n8n.example.com`;
- Basic Auth на уровне Nginx как второй фактор;
- `EXECUTIONS_DATA_PRUNE=true` — чистка старых execution;
- для очередей при высокой нагрузке — Redis + worker mode в документации n8n.

Pet-проект на одном контейнере редко упирается в лимиты; при росте перенесите Postgres для executions вместо SQLite default.

---

## n8n vs Zapier: когда что выбрать

| Критерий | n8n self-host | Zapier |
|----------|---------------|--------|
| Стоимость | VPS €5–15/мес | $20–100+/мес |
| Данные | ваш сервер | US/EU SaaS |
| Кастомный код | JS в workflow | ограничено |
| Поддержка | community + docs | SLA |

Zapier выигрывает, если нужны редкие enterprise-коннекторы без возни. n8n — когда автоматизация ядро продукта или чувствительные данные (finance, health, internal tools).

Интеграция с AI: nodes для OpenAI, Ollama на соседнем VPS, HTTP к вашему RAG — pipeline «письмо → классификация → задача в Notion» без кода.

---

## Итог

n8n на своём VPS — рабочая замена Zapier для разработчика и маленькой команды: визуальные workflow, webhooks, полный контроль. Поднимите Docker на cloud-инстансе, настройте HTTPS, сделайте два-три сценария (уведомления, sync, cron) — и подписка на SaaS-автоматизацию станет необязательной. Экспортируйте workflow в Git, бэкапьте volume — и автоматизация станет такой же инфраструктурой, как CI/CD.
