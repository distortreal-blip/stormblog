---
title: "HashiCorp Vault на VPS: хранение секретов"
description: "Vault self-hosted на VPS: API keys, DB passwords, rotation. Централизованные секреты для приложений и CI/CD."
pubDate: 2026-07-12
category: Безопасность
keywords:
  - "Vault VPS"
  - "HashiCorp Vault"
  - "secrets management"
  - "секреты приложения"
  - "Vault Docker"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Vault хранит секреты централизованно: приложение запрашивает DB password по token, не из .env в git. Self-hosted на VPS — для команд без облачного Secrets Manager.

.env на диске — риск. [Restic](/blog/restic-backup-vps/) бэкапит файлы, но секреты не должны лежать в plaintext.

---

## Vault vs .env vs Docker secrets

| | Vault | .env file | Docker secrets |
| --- | --- | --- | --- |
| Rotation | Да | Вручную | Сложно |
| Audit log | Да | Нет | Нет |
| Сложность | Высокая | Низкая | Средняя |
| Single VPS | Overkill? | OK | OK |

Для solo dev на одном VPS — .env + [Tailscale](/blog/tailscale-vpn-vps/) достаточно. Vault — 3+ сервиса, команда.

---

## Dev mode (только тест)

```bash
docker run -d --name vault -p 8200:8200 \
  -e VAULT_DEV_ROOT_TOKEN_ID=dev-token \
  hashicorp/vault
```

Production — Raft storage, TLS, unseal keys.

---

## Запись секрета

```bash
export VAULT_ADDR='https://vault.example.com'
vault kv put secret/myapp db_password=xxx api_key=yyy
vault kv get secret/myapp
```

Приложение — AppRole auth, periodic token.

---

## Интеграция CI/CD

[GitLab Runner](/blog/gitlab-runner-cicd-vps/) и [GitHub Actions](/blog/github-actions-cicd/) получают секреты из Vault в runtime — не в repository secrets.

---

## Безопасность

- TLS обязателен ([certbot DNS](/blog/certbot-dns-ssl-vps/))
- Unseal keys offline
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) + [CrowdSec](/blog/crowdsec-zashchita-vps/)
- Бэкап Raft — [Restic](/blog/restic-backup-vps/)

---

## Итог

Vault — enterprise-grade secrets. На одном VPS редко нужен; при росте инфраструктуры — must-have.

VPS 2 GB+ — [StormNet Cloud](https://stormnetcloud.com/). Базовая безопасность — [защита VPS](/blog/zashchita-vps-ot-vzloma/).
