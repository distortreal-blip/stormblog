---
title: "BookStack на VPS: wiki и база знаний команды"
description: "BookStack wiki на VPS: Docker, книги/полки/главы, права доступа, LDAP. Self-hosted документация для команды и DevOps."
pubDate: 2026-07-05
category: DevOps
keywords:
  - "BookStack VPS"
  - "wiki self-hosted"
  - "база знаний"
  - "team docs"
  - "DevOps документация"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** BookStack — wiki с WYSIWYG-редактором: полки → книги → главы. На VPS 1–2 GB: Docker + MariaDB, [SSL](/blog/ssl-letsencrypt-vps/), бэкапы.

Runbook'и, onboarding, API-доки — лучше в своей wiki, чем в Notion/Google Docs с vendor lock-in.

---

## BookStack vs Outline vs Confluence

| | BookStack | Outline | Confluence |
| --- | --- | --- | --- |
| Self-hosted | Да | Да | Cloud/SERVER |
| WYSIWYG | Да | Markdown | Да |
| RAM | 1 GB+ | 2 GB+ | SaaS |
| LDAP/OAuth | Да | Да | Да |

SSO — [Authentik](/blog/authentik-sso-vps/) или OAuth provider.

---

## Docker Compose

```yaml
services:
  bookstack:
    image: lscr.io/linuxserver/bookstack:latest
    environment:
      - PUID=1000
      - PGID=1000
      - APP_URL=https://wiki.example.com
      - DB_HOST=bookstack_db
      - DB_DATABASE=bookstack
      - DB_USERNAME=bookstack
      - DB_PASSWORD=secret
    volumes:
      - ./bookstack:/config
    ports:
      - "127.0.0.1:6875:80"
    depends_on:
      - bookstack_db

  bookstack_db:
    image: mariadb:11
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: bookstack
      MYSQL_USER: bookstack
      MYSQL_PASSWORD: secret
    volumes:
      - ./db:/var/lib/mysql
```

Nginx reverse proxy + Let's Encrypt.

---

## Структура документации

- **Полка:** DevOps, Backend, Onboarding
- **Книга:** «VPS runbooks», «Deploy Laravel»
- **Глава:** «SSL renew fails», «Restore from Restic»

Ссылка на внешние гайды — ваш [блог](/blog/) или internal mirror.

---

## Права и роли

- Admin — настройки
- Editor — создание/редактирование
- Viewer — только чтение

Для команды 3–10 человек — достаточно ролей BookStack.

---

## Бэкапы

```bash
# MariaDB dump + /config volume
mysqldump -u bookstack -p bookstack > wiki-backup.sql
tar czf bookstack-config.tar.gz ./bookstack
```

[Restic](/blog/restic-backup-vps/) на [MinIO](/blog/minio-s3-na-vps/).

---

## Поиск

Встроенный поиск по заголовкам и тексту. Для большого объёма — [Meilisearch](/blog/meilisearch-poisk-na-vps/) как external index (опционально).

---

## Итог

BookStack на VPS — wiki за вечер. Docker, MariaDB, SSL — и команда пишет runbook'и в одном месте.

VPS 1–2 GB — [StormNet Cloud](https://stormnetcloud.com/). Секреты — [Vault](/blog/vault-secrets-vps/). Git-доки — [Gitea](/blog/gitea-git-server-vps/).
