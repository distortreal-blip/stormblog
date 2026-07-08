---
title: "Matrix Synapse на VPS: полный гайд по self-hosted мессенджеру"
description: "Matrix Synapse + Element на VPS: Docker, PostgreSQL, TURN, federation, SSL, E2E encryption, бэкапы и hardening. Альтернатива Slack и Telegram для команд."
pubDate: 2026-07-08
category: DevOps
keywords:
  - "Matrix Synapse VPS"
  - "Element messenger"
  - "self-hosted chat"
  - "Slack alternative"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Matrix — децентрализованный протокол чата с E2E encryption. Synapse — reference homeserver. Stack на VPS 4 GB+: Synapse + PostgreSQL + [coturn TURN](/blog/ssl-letsencrypt-vps/) + Element Web + [Nginx SSL](/blog/nginx-ili-caddy/) + [бэкапы](/blog/backup-vps-3-2-1/).

Slack/Telegram для рабочих переписок — vendor lock-in и чужие серверы. Matrix на [вашем VPS](/blog/choose-vps/) = rooms, threads, bridges, federation с другими серверами, полный контроль retention и compliance.

Это **максимально подробный** практический гайд: от нуля до production federation за один вечер.

---

## Содержание roadmap

1. Архитектура и компоненты
2. Требования к VPS и sizing
3. DNS и подготовка сервера
4. PostgreSQL production setup
5. Synapse Docker Compose (full)
6. coturn TURN для звонков
7. Element Web client
8. Nginx reverse proxy + SSL
9. Регистрация, rooms, spaces
10. Federation с другими серверами
11. Bridges (Telegram, IRC, Slack)
12. E2E encryption и key backup
13. SSO через Authentik
14. Moderation и admin API
15. Backup и disaster recovery
16. Monitoring и logs
17. Performance tuning
18. Security hardening checklist
19. Troubleshooting (30+ кейсов)
20. Migration из Slack/Telegram

---

## Matrix vs Slack vs Telegram vs Discord

| Критерий | Matrix (Synapse) | Slack | Telegram | Discord |
| --- | --- | --- | --- | --- |
| Self-hosted | Да | Нет | Нет | Нет |
| E2E default | Rooms optional E2E | Нет | Secret chats only | Нет |
| Federation | Да (server-to-server) | Нет | Нет | Нет |
| Open protocol | Да | Нет | Нет | Нет |
| Bridges | mautrix, many | Limited | Bots | Bots |
| RAM (self-host) | 4 GB+ | N/A | N/A | N/A |
| Mobile apps | Element, FluffyChat | Native | Native | Native |
| Compliance | Your data | US cloud | UAE/RU issues | US cloud |
| Threads | Да (threads) | Да | Topics | Forum channels |
| Voice/Video | Matrix RTC + Element Call | Native | Native | Native |

Matrix сложнее в setup, но единственный enterprise-grade open protocol с federation.

---

## Архитектура production stack

```
                    Internet
                       ↓
              Nginx (443) + Let's Encrypt
                 ↙          ↘
        Element Web      Synapse :8008
        (static)              ↓
                         PostgreSQL
                              ↓
                    Media store (/data/media)
                              ↓
              coturn TURN (3478) — VoIP relay
                              ↓
         Optional: [Authentik SSO](/blog/authentik-sso-vps/)
```

**Federation traffic** идёт напрямую server-to-server на `:8448` (или через 443 delegated SRV).

---

## Компоненты и роли

| Компонент | Назначение | Обязателен? |
| --- | --- | --- |
| **Synapse** | Homeserver, rooms, events | Да |
| **PostgreSQL** | Event store, state | Да (не SQLite в prod) |
| **coturn** | TURN/STUN для звонков за NAT | Для VoIP — да |
| **Element Web** | Web client | Рекомендуется |
| **Redis** | Cache (optional Synapse 1.x+) | 50+ users |
| **Synapse Admin API** | User/room management | Admin |
| **Maubot / bridges** | Telegram, Slack bridge | Optional |

---

