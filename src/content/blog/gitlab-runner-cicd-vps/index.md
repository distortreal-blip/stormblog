---
title: "GitLab Runner на VPS: свой CI/CD pipeline"
description: "Настройка GitLab Runner на VPS: shell и Docker executor, .gitlab-ci.yml, деплой на staging/production. Альтернатива GitHub Actions на своём железе."
pubDate: 2026-07-09
category: DevOps
keywords:
  - "GitLab Runner VPS"
  - "CI/CD self-hosted"
  - "GitLab CI"
  - "деплой pipeline"
  - "GitHub Actions альтернатива"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** GitLab Runner на VPS выполняет CI/CD jobs: тесты, сборка, деплой. Зарегистрируйте runner в GitLab, выберите Docker executor, опишите pipeline в `.gitlab-ci.yml`.

Self-hosted CI/CD — когда [GitHub Actions](/blog/github-actions-cicd/) минут не хватает, нужны приватные runners или деплой во внутреннюю сеть.

---

## GitLab Runner vs GitHub Actions

| | GitLab Runner (VPS) | GitHub Actions |
| --- | --- | --- |
| Хостинг | Ваш VPS | GitHub |
| Стоимость | VPS + время | Free tier / pay per minute |
| Доступ к internal network | Прямой | Через self-hosted runner |
| Экосистема | GitLab-centric | GitHub-centric |

---

## Требования к VPS

| Нагрузка | RAM | Диск |
| --- | --- | --- |
| Малые проекты | 2 GB | 40 GB |
| Docker builds | 4 GB | 80 GB |
| Несколько проектов | 8 GB | 100 GB+ |

Docker executor съедает RAM при параллельных jobs.

---

## Установка Runner

```bash
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt install gitlab-runner -y
```

Регистрация:

```bash
sudo gitlab-runner register
# URL: https://gitlab.com
# Token: из Settings → CI/CD → Runners
# Executor: docker
# Image: docker:24
```

---

## Docker executor config

```toml
# /etc/gitlab-runner/config.toml
[[runners]]
  name = "vps-runner"
  executor = "docker"
  [runners.docker]
    image = "node:20"
    privileged = false
    volumes = ["/cache"]
```

```bash
sudo gitlab-runner restart
```

---

## Пример .gitlab-ci.yml

```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"

test:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy_production:
  stage: deploy
  script:
    - rsync -avz dist/ deploy@VPS:/var/www/app/
    - ssh deploy@VPS 'pm2 reload app'
  only:
    - main
```

Деплой [Next.js](/blog/nextjs-deploy-na-vps/) или [Node.js](/blog/nodejs-pm2-deploy/) — аналогично.

---

## Shell executor (проще, но менее изолирован)

Runner выполняет команды напрямую на VPS — быстрее, но job'ы видят всю систему. Только для доверенных репозиториев.

---

## Безопасность

- Отдельный VPS для runner, не production
- `privileged = false` в Docker executor
- Protected branches + manual deploy
- SSH deploy keys с ограниченными правами
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) + [UFW](/blog/ubuntu-24-04-pervaya-nastroyka-vps/)

---

## Кэш и ускорение

```yaml
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
```

Docker layer cache — mount `/var/run/docker.sock` (осторожно с безопасностью).

---

## Мониторинг pipeline

- GitLab CI/CD analytics
- Алерты при failed pipeline → Telegram
- Runner health — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)

---

## Итог

GitLab Runner на VPS — полный контроль над CI/CD. Docker executor для изоляции, rsync/ssh для деплоя на [production VPS](/blog/razvernut-sayt-na-vps-2026/).

VPS для runner — [StormNet Cloud](https://stormnetcloud.com/). IaC — [Terraform](/blog/terraform-vps-infrastruktura/) + [Ansible](/blog/ansible-avtomatizaciya-servera/).
