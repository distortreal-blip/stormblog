---
title: "Coolify на VPS: свой Heroku за один вечер"
description: "Установка Coolify на VPS: деплой из Git, Docker, SSL, базы данных. Self-hosted PaaS для разработчиков без DevOps-команды."
pubDate: 2026-07-04
category: DevOps
keywords:
  - "Coolify VPS"
  - "self-hosted PaaS"
  - "деплой из Git"
  - "Heroku альтернатива"
  - "Docker deploy"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Coolify — self-hosted PaaS на VPS. Установите одной командой, подключите GitHub/GitLab, деплойте приложения с авто SSL. Альтернатива ручному [Docker Compose](/blog/docker-compose-vps/) и [развёртыванию с нуля](/blog/razvernut-sayt-na-vps-2026/).

Не хотите каждый раз настраивать Nginx, SSL и env? Coolify автоматизирует это — как Vercel, но на вашем VPS.

---

## Coolify vs ручной деплой vs Kubernetes

| | Coolify | Ручной Nginx+Docker | k3s |
| --- | --- | --- | --- |
| Время старта | 30 мин | 2–4 часа | 1 день+ |
| Гибкость | Средняя | Полная | Высокая |
| RAM | 2 GB+ | 1 GB+ | 4 GB+ |
| Для кого | Solo dev, малые команды | Опытные | DevOps |

---

## Требования

- Ubuntu 22.04/24.04
- **Минимум 2 GB RAM** (4 GB комфортнее)
- Домен с DNS на VPS
- Порты 80, 443, 8000

Подготовка сервера — [Ubuntu первая настройка](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).

---

## Установка

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Откройте `http://ВАШ_IP:8000`, создайте admin. После настройки домена — HTTPS автоматически.

---

## Деплой приложения из Git

1. New Resource → Application
2. Подключите GitHub/GitLab
3. Выберите репозиторий и ветку
4. Coolify определит Dockerfile или buildpack
5. Задайте домен → SSL готов

Поддерживает: Node.js, Python, PHP, Go, static sites, Docker Compose.

---

## Базы данных в Coolify

Встроенные PostgreSQL, MySQL, Redis, MongoDB — один клик. Для production с большими данными — отдельный VPS с [PostgreSQL tuning](/blog/postgresql-tuning-vps/).

---

## Несколько проектов на одном VPS

| VPS | Проектов |
| --- | --- |
| 2 GB | 2–3 лёгких |
| 4 GB | 5–8 |
| 8 GB | 10+ |

Мониторьте RAM через [Grafana](/blog/grafana-prometheus-vps/) — Coolify сам не покажет узкие места.

---

## Безопасность

- Смените дефолтный порт после настройки
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на SSH
- Не храните production БД без бэкапов — [правило 3-2-1](/blog/backup-vps-3-2-1/)
- Обновляйте Coolify регулярно

---

## Coolify vs Portainer

[Portainer](/blog/portainer-docker-vps/) — управление контейнерами. Coolify — полный деплой-пайплайн из Git. Можно использовать вместе.

---

## Итог

Coolify снижает порог входа на VPS до уровня PaaS. Идеален для pet-проектов, staging и малых production.

VPS от 4 GB — [StormNet Cloud](https://stormnetcloud.com/). CI/CD вручную — [GitHub Actions](/blog/github-actions-cicd/).