## Требования к VPS

| Масштаб | Users | RAM | CPU | Disk | Bandwidth |
| --- | --- | --- | --- | --- | --- |
| Personal / семья | 5–20 | 2 GB | 2 vCPU | 20 GB SSD | 100 GB/mo |
| Малый team | 20–100 | 4 GB | 2–4 vCPU | 50 GB SSD | 500 GB/mo |
| Средний | 100–500 | 8 GB | 4 vCPU | 100 GB NVMe | 1 TB/mo |
| Large | 500+ | 16 GB+ | 8 vCPU | 200 GB+ NVMe | Dedicated |

**Не ставьте Synapse на 1 GB RAM** — OOM при media upload и federation sync.

Disk растёт от media (фото, файлы в rooms). Retention policy критична.

---

## DNS записи (до установки)

Для домена `matrix.example.com`:

| Тип | Имя | Значение |
| --- | --- | --- |
| A | matrix.example.com | VPS_IP |
| A | turn.example.com | VPS_IP |
| SRV | _matrix._tcp | matrix.example.com:443 (delegation) |
| TXT | _matrix | v=matrix1 (verification) |

**Federation port:** либо `:8448` открыт, либо `.well-known` delegation на 443:

```json
// https://matrix.example.com/.well-known/matrix/server
{"m.server": "matrix.example.com:443"}

// https://matrix.example.com/.well-known/matrix/client
{"m.homeserver": {"base_url": "https://matrix.example.com"}}
```

Проверка: `curl https://matrix.example.com/.well-known/matrix/server`

---

## Подготовка VPS

```bash
# Ubuntu 24.04
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx

# Firewall
sudo nft add rule inet filter input tcp dport { 22, 80, 443, 8448, 3478, 5349 } accept
# или см. [nftables гайд](/blog/nftables-firewall-vps/)
```

Hostname: `matrix.example.com`. Timezone UTC. Swap 2 GB если RAM 4 GB.

---

## PostgreSQL (отдельный container)

```yaml
# docker-compose.yml — postgres service
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: synapse
      POSTGRES_PASSWORD: STRONG_DB_PASSWORD
      POSTGRES_DB: synapse
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --lc-collate=C --lc-ctype=C"
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U synapse"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Tuning** для 4 GB VPS (postgresql.conf overrides):

```
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
work_mem = 8MB
max_connections = 100
```

Подробнее — [PostgreSQL tuning](/blog/postgresql-tuning-vps/).

---

## Synapse: генерация config

```bash
mkdir -p synapse-data
docker run -it --rm \
  -v ./synapse-data:/data \
  -e SYNAPSE_SERVER_NAME=matrix.example.com \
  -e SYNAPSE_REPORT_STATS=no \
  matrixdotorg/synapse:latest generate
```

Редактируем `homeserver.yaml`:

```yaml
server_name: "matrix.example.com"
public_baseurl: "https://matrix.example.com/"
pid_file: /data/homeserver.pid

listeners:
  - port: 8008
    tls: false
    type: http
    x_forwarded: true
    resources:
      - names: [client, federation]
        compress: false

database:
  name: psycopg2
  args:
    user: synapse
    password: STRONG_DB_PASSWORD
    database: synapse
    host: postgres
    cp_min: 5
    cp_max: 10

media_store_path: /data/media
uploads_path: /data/uploads
max_upload_size: 50M

enable_registration: false
enable_registration_without_verification: false
registration_shared_secret: "RANDOM_SECRET_FOR_ADMIN_REGISTER"

# Rate limits
rc_message:
  per_second: 0.2
  burst_count: 10

# Federation
federation_domain_whitelist: []  # empty = all
allow_public_rooms_without_auth: false

# Email (optional, for password reset)
email:
  enable_notifs: true
  smtp_host: smtp.example.com
  smtp_port: 587
  smtp_user: "matrix@example.com"
  smtp_pass: "SMTP_PASSWORD"
  notif_from: "Matrix <matrix@example.com>"

