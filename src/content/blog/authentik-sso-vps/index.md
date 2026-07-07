---
title: "Authentik SSO на VPS: единый вход для сервисов"
description: "Authentik на VPS: OAuth2/OIDC, SAML, LDAP outpost. Single Sign-On для Gitea, Grafana, BookStack и своих приложений."
pubDate: 2026-07-07
category: DevOps
keywords:
  - "Authentik SSO"
  - "OAuth VPS"
  - "single sign-on"
  - "OIDC self-hosted"
  - "identity provider"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Authentik — IdP (Identity Provider) self-hosted. Один логин для [Grafana](/blog/grafana-prometheus-vps/), [Gitea](/blog/gitea-git-server-vps/), [BookStack](/blog/bookstack-wiki-vps/). Docker Compose на VPS 2 GB.

Вместо 10 паролей на internal tools — SSO + 2FA в одном месте.

---

## Authentik vs Keycloak

| | Authentik | Keycloak |
| --- | --- | --- |
| UI/UX | Современный | Enterprise |
| RAM | 2 GB | 2–4 GB |
| Outpost (reverse proxy auth) | Да | Да |
| Learning curve | Средняя | Высокая |

Секреты приложений — [Vault](/blog/vault-secrets-vps/) или Authentik vault.

---

## Docker Compose (минимум)

```yaml
services:
  authentik-server:
    image: ghcr.io/goauthentik/server:latest
    command: server
    environment:
      AUTHENTIK_SECRET_KEY: changeme-generate-long-key
      AUTHENTIK_POSTGRESQL__HOST: postgresql
      AUTHENTIK_REDIS__HOST: redis
    ports:
      - "127.0.0.1:9000:9000"
    volumes:
      - ./media:/media
      - ./templates:/templates

  authentik-worker:
    image: ghcr.io/goauthentik/server:latest
    command: worker
    environment:
      AUTHENTIK_SECRET_KEY: changeme-generate-long-key
      AUTHENTIK_POSTGRESQL__HOST: postgresql
      AUTHENTIK_REDIS__HOST: redis

  postgresql:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_USER: authentik
      POSTGRES_DB: authentik

  redis:
    image: redis:alpine
```

`https://auth.example.com` через [Traefik](/blog/traefik-reverse-proxy-vps/) + [SSL](/blog/ssl-letsencrypt-vps/).

---

## Первый admin

Откройте setup wizard, создайте admin, включите 2FA (TOTP).

---

## OAuth2 для приложения

1. Authentik → Applications → Provider (OAuth2/OIDC)
2. Redirect URI: `https://grafana.example.com/login/generic_oauth`
3. Application → bind provider
4. В Grafana `grafana.ini` — generic_oauth config

То же для Gitea, BookStack, [Portainer](/blog/portainer-docker-vps/).

---

## Forward auth (outpost)

Authentik Outpost перед [Nginx](/blog/nginx-ili-caddy/) — защита internal admin без правок каждого app:

```
User → Nginx → Authentik outpost → App (headers X-authentik-*)
```

---

## Безопасность

- Только HTTPS
- 2FA обязательна для admin
- Не открывайте Authentik без rate limit — [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/)
- Admin через [Tailscale](/blog/tailscale-vpn-vps/) (опционально)

---

## Итог

Authentik на VPS — свой SSO для internal stack. OAuth2 + 2FA + один login для всей инфраструктуры.

VPS 2 GB — [StormNet Cloud](https://stormnetcloud.com/). VPN — [WireGuard](/blog/wireguard-vpn-na-vps/). Мониторинг auth — [Loki logs](/blog/loki-grafana-logi-vps/).
