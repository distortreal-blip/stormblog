---
title: "Vaultwarden на VPS: self-hosted менеджер паролей как Bitwarden"
description: "Vaultwarden на VPS: Docker, Nginx, SSL, 2FA, backup sqlite и интеграция с Bitwarden-клиентами. Приватная альтернатива LastPass и 1Password."
pubDate: 2026-07-08
category: DevOps
keywords:
  - "Vaultwarden VPS"
  - "Bitwarden self-hosted"
  - "менеджер паролей"
  - "password manager"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Vaultwarden — лёгкий Rust-сервер, совместимый с клиентами Bitwarden. На VPS 512 MB–1 GB: Docker + [Nginx + SSL](/blog/ssl-letsencrypt-vps/) + ежедневный [backup](/blog/backup-vps-3-2-1/) sqlite.

Пароли команды не должны храниться в SaaS без контроля. Vaultwarden на [вашем VPS](/blog/choose-vps/) даёт end-to-end encryption, официальные mobile/desktop extensions и предсказуемую стоимость.

---

## Vaultwarden vs Bitwarden Cloud vs HashiCorp Vault

| | Vaultwarden | Bitwarden Cloud | [HashiCorp Vault](/blog/vault-secrets-vps/) |
| --- | --- | --- | --- |
| Назначение | Пароли людей | Пароли людей | Secrets для приложений |
| RAM | 512 MB+ | N/A | 2 GB+ |
| Клиенты | Bitwarden apps | Bitwarden apps | API/CLI |
| Стоимость | VPS фикс | $10+/мес org | Self-hosted сложнее |

Не путайте Vaultwarden (Bitwarden-compatible) с HashiCorp Vault — это разные продукты.

---

## Архитектура

```
Bitwarden clients (browser, mobile, desktop)
        ↓ HTTPS
   Nginx reverse proxy + Let's Encrypt
        ↓
   Vaultwarden container (Rocket)
        ↓
   /data/vw.sqlite + attachments volume
```

Данные зашифрованы master password на клиенте — сервер хранит только ciphertext.

---

## Требования к VPS

| Сценарий | RAM | Диск |
| --- | --- | --- |
| Семья 1–5 человек | 512 MB–1 GB | 5 GB |
| Команда 10–50 | 1 GB | 10 GB |
| Организация 100+ | 2 GB + tuning | 20 GB SSD |

CPU: 1 vCPU достаточно. Vaultwarden — один из самых лёгких self-hosted сервисов.

---

## Docker Compose

```yaml
services:
  vaultwarden:
    image: vaultwarden/server:latest
    restart: unless-stopped
    environment:
      DOMAIN: https://vault.example.com
      SIGNUPS_ALLOWED: "false"
      INVITATIONS_ALLOWED: "true"
      ADMIN_TOKEN: CHANGE_ME_LONG_RANDOM
      WEBSOCKET_ENABLED: "true"
    volumes:
      - ./vw-data:/data
    ports:
      - "127.0.0.1:8080:80"
```

После первого admin — `SIGNUPS_ALLOWED=false`, только invite.

---

## Nginx reverse proxy

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /notifications/hub {
    proxy_pass http://127.0.0.1:8080/notifications/hub;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

WebSocket нужен для live sync между устройствами.

---

## Первоначальная настройка

1. Откройте `https://vault.example.com`
2. Создайте первый аккаунт (станет admin)
3. **Settings → Email** — SMTP для invites и 2FA (Postfix или relay)
4. Включите **2FA** (TOTP, YubiKey, Duo)
5. Admin panel: `https://vault.example.com/admin` + `ADMIN_TOKEN`

---

## Организации и sharing

- **Personal vault** — только вы
- **Organization** — shared collections для команды
- **Groups** — granular access внутри org
- **Emergency access** — trusted contact recovery

Для SSO enterprise — рассмотрите [Authentik](/blog/authentik-sso-vps/) (OIDC) или официальный Bitwarden (платный).

---

## Backup (критично!)

Vaultwarden = один sqlite файл + attachments folder.

```bash
# Ежедневно cron
tar czf /backup/vaultwarden-$(date +%F).tar.gz ./vw-data/
```

Стратегия [3-2-1](/blog/backup-vps-3-2-1/): локальный snapshot + [Restic offsite](/blog/restic-backup-vps/). **Тестируйте restore** — без master password backup бесполезен, но структура org восстановится.

---

## Hardening checklist

| Пункт | Зачем |
| --- | --- |
| Fail2ban / [CrowdSec](/blog/crowdsec-zashchita-vps/) | Brute-force login |
| [nftables](/blog/nftables-firewall-vps/) — только 443 | Минимальная поверхность |
| [Tailscale](/blog/tailscale-vpn-vps/) для admin | Admin panel не в public |
| Strong ADMIN_TOKEN | Защита /admin |
| SMTP TLS | Invite links безопасно |

---

## Клиенты и импорт

- Browser: Bitwarden extension → Server URL `https://vault.example.com`
- Mobile: Bitwarden app → Self-hosted environment
- Desktop: Bitwarden desktop → Custom server
- Import: CSV/JSON из LastPass, 1Password, Chrome

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| Sync не работает | WebSocket в Nginx, проверьте /notifications/hub |
| Invalid master password | Клиент шифрует локально — сервер не знает пароль |
| Email не отправляется | SMTP settings, SPF/DKIM домена |
| Attachments 413 | `client_max_body_size 128M;` в Nginx |
| High memory | Старые attachments, vacuum sqlite |

---

## Миграция с Bitwarden Cloud

1. Export vault из cloud (encrypted)
2. Import в self-hosted через клиент
3. Переключите Server URL на свой домен
4. Verify sync на всех устройствах
5. Delete cloud account после проверки

---

## Связка с экосистемой

- Application secrets — [HashiCorp Vault](/blog/vault-secrets-vps/)
- SSO для других сервисов — [Authentik](/blog/authentik-sso-vps/)
- Wiki с runbook — [BookStack](/blog/bookstack-wiki-vps/)

---

## Итог

Vaultwarden — must-have self-hosted сервис для любой команды. Минимальные ресурсы, полная совместимость с Bitwarden-клиентами, E2E encryption.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). Backup — [Restic](/blog/restic-backup-vps/) + [3-2-1](/blog/backup-vps-3-2-1/).