# TURN
turn_uris:
  - "turn:turn.example.com:3478?transport=udp"
  - "turn:turn.example.com:3478?transport=tcp"
  - "turns:turn.example.com:5349?transport=tcp"
turn_shared_secret: "TURN_SECRET_MATCH_COTURN"
turn_user_lifetime: 86400000
```

---

## Полный Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: synapse
      POSTGRES_PASSWORD: STRONG_DB_PASSWORD
      POSTGRES_DB: synapse
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    networks:
      - matrix

  synapse:
    image: matrixdotorg/synapse:latest
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./synapse-data:/data
    ports:
      - "127.0.0.1:8008:8008"
    networks:
      - matrix

  coturn:
    image: coturn/coturn:latest
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./coturn/turnserver.conf:/etc/coturn/turnserver.conf

  element:
    image: vectorim/element-web:latest
    restart: unless-stopped
    volumes:
      - ./element-config.json:/app/config.json
    ports:
      - "127.0.0.1:8080:80"
    networks:
      - matrix

networks:
  matrix:
```

---

## coturn configuration

```conf
# turnserver.conf
listening-port=3478
tls-listening-port=5349
fingerprint
use-auth-secret
static-auth-secret=TURN_SECRET_MATCH_COTURN
realm=turn.example.com
total-quota=100
stale-nonce=600
cert=/etc/letsencrypt/live/turn.example.com/fullchain.pem
pkey=/etc/letsencrypt/live/turn.example.com/privkey.pem
no-multicast-peers
no-cli
```

Без TURN — Element Call и video не работают за symmetric NAT (большинство mobile networks).

---

## Element Web config.json

```json
{
  "default_server_config": {
    "m.homeserver": {
      "base_url": "https://matrix.example.com",
      "server_name": "matrix.example.com"
    }
  },
  "brand": "Company Chat",
  "disable_guests": true,
  "integrations_ui_url": "https://scalar.vector.im/",
  "integrations_rest_url": "https://scalar.vector.im/api",
  "bug_report_endpoint_url": "https://element.io/bugreports/submit",
  "defaultCountryCode": "RU",
  "showLabsSettings": true,
  "features": {
    "feature_video_rooms": true
  }
}
```

Host Element на `chat.example.com` или `element.matrix.example.com`.

---

## Nginx configuration (complete)

```nginx
# matrix.example.com — Synapse
server {
    listen 443 ssl http2;
    server_name matrix.example.com;

    ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/matrix.example.com/privkey.pem;

    location /.well-known/matrix/server {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{"m.server": "matrix.example.com:443"}';
    }

    location /.well-known/matrix/client {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{"m.homeserver":{"base_url":"https://matrix.example.com"}}';
    }

    location ~* ^(\/_matrix|\/_synapse) {
        proxy_pass http://127.0.0.1:8008;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        client_max_body_size 50M;
        proxy_read_timeout 600s;
    }
}

# chat.example.com — Element Web
server {
    listen 443 ssl http2;
    server_name chat.example.com;

    ssl_certificate /etc/letsencrypt/live/chat.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
    }
}
```

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/) или [Certbot DNS](/blog/certbot-dns-ssl-vps/) для wildcard.

---

## Создание первого admin user

```bash
# Регистрация через shared secret (enable_registration: false в yaml)
register_new_matrix_user -c synapse-data/homeserver.yaml http://localhost:8008

# Или через Docker:
docker exec -it synapse-synapse-1 register_new_matrix_user \
  -c /data/homeserver.yaml http://localhost:8008
```

Сразу: **Settings → Security → Cross-signing** + **Secure backup** для E2E.

Invite-only policy:

```yaml
enable_registration: false
# Создавайте users через admin API или register CLI
```

---

## Rooms, Spaces, организация

| Концепция | Аналог Slack | Описание |
| --- | --- | --- |
| Room | Channel | Чат, public/private |
| Space | Workspace section | Группа rooms |
| Thread | Thread | Reply chain |
| DM | DM | 1:1 encrypted |
| Power levels | Permissions | Admin, mod, user |

**Space для команды:**

