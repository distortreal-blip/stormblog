---
title: "GitHub Actions с нуля: CI/CD для pet-проекта"
description: "Пошаговый CI/CD на GitHub Actions для pet-проекта: тесты, линтер, сборка Docker и деплой на VPS. Workflow YAML, секреты, кэш и типичные ошибки новичков."
pubDate: 2026-07-06
category: DevOps
keywords:
  - "github actions"
  - "ci cd"
  - "pet project deploy"
  - "автоматизация деплоя"
  - "github workflow yaml"
  - "deploy на vps"
  - "continuous integration"
heroImage: ./cover.webp
---

Pet-проект живёт, пока деплой не превращается в ритуал с ручным scp и молитвой «надеюсь, на сервере всё поднимется». GitHub Actions снимает эту боль: push в main — и через три минуты новая версия на VPS. Бесплатные минуты для публичных репозиториев щедрые, для private хватит лимита на небольшой pipeline.

Разберём минимальный, но рабочий CI/CD без Jenkins и без облачного Kubernetes — только YAML, Docker и SSH на ваш cloud/VPS.

---

## Архитектура pipeline

Типичный flow для веб-приложения:

1. **CI** — на каждый push и PR: install, lint, test, build;
2. **CD** — на push в `main`: build image, push в registry, deploy на VPS;
3. **Уведомления** — опционально Telegram/Slack при успехе или падении.

GitHub Actions выполняет jobs на раннерах `ubuntu-latest`. Тяжёлая сборка и тесты — там; финальный деплой — SSH на ваш сервер или pull образа через docker compose.

---

## Первый workflow: тесты и линтер

Создайте `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm test
```

Для Python замените setup на `actions/setup-python` и `pip install -r requirements.txt`. Главное — фиксируйте версии runtime и используйте `cache`, чтобы не качать зависимости каждый раз.

PR без зелёного CI не мержите — привычка окупается с первого «сломанного» коммита.

---

## Сборка Docker-образа

Если приложение в контейнере, добавьте job publish:

```yaml
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest
```

GitHub Container Registry бесплатен для публичных образов; для private настройте права `packages: write` в workflow permissions.

---

## Деплой на VPS по SSH

В Settings → Secrets добавьте:

- `VPS_HOST` — IP или домен;
- `VPS_USER` — deploy-пользователь;
- `VPS_SSH_KEY` — приватный ключ (без passphrase для автоматизации).

Deploy job:

```yaml
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/myapp
            docker compose pull
            docker compose up -d
            docker image prune -f
```

На VPS заранее: Docker, compose-файл с `image: ghcr.io/user/repo:latest`, пользователь в группе `docker`. Отдельный deploy-user с ограниченными правами безопаснее root.

---

## Окружения, секреты и откаты

**Environments** в GitHub (staging/production) позволяют:

- разные secrets для staging-VPS и prod;
- required reviewers перед prod-деплоем;
- protection rules на ветку.

Стратегии деплоя для pet-проекта:

- **Rolling** — `docker compose up -d` достаточно;
- **Откат** — тег `:sha-${GITHUB_SHA}` вместо только `latest`, в SSH скрипте fallback на предыдущий тег;
- **Healthcheck** — curl на `/health` после деплоя, exit 1 при ошибке → Actions помечает job failed.

Не храните `.env` в репозитории — только GitHub Secrets и env на сервере.

---

## Оптимизация и частые ошибки

- **Медленный CI** — включите кэш npm/pip, разделите lint и test параллельными jobs;
- **Secrets в логах** — не echo ключи; Actions маскирует secrets, но будьте аккуратны с отладкой;
- **Permission denied на VPS** — проверьте `authorized_keys` и права на `~/.ssh`;
- **Rate limit GHCR** — авторизация через `GITHUB_TOKEN` обязательна;
- **Бесконечный билд** — `.dockerignore` для node_modules и .git.

Мониторинг: badge `![CI](https://github.com/user/repo/actions/workflows/ci.yml/badge.svg)` в README — мелочь, но дисциплинирует.

---

## Итог

GitHub Actions даёт pet-проекту взрослый CI/CD без отдельного сервера: тесты на каждый PR, автодеплой на VPS после merge в main. Начните с одного workflow на lint+test, добавьте Docker и SSH-deploy, затем environments и tagged releases. Час настройки сэкономит десятки часов ручных выкладок и ночных отладок «почему на проде не так».
