---
title: "code-server на VPS: VS Code в браузере для удалённой разработки"
description: "code-server на VPS: Docker, SSL, Tailscale, extensions и безопасность. Полноценный VS Code в браузере без локальной установки."
pubDate: 2026-07-08
category: DevOps
keywords:
  - "code-server VPS"
  - "VS Code browser"
  - "удалённая разработка"
  - "cloud IDE"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** code-server — VS Code в браузере на [VPS](/blog/choose-vps/). Docker + [SSL](/blog/ssl-letsencrypt-vps/) + [Tailscale](/blog/tailscale-vpn-vps/) или [Authentik](/blog/authentik-sso-vps/). RAM 2 GB+ для комфортной работы.

Нужен IDE с любого устройства — планшет, Chromebook, чужой ноутбук? code-server даёт тот же VS Code, что локально, но код живёт на сервере рядом с [Docker](/blog/docker-compose-vps/) и staging.

---

## code-server vs VS Code SSH vs GitHub Codespaces

| | code-server | [VS Code SSH](/blog/vscode-ssh-vps/) | Codespaces |
| --- | --- | --- | --- |
| Интерфейс | Browser | Desktop VS Code | Browser |
| Setup | Docker на VPS | SSH config | GitHub billing |
| Extensions | Большинство | Все | Ограничено |
| Стоимость | VPS фикс | VPS фикс | Pay per hour |

Для ежедневной работы на своём ноутбуке — VS Code SSH. Для «IDE откуда угодно» — code-server.

---

## Архитектура

```
Browser (iPad, laptop, phone)
        ↓ HTTPS
   Nginx + SSL (+ Authentik forward auth)
        ↓
   code-server container
        ↓
   /home/coder/projects + Docker socket (optional)
```

---

## Требования к VPS

| Нагрузка | RAM | CPU |
| --- | --- | --- |
| Лёгкие проекты (JS, Python) | 2 GB | 2 vCPU |
| TypeScript + LSP + Docker builds | 4 GB | 2–4 vCPU |
| Monorepo + несколько extensions | 8 GB | 4 vCPU |

SSD обязателен — LSP и `node_modules` I/O heavy.

---

## Docker Compose

```yaml
services:
  code-server:
    image: lscr.io/linuxserver/code-server:latest
    restart: unless-stopped
    environment:
      PUID: 1000
      PGID: 1000
      TZ: Europe/Moscow
      PASSWORD: CHANGE_ME
      SUDO_PASSWORD: CHANGE_ME
      DEFAULT_WORKSPACE: /config/workspace
    volumes:
      - ./config:/config
      - ./projects:/config/workspace
    ports:
      - "127.0.0.1:8443:8443"
```

Reverse proxy — [Nginx](/blog/nginx-ili-caddy/) или [Traefik](/blog/traefik-reverse-proxy-vps/).

---

## Nginx + SSL

```nginx
location / {
    proxy_pass https://127.0.0.1:8443;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection upgrade;
    proxy_set_header Accept-Encoding gzip;
    proxy_read_timeout 86400;
}
```

`proxy_read_timeout` — для long-running terminal sessions.

---

## Безопасность (обязательно)

code-server = полный shell на сервере. **Не выставляйте без защиты.**

| Уровень | Метод |
| --- | --- |
| Базовый | Strong password + HTTPS only |
| Лучше | [Tailscale](/blog/tailscale-vpn-vps/) — только VPN mesh |
| Production | [Authentik](/blog/authentik-sso-vps/) forward auth + MFA |
| Firewall | [nftables](/blog/nftables-firewall-vps/) — deny public if Tailscale |

Не монтируйте Docker socket без понимания — container escape = root на VPS.

---

## Extensions и settings sync

Установка через UI как в VS Code. Рекомендуемые:

- **Python / Pylance** — backend dev
- **ESLint / Prettier** — JS/TS
- **GitLens** — git history
- **Remote Containers** — не работает как в desktop; используйте Docker на хосте

Settings Sync: встроенный VS Code sync или dotfiles в git repo.

---

## Git и SSH keys

```bash
ssh-keygen -t ed25519 -C "coder@vps"
cat ~/.ssh/id_ed25519.pub  # → GitHub/GitLab deploy key
```

Для CI — отдельный deploy key read-only. Не reuse personal keys.

---

## Интеграция с dev stack

- **Git server** — [Gitea](/blog/gitea-git-server-vps/)
- **CI/CD** — [GitHub Actions](/blog/github-actions-cicd/) или [Jenkins](/blog/jenkins-ci-cd-vps/)
- **Preview deploy** — [Coolify](/blog/coolify-na-vps/) на том же VPS (осторожно с RAM)
- **Secrets** — [Vault](/blog/vault-secrets-vps/), не .env в git

---

## Performance tips

| Проблема | Решение |
| --- | --- |
| Lag при наборе | Больше RAM, отключите heavy extensions |
| LSP OOM | `typescript.tsserver.maxTsServerMemory` |
| Slow file search | `files.watcherExclude`, .gitignore |
| Terminal disconnect | Nginx timeout, tmux/screen inside |

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| 502 Bad Gateway | code-server running? proxy_pass port |
| Extensions fail | ARM vs x86 image, check architecture |
| Can't save files | PUID/PGID permissions on volume |
| OAuth loop | Authentik redirect URI mismatch |
| High CPU | Indexing — exclude node_modules, vendor |

---

## Multi-user setup

Один code-server = один user. Для команды:

- Отдельный VPS/user на человека, или
- Kubernetes + code-server helm per namespace, или
- VS Code SSH + shared [Gitea](/blog/gitea-git-server-vps/)

Shared single instance — риск: все видят все файлы.

---

## Итог

code-server превращает VPS в cloud IDE. Идеален для travel, demos, onboarding junior на стандартном окружении.

VPS 4 GB — [StormNet Cloud](https://stormnetcloud.com/). Безопасность — [Tailscale](/blog/tailscale-vpn-vps/) + [Authentik](/blog/authentik-sso-vps/). Альтернатива — [VS Code SSH](/blog/vscode-ssh-vps/).