1. Create Space → Private
2. Add rooms: #general, #dev, #ops, #random
3. Invite by @user:matrix.example.com
4. Pin important messages, enable E2E for sensitive rooms

**Public room discovery** — отключите в production (`allow_public_rooms_without_auth: false`).

---

## Federation

Federation позволяет писать пользователям на других серверах: `@user:matrix.org`, `@user:company.com`.

**Проверка federation:**

```bash
# С вашего сервера
curl "https://matrix.example.com/_matrix/federation/v1/version"

# External test
# https://federationtester.matrix.org/
```

**Whitelist federation** (если только internal):

```yaml
federation_domain_whitelist:
  - matrix.example.com
  - partner-company.com
```

**Disable federation completely:**

```yaml
federation_domain_whitelist:
  - matrix.example.com  # only self
```

---

## Bridges: Telegram, Slack, IRC

**mautrix-telegram** — двусторонний bridge Telegram ↔ Matrix.

```yaml
# Отдельный container mautrix-telegram
# config.yaml: homeserver address, appservice registration
# Регистрация appservice в Synapse: app_service_config_files
```

Workflow:

1. Deploy mautrix bridge container
2. Generate registration.yaml
3. Add to Synapse `app_service_config_files`
4. Restart Synapse
5. Login Telegram bot in bridge DM
6. `!tg login` → link rooms

Аналогично: **mautrix-slack**, **mautrix-discord**, **matrix-appservice-irc**.

Bridges ломают E2E (bridge видит plaintext) — отдельные rooms для bridged content.

---

## E2E Encryption deep dive

| Уровень | Что шифруется | Кто не видит |
| --- | --- | --- |
| TLS transport | Client ↔ Server | Network sniffers |
| E2E room | Messages in room | Server admin |
| DM default | 1:1 messages | Server |

**Cross-signing** — verify devices, prevent MITM.

**Key backup passphrase** — храните offline. Без backup — потеря всех E2E keys при смене телефона.

Server admin **не может** прочитать E2E rooms — это feature, не bug. Support = user exports.

---

## SSO через Authentik (OIDC)

1. [Authentik](/blog/authentik-sso-vps/) → Application → OAuth2/OIDC
2. Synapse `homeserver.yaml`:

```yaml
oidc_providers:
  - idp_id: authentik
    discover: true
    issuer: "https://auth.example.com/application/o/matrix/"
    client_id: "synapse-client-id"
    client_secret: "secret"
    scopes: ["openid", "profile", "email"]
    user_mapping_provider:
      config:
        localpart_template: "{{ user.preferred_username }}"
        display_name_template: "{{ user.name }}"
```

3. Disable local password login для org users
4. Map groups → Synapse roles via claims (advanced)

---

## Moderation и Synapse Admin API

```bash
# List users
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://matrix.example.com/_synapse/admin/v2/users?guests=false"

# Deactivate user
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://matrix.example.com/_synapse/admin/v1/deactivate/@spam:matrix.example.com"

# Purge room
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"block": true, "purge": true}' \
  "https://matrix.example.com/_synapse/admin/v1/rooms/!roomid:matrix.example.com/delete"
```

Admin token: `homeserver.yaml` → generate via `synapse_admin` or config.

**Moderation policy:** power level 50+ for kick, 100 for ban. Audit log через [Loki](/blog/loki-grafana-logi-vps/).

---

## Media retention и cleanup

Media занимает 80% disk на активных rooms.

```yaml
# homeserver.yaml
media_retention:
  local_media_lifetime: 90d
  remote_media_lifetime: 30d
```

Cron cleanup:

```bash
docker exec synapse-synapse-1 \
  synapse_review_media_storage --before-days 90 --remove
```

Offload старых media в [MinIO S3](/blog/minio-s3-na-vps/) — advanced (S3 storage provider plugins).

---

## Backup и disaster recovery

**Что бэкапить:**

