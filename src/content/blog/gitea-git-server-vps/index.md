---
title: "Gitea на VPS: свой Git-сервер и CI за вечер"
description: "Развёртывание Gitea на VPS: Docker, SSH-ключи, Actions runner, бэкапы репозиториев. Альтернатива GitHub для команды и pet-проектов."
pubDate: 2026-07-13
updatedDate: 2026-07-13
category: DevOps
keywords:
  - "Gitea VPS"
  - "Git сервер"
  - "self-hosted Git"
  - "Gitea Actions"
  - "CI/CD"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Gitea — лёгкий self-hosted Git с веб-UI, PR, issues и Actions. На VPS 1–2 GB RAM: Docker Compose, PostgreSQL, [SSL](/blog/ssl-letsencrypt-vps/) через [Nginx](/blog/nginx-ili-caddy/).

GitHub удобен, но приватные репозитории, лимиты Actions и зависимость от SaaS не всем подходят. Gitea — open-source, данные на вашем [VPS](/blog/choose-vps/).

---

## Gitea vs GitLab vs GitHub

| | Gitea | GitLab CE | GitHub |
| --- | --- | --- | --- |
| RAM минимум | 512 MB–1 GB | 4 GB+ | SaaS |
| Actions/CI | Да (runner) | Да | Да |
| Сложность | Низкая | Высокая | Нулевая |
| Self-hosted | Да | Да | Нет |

Для тяжёлого CI с registry — [GitLab Runner](/blog/gitlab-runner-cicd-vps/). Для лёгкого Git + pet-проекты — Gitea.

---

## Docker Compose

```yaml
# docker-compose.yml
services:
  gitea:
    image: gitea/gitea:latest
    restart: unless-stopped
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=postgres
      - GITEA__database__HOST=db:5432
      - GITEA__database__NAME=gitea
      - GITEA__database__USER=gitea
      - GITEA__database__PASSWD=gitea_secret
    volumes:
      - ./gitea:/data
    ports:
      - "127.0.0.1:3000:3000"
      - "127.0.0.1:2222:22"
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: gitea
      POSTGRES_PASSWORD: gitea_secret
      POSTGRES_DB: gitea
    volumes:
      - ./postgres:/var/lib/postgresql/data
```

Reverse proxy — [Traefik](/blog/traefik-reverse-proxy-vps/) или Nginx. SSH Git через порт 2222.

---

## Первый запуск

1. Откройте `https://git.example.com`
2. Создайте admin, отключите open registration или включите только по invite
3. Добавьте SSH-ключ в Settings → SSH Keys
4. `git clone git@git.example.com:user/repo.git`

---

## Gitea Actions runner

```bash
# На отдельном VPS или том же (не production!)
docker run -d --name gitea-runner \
  -e GITEA_INSTANCE_URL=https://git.example.com \
  -e GITEA_RUNNER_REGISTRATION_TOKEN=TOKEN_FROM_UI \
  -v /var/run/docker.sock:/var/run/docker.sock \
  gitea/act_runner:latest
```

Runner выполняет CI — изолируйте как [GitLab Runner](/blog/gitlab-runner-cicd-vps/). Альтернатива — webhook на [GitHub Actions](/blog/github-actions-cicd/) для mirror.

---

## Бэкапы

```bash
# Ежедневно через cron
tar czf /backup/gitea-$(date +%F).tar.gz ./gitea ./postgres
```

Стратегия [3-2-1](/blog/backup-vps-3-2-1/) + [Restic](/blog/restic-backup-vps/) на [MinIO](/blog/minio-s3-na-vps/).

---

## Безопасность

- Только HTTPS, HSTS
- 2FA для admin
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на Nginx auth
- Не открывайте Docker socket runner'у на prod-сервере приложений

---

## Итог

Gitea на VPS — свой Git за час. 1 GB RAM, Docker, SSL — и команда работает без GitHub. CI через act_runner или внешний pipeline.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). CI/CD — [GitHub Actions](/blog/github-actions-cicd/). Секреты — [Vault](/blog/vault-secrets-vps/).