| Компонент | Path | Priority |
| --- | --- | --- |
| PostgreSQL | postgres-data/ | Critical |
| Synapse config | synapse-data/homeserver.yaml | Critical |
| Media store | synapse-data/media/ | High |
| Signing key | synapse-data/*.signing.key | Critical |
| Element config | element-config.json | Medium |

```bash
# PostgreSQL dump
docker exec postgres pg_dump -U synapse synapse | gzip > synapse-db-$(date +%F).sql.gz

# Full tar
tar czf matrix-backup-$(date +%F).tar.gz postgres-data/ synapse-data/ element-config.json
```

Strategy [3-2-1](/blog/backup-vps-3-2-1/) + [Restic offsite](/blog/restic-backup-vps/).

**Restore test quarterly.** Signing key потерян = новый server_name (катастрофа).

---

## Monitoring

| Metric | Tool | Alert |
| --- | --- | --- |
| Synapse up | [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) | HTTP 200 /_matrix/client/versions |
| PostgreSQL connections | [Prometheus](/blog/grafana-prometheus-vps/) | > 80 max |
| Disk usage | node_exporter | > 85% |
| Federation errors | Synapse logs | spike in federation failures |
| TURN allocation | coturn logs | failures |

```yaml
# prometheus scrape synapse metrics (enable in homeserver.yaml)
enable_metrics: true
```

Logs → [Loki + Grafana](/blog/loki-grafana-logi-vps/) или [OpenSearch](/blog/opensearch-logi-vps/).

---

## Performance tuning

| Проблема | Решение |
| --- | --- |
| Slow message send | PostgreSQL indexes, more RAM, Redis cache |
| Federation lag | Check DNS SRV, port 8448, bandwidth |
| High CPU sync | Limit federation partners, worker processes |
| OOM on startup | Increase RAM, reduce `cp_max` db pool |
| Slow media upload | SSD disk, increase `max_upload_size` carefully |

**Synapse workers** (800+ users): split federation, media, client readers на отдельные processes — см. official docs "Workers".

**Redis cache:**

```yaml
redis:
  enabled: true
  host: redis
  port: 6379
```

---

## Security hardening checklist

- [ ] `enable_registration: false` — invite/admin only
- [ ] Strong admin tokens, rotate quarterly
- [ ] [CrowdSec](/blog/crowdsec-zashchita-vps/) + [fail2ban](/blog/fail2ban-ot-bruteforce-vps/)
- [ ] [nftables](/blog/nftables-firewall-vps/) — minimal ports
- [ ] Admin UI/API only via [Tailscale](/blog/tailscale-vpn-vps/)
- [ ] E2E enabled for confidential rooms
- [ ] Federation whitelist if internal-only
- [ ] Regular Synapse updates (security patches)
- [ ] Audit user list monthly
- [ ] Rate limits configured (anti-spam)
- [ ] SMTP TLS for password reset emails
- [ ] No public room directory

---

## Troubleshooting (extended)

| Симптом | Причина | Fix |
| --- | --- | --- |
| Can't connect client | DNS/SSL | Check .well-known, cert expiry |
| Federation fails | Port 8448 blocked | Open port or 443 delegation |
| Federation tester red | SRV records | Fix DNS _matrix._tcp |
| Video call no connect | TURN missing | coturn config, turn_uris in yaml |
| Video one-way audio | TURN credentials | turn_shared_secret match |
| "M_UNKNOWN" on register | Registration disabled | Use admin register CLI |
| Database error on start | PostgreSQL down | Check healthcheck, credentials |
| Slow room load | Large state | Purge old rooms, vacuum DB |
| Media 413 | Nginx body size | client_max_body_size 50M |
| Media 404 | Wrong media_store path | Check volume mount |
| E2E can't decrypt | Missing cross-signing | Re-verify devices, restore key backup |
| Bridge messages duplicate | Double bridge instance | One bridge per account |
| High memory | Media cache | Retention policy, restart |
| SSL mixed content | Element wrong base_url | Fix config.json homeserver URL |
| OIDC login loop | Redirect URI mismatch | Authentik callback URL |
| Spam registrations | Open registration | Disable, add captcha |
| Room invite fails | Blocked federation | Whitelist domain |
| Synapse 502 | Container crash | docker logs, DB connection |
| PostgreSQL disk full | No retention | Vacuum, media cleanup |
| Clock skew errors | NTP drift | chrony sync UTC |

Community: #synapse:matrix.org, GitHub matrix-org/synapse issues.

---

## Migration из Slack

| Slack | Matrix |
| --- | --- |
| Workspace | Space |
| #channel | #room:matrix.example.com |
| @user | @user:matrix.example.com |
| Threads | Threads (native) |
| Integrations | Bots, webhooks, bridges |

**Steps:**

1. Deploy Matrix stack (this guide)
2. Create Space mirroring Slack structure
3. mautrix-slack bridge for transition period (optional)
4. Export Slack history (Compliance Export) → matrix-import tools
5. Train team: Element desktop/mobile apps
6. Run parallel 2–4 weeks
7. Decommission Slack

**Element apps:** iOS, Android, Desktop (Electron) — all connect to your homeserver.

---

## Migration из Telegram

- mautrix-telegram bridge for groups
- Personal: encourage DMs on Matrix, E2E by default
- Bot API bots → Matrix bots (maubot framework)

Telegram secret chats **не** bridge'ятся (E2E) — только public/supergroups.

---

## Client apps recommendation

| Platform | App | Notes |
| --- | --- | --- |
| Desktop | Element | Full featured |
| Desktop alt | Cinny, FluffyChat | Lightweight |
| iOS | Element X | Modern rewrite |
| Android | Element X | Push via UnifiedPush |
| CLI | weechat-matrix | Power users |

Configure custom homeserver URL on first launch: `https://matrix.example.com`.

---

## Cost analysis vs SaaS

| | Matrix self-hosted (4 GB VPS) | Slack Business+ | Telegram Premium |
| --- | --- | --- | --- |
| 50 users/month | ~€15 VPS fixed | ~€600+ | N/A (not team) |
| Data control | Full | None | None |
| E2E | Optional rooms | No | Secret only |
| Setup time | 4–8 hours | 0 | 0 |

Окупается для команд 10+ на горизонте 2–3 месяцев.

---

## Связка с экосистемой StormNet blog

- Identity — [Authentik SSO](/blog/authentik-sso-vps/)
- Secrets — [Vaultwarden](/blog/vaultwarden-paroli-vps/), [Vault](/blog/vault-secrets-vps/)
- Docs — [BookStack wiki](/blog/bookstack-wiki-vps/)
- Monitoring — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/), [Grafana](/blog/grafana-prometheus-vps/)
- VPN admin — [Tailscale](/blog/tailscale-vpn-vps/)
- Email — [Postfix/Dovecot](/blog/postfix-dovecot-pochta-vps/)
- Automation — [n8n](/blog/n8n-self-hosted/) webhooks from Matrix bots

---

## Production launch checklist

1. [ ] DNS A + SRV + .well-known
2. [ ] PostgreSQL + Synapse + coturn + Element running
3. [ ] SSL valid all domains
4. [ ] Federation tester green
5. [ ] Admin user + cross-signing
6. [ ] Registration disabled
7. [ ] Backup cron configured + test restore
8. [ ] Monitoring alerts
9. [ ] Team onboarded on Element apps
10. [ ] Moderation policy documented in [BookStack](/blog/bookstack-wiki-vps/)

---

## Итог

Matrix Synapse на VPS — единственный self-hosted мессенджер с open federation, E2E и bridges. Setup сложнее Slack, но вы владеете каждым событием, каждым файлом, каждой политикой retention.

VPS 4 GB+ — [StormNet Cloud](https://stormnetcloud.com/). Security — [CrowdSec](/blog/crowdsec-zashchita-vps/) + [Authentik](/blog/authentik-sso-vps/). Backup — [Restic](/blog/restic-backup-vps/) + [3-2-1](/blog/backup-vps-3-2-1/). Этот гайд покрывает полный цикл — от DNS до migration.
