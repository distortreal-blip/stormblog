import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.join(__dirname, '../src/content/blog');
const assetsRoot =
	'C:/Users/User/.cursor/projects/C-Users-User-AppData-Local-Temp-d40b507b-3ca3-4425-b871-71340de52e41/assets';

const articles = [
	{
		slug: 'matrix-synapse-chat-vps',
		coverFile: 'cover-matrix-synapse-vps.png',
		pubDate: '2026-07-08',
		title: 'Matrix Synapse на VPS: полный гайд по self-hosted мессенджеру',
		description:
			'Matrix Synapse + Element на VPS: Docker, PostgreSQL, TURN, federation, SSL, E2E encryption, бэкапы и hardening. Альтернатива Slack и Telegram для команд.',
		category: 'DevOps',
		keywords: [
			'Matrix Synapse VPS',
			'Element messenger',
			'self-hosted chat',
			'Slack alternative',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** Matrix — децентрализованный протокол чата с E2E encryption. Synapse — reference homeserver. Stack на VPS 4 GB+: Synapse + PostgreSQL + [coturn TURN](/blog/ssl-letsencrypt-vps/) + Element Web + [Nginx SSL](/blog/nginx-ili-caddy/) + [бэкапы](/blog/backup-vps-3-2-1/).

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

\`\`\`
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
\`\`\`

**Federation traffic** идёт напрямую server-to-server на \`:8448\` (или через 443 delegated SRV).

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

Для домена \`matrix.example.com\`:

| Тип | Имя | Значение |
| --- | --- | --- |
| A | matrix.example.com | VPS_IP |
| A | turn.example.com | VPS_IP |
| SRV | _matrix._tcp | matrix.example.com:443 (delegation) |
| TXT | _matrix | v=matrix1 (verification) |

**Federation port:** либо \`:8448\` открыт, либо \`.well-known\` delegation на 443:

\`\`\`json
// https://matrix.example.com/.well-known/matrix/server
{"m.server": "matrix.example.com:443"}

// https://matrix.example.com/.well-known/matrix/client
{"m.homeserver": {"base_url": "https://matrix.example.com"}}
\`\`\`

Проверка: \`curl https://matrix.example.com/.well-known/matrix/server\`

---

## Подготовка VPS

\`\`\`bash
# Ubuntu 24.04
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx

# Firewall
sudo nft add rule inet filter input tcp dport { 22, 80, 443, 8448, 3478, 5349 } accept
# или см. [nftables гайд](/blog/nftables-firewall-vps/)
\`\`\`

Hostname: \`matrix.example.com\`. Timezone UTC. Swap 2 GB если RAM 4 GB.

---

## PostgreSQL (отдельный container)

\`\`\`yaml
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
\`\`\`

**Tuning** для 4 GB VPS (postgresql.conf overrides):

\`\`\`
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
work_mem = 8MB
max_connections = 100
\`\`\`

Подробнее — [PostgreSQL tuning](/blog/postgresql-tuning-vps/).

---

## Synapse: генерация config

\`\`\`bash
mkdir -p synapse-data
docker run -it --rm \\
  -v ./synapse-data:/data \\
  -e SYNAPSE_SERVER_NAME=matrix.example.com \\
  -e SYNAPSE_REPORT_STATS=no \\
  matrixdotorg/synapse:latest generate
\`\`\`

Редактируем \`homeserver.yaml\`:

\`\`\`yaml
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
\`\`\`

---

## Полный Docker Compose

\`\`\`yaml
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
\`\`\`

---

## coturn configuration

\`\`\`conf
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
\`\`\`

Без TURN — Element Call и video не работают за symmetric NAT (большинство mobile networks).

---

## Element Web config.json

\`\`\`json
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
\`\`\`

Host Element на \`chat.example.com\` или \`element.matrix.example.com\`.

---

## Nginx configuration (complete)

\`\`\`nginx
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

    location ~* ^(\\/_matrix|\\/_synapse) {
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
\`\`\`

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/) или [Certbot DNS](/blog/certbot-dns-ssl-vps/) для wildcard.

---

## Создание первого admin user

\`\`\`bash
# Регистрация через shared secret (enable_registration: false в yaml)
register_new_matrix_user -c synapse-data/homeserver.yaml http://localhost:8008

# Или через Docker:
docker exec -it synapse-synapse-1 register_new_matrix_user \\
  -c /data/homeserver.yaml http://localhost:8008
\`\`\`

Сразу: **Settings → Security → Cross-signing** + **Secure backup** для E2E.

Invite-only policy:

\`\`\`yaml
enable_registration: false
# Создавайте users через admin API или register CLI
\`\`\`

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

**Public room discovery** — отключите в production (\`allow_public_rooms_without_auth: false\`).

---

## Federation

Federation позволяет писать пользователям на других серверах: \`@user:matrix.org\`, \`@user:company.com\`.

**Проверка federation:**

\`\`\`bash
# С вашего сервера
curl "https://matrix.example.com/_matrix/federation/v1/version"

# External test
# https://federationtester.matrix.org/
\`\`\`

**Whitelist federation** (если только internal):

\`\`\`yaml
federation_domain_whitelist:
  - matrix.example.com
  - partner-company.com
\`\`\`

**Disable federation completely:**

\`\`\`yaml
federation_domain_whitelist:
  - matrix.example.com  # only self
\`\`\`

---

## Bridges: Telegram, Slack, IRC

**mautrix-telegram** — двусторонний bridge Telegram ↔ Matrix.

\`\`\`yaml
# Отдельный container mautrix-telegram
# config.yaml: homeserver address, appservice registration
# Регистрация appservice в Synapse: app_service_config_files
\`\`\`

Workflow:

1. Deploy mautrix bridge container
2. Generate registration.yaml
3. Add to Synapse \`app_service_config_files\`
4. Restart Synapse
5. Login Telegram bot in bridge DM
6. \`!tg login\` → link rooms

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
2. Synapse \`homeserver.yaml\`:

\`\`\`yaml
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
\`\`\`

3. Disable local password login для org users
4. Map groups → Synapse roles via claims (advanced)

---

## Moderation и Synapse Admin API

\`\`\`bash
# List users
curl -H "Authorization: Bearer $ADMIN_TOKEN" \\
  "https://matrix.example.com/_synapse/admin/v2/users?guests=false"

# Deactivate user
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \\
  "https://matrix.example.com/_synapse/admin/v1/deactivate/@spam:matrix.example.com"

# Purge room
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \\
  -d '{"block": true, "purge": true}' \\
  "https://matrix.example.com/_synapse/admin/v1/rooms/!roomid:matrix.example.com/delete"
\`\`\`

Admin token: \`homeserver.yaml\` → generate via \`synapse_admin\` or config.

**Moderation policy:** power level 50+ for kick, 100 for ban. Audit log через [Loki](/blog/loki-grafana-logi-vps/).

---

## Media retention и cleanup

Media занимает 80% disk на активных rooms.

\`\`\`yaml
# homeserver.yaml
media_retention:
  local_media_lifetime: 90d
  remote_media_lifetime: 30d
\`\`\`

Cron cleanup:

\`\`\`bash
docker exec synapse-synapse-1 \\
  synapse_review_media_storage --before-days 90 --remove
\`\`\`

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

\`\`\`bash
# PostgreSQL dump
docker exec postgres pg_dump -U synapse synapse | gzip > synapse-db-$(date +%F).sql.gz

# Full tar
tar czf matrix-backup-$(date +%F).tar.gz postgres-data/ synapse-data/ element-config.json
\`\`\`

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

\`\`\`yaml
# prometheus scrape synapse metrics (enable in homeserver.yaml)
enable_metrics: true
\`\`\`

Logs → [Loki + Grafana](/blog/loki-grafana-logi-vps/) или [OpenSearch](/blog/opensearch-logi-vps/).

---

## Performance tuning

| Проблема | Решение |
| --- | --- |
| Slow message send | PostgreSQL indexes, more RAM, Redis cache |
| Federation lag | Check DNS SRV, port 8448, bandwidth |
| High CPU sync | Limit federation partners, worker processes |
| OOM on startup | Increase RAM, reduce \`cp_max\` db pool |
| Slow media upload | SSD disk, increase \`max_upload_size\` carefully |

**Synapse workers** (800+ users): split federation, media, client readers на отдельные processes — см. official docs "Workers".

**Redis cache:**

\`\`\`yaml
redis:
  enabled: true
  host: redis
  port: 6379
\`\`\`

---

## Security hardening checklist

- [ ] \`enable_registration: false\` — invite/admin only
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

Configure custom homeserver URL on first launch: \`https://matrix.example.com\`.

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

VPS 4 GB+ — [StormNet Cloud](https://stormnetcloud.com/). Security — [CrowdSec](/blog/crowdsec-zashchita-vps/) + [Authentik](/blog/authentik-sso-vps/). Backup — [Restic](/blog/restic-backup-vps/) + [3-2-1](/blog/backup-vps-3-2-1/). Этот гайд покрывает полный цикл — от DNS до migration.`,
	},
	{
		slug: 'homeassistant-vps',
		coverFile: 'cover-homeassistant-vps.png',
		pubDate: '2026-07-08',
		title: 'Home Assistant на VPS: умный дом с удалённым доступом — полный гайд',
		description:
			'Home Assistant на VPS: Docker, MQTT, Zigbee2MQTT, SSL, Tailscale, интеграции и автоматизации. Self-hosted альтернатива SmartThings и Apple Home.',
		category: 'DevOps',
		keywords: [
			'Home Assistant VPS',
			'умный дом',
			'MQTT Zigbee',
			'smart home self-hosted',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** Home Assistant (HA) — open-source платформа умного дома: 2000+ интеграций, автоматизации, dashboards, voice. На VPS: Docker + [MQTT Mosquitto](/blog/emqx-mqtt-na-vps/) + [SSL/Tailscale](/blog/tailscale-vpn-vps/) для remote access. Локальные устройства — через gateway (Zigbee2MQTT, ESPHome) at home, HA cloud на VPS.

Apple HomeKit и Google Home — чужие облака. HA на [вашем VPS](/blog/choose-vps/) = automations без лимитов, privacy, интеграция с [n8n](/blog/n8n-self-hosted/), [Grafana](/blog/grafana-prometheus-vps/), Telegram alerts.

**Гигантский гайд:** архитектура split-brain (VPS + home gateway), полный setup, 50+ integrations, automations YAML, troubleshooting.

---

## Содержание

1. Архитектура: VPS HA + home gateway
2. Когда HA на VPS имеет смысл
3. Требования VPS и home hardware
4. Docker Compose full stack
5. MQTT broker (Mosquitto)
6. Zigbee2MQTT remote setup
7. ESPHome devices
8. SSL, reverse proxy, Tailscale
9. Lovelace dashboards
10. Automations (50 примеров patterns)
11. Node-RED vs HA automations
12. Voice assistants (Whisper, Piper)
13. Energy monitoring
14. Camera / Frigate NVR
15. Integrations catalog
16. Backup и restore
17. Updates и migration
18. Security hardening
19. Performance tuning
20. Troubleshooting encyclopedia

---

## Home Assistant vs альтернативы

| | Home Assistant | Apple HomeKit | Google Home | SmartThings |
| --- | --- | --- | --- | --- |
| Self-hosted | Да | Нет | Нет | Partial |
| Integrations | 2000+ | Limited | Limited | Good |
| Automations | Unlimited YAML/UI | Basic | Basic | Medium |
| Local control | Да (with gateway) | Apple hub | Cloud | Mixed |
| Privacy | Your server | Apple | Google | Samsung |
| VPS deploy | Да | N/A | N/A | N/A |
| Cost | VPS + devices | Hardware $$$ | Devices | Devices |
| Open source | Да | Нет | Нет | Partial |

HA — стандарт self-hosted smart home для энтузиастов и advanced users.

---

## Архитектура split: VPS + Home

\`\`\`
┌─────────────────────────────────────────────┐
│  HOME (ваша квартира)                       │
│  Zigbee USB → Raspberry Pi / mini PC        │
│  Zigbee2MQTT ──MQTT──┐                      │
│  ESPHome devices ────┤                      │
│  Local sensors ──────┤                      │
└──────────────────────┼──────────────────────┘
                       │ MQTT over TLS / Tailscale
                       ↓
┌─────────────────────────────────────────────┐
│  VPS (StormNet Cloud)                       │
│  Home Assistant Core                        │
│  Mosquitto MQTT broker                      │
│  Node-RED (optional)                        │
│  InfluxDB + Grafana (optional)              │
│  Nginx SSL / Tailscale Serve                │
└─────────────────────────────────────────────┘
                       ↓
              Mobile app / Voice / [n8n](/blog/n8n-self-hosted/)
\`\`\`

**Почему split?** Zigbee/Z-Wave USB dongle физически дома. VPS — always-online brain для remote access, heavy automations, integrations с cloud APIs.

**Alternative:** HA полностью дома на Raspberry Pi 4 + [Tailscale](/blog/tailscale-vpn-vps/) для remote. VPS вариант — когда нужен uptime 24/7 и интеграция с [DevOps stack](/blog/docker-compose-vps/).

---

## Когда HA на VPS — правильный выбор

| Сценарий | VPS HA | Local HA |
| --- | --- | --- |
| Remote monitoring дачи/квартиры | ✅ | Needs tunnel |
| Dev/test automations | ✅ | ✅ |
| Zigbee primary network | Gateway at home | ✅ Better |
| Camera NVR heavy | VPS 8 GB+ | Local NUC |
| Integration with cloud CI | ✅ | Harder |
| Internet down — local control | Needs local fallback | ✅ |

**Рекомендация:** production = **local HA primary** + VPS **replica/remote access** OR VPS HA + **home MQTT gateway only**.

---

## Требования

### VPS

| Setup | RAM | CPU | Disk |
| --- | --- | --- | --- |
| HA + MQTT minimal | 2 GB | 2 vCPU | 20 GB SSD |
| HA + Node-RED + InfluxDB | 4 GB | 2–4 vCPU | 40 GB SSD |
| HA + Frigate 4 cameras | 8 GB | 4 vCPU | 100 GB SSD |
| HA + everything | 16 GB | 4–8 vCPU | 200 GB NVMe |

### Home gateway (для Zigbee)

| Hardware | Цена | Notes |
| --- | --- | --- |
| Raspberry Pi 4 2GB | ~$45 | Zigbee2MQTT host |
| Sonoff Zigbee 3.0 USB | ~$15 | CC2652 coordinator |
| Orange Pi 5 | ~$80 | More powerful |
| Old laptop | Free | x86, stable |

Gateway connects to VPS MQTT via **Tailscale** (recommended) or MQTTS public.

---

## Docker Compose (production stack)

\`\`\`yaml
services:
  homeassistant:
    image: ghcr.io/home-assistant/home-assistant:stable
    restart: unless-stopped
    privileged: true  # для некоторых integrations
    network_mode: host  # mDNS discovery (optional, security tradeoff)
    volumes:
      - ./ha-config:/config
      - /etc/localtime:/etc/localtime:ro
    environment:
      - TZ=Europe/Moscow

  mosquitto:
    image: eclipse-mosquitto:2
    restart: unless-stopped
    ports:
      - "127.0.0.1:1883:1883"
      - "127.0.0.1:8883:8883"  # TLS
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log

  zigbee2mqtt:
    image: koenkk/zigbee2mqtt:latest
    restart: unless-stopped
    # На HOME gateway, не на VPS — см. ниже
    profiles:
      - home-gateway

  influxdb:
    image: influxdb:2.7
    restart: unless-stopped
    ports:
      - "127.0.0.1:8086:8086"
    volumes:
      - ./influxdb:/var/lib/influxdb2
    profiles:
      - monitoring

  nodered:
    image: nodered/node-red:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:1880:1880"
    volumes:
      - ./nodered:/data
    profiles:
      - automation

  grafana:
    image: grafana/grafana:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - ./grafana:/var/lib/grafana
    profiles:
      - monitoring
\`\`\`

Start: \`docker compose up -d\`. Monitoring profile: \`docker compose --profile monitoring up -d\`.

---

## Mosquitto MQTT configuration

\`\`\`conf
# mosquitto.conf
listener 1883
allow_anonymous false
password_file /mosquitto/config/passwd

listener 8883
certfile /mosquitto/config/certs/fullchain.pem
cafile /mosquitto/config/certs/fullchain.pem
keyfile /mosquitto/config/certs/privkey.pem
require_certificate false

# ACL
acl_file /mosquitto/config/acl
\`\`\`

\`\`\`bash
mosquitto_passwd -c passwd ha_user
mosquitto_passwd -b passwd gateway_user STRONG_PASS
\`\`\`

ACL:

\`\`\`
user ha_user
topic readwrite #

user gateway_user
topic readwrite zigbee2mqtt/#
topic readwrite esphome/#
\`\`\`

Alternative broker — [EMQX](/blog/emqx-mqtt-na-vps/) для high-throughput.

---

## Home gateway: Zigbee2MQTT on Raspberry Pi

\`\`\`yaml
# docker-compose.yml на Raspberry Pi дома
services:
  zigbee2mqtt:
    image: koenkk/zigbee2mqtt:latest
    restart: unless-stopped
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0  # Sonoff dongle
    volumes:
      - ./zigbee2mqtt:/app/data
    environment:
      - TZ=Europe/Moscow
\`\`\`

\`\`\`yaml
# configuration.yaml
mqtt:
  server: mqtt://100.x.x.x:1883  # VPS Tailscale IP
  user: gateway_user
  password: STRONG_PASS

serial:
  port: /dev/ttyUSB0
  adapter: ezsp

advanced:
  network_key: GENERATE_ONCE_AND_BACKUP
  pan_id: GENERATE
  channel: 25

frontend:
  port: 8080
  host: 0.0.0.0

homeassistant: true
\`\`\`

Pair devices: enable pairing in Z2M UI → reset device → appears in HA automatically via MQTT discovery.

---

## ESPHome on VPS or home

ESPHome devices (ESP32/8266) compile configs and flash locally, then connect MQTT to VPS:

\`\`\`yaml
# esphome/desk-sensor.yaml
esphome:
  name: desk-sensor

esp8266:
  board: esp01_1m

mqtt:
  broker: 100.x.x.x  # VPS Tailscale
  username: gateway_user
  password: STRONG_PASS

sensor:
  - platform: dht
    pin: GPIO2
    temperature:
      name: "Desk Temperature"
    humidity:
      name: "Desk Humidity"
\`\`\`

\`\`\`bash
esphome run desk-sensor.yaml
\`\`\`

200+ device types: relays, sensors, covers, lights.

---

## Home Assistant initial configuration.yaml

\`\`\`yaml
homeassistant:
  name: Home
  latitude: 55.7558
  longitude: 37.6173
  elevation: 150
  unit_system: metric
  time_zone: Europe/Moscow
  country: RU

default_config:

http:
  use_x_forwarded_for: true
  trusted_proxies:
    - 127.0.0.1
    - 10.0.0.0/8  # Tailscale

recorder:
  db_url: postgresql://ha:PASSWORD@postgres/ha  # optional external DB
  purge_keep_days: 30
  commit_interval: 5

history:
logbook:

mqtt:
  broker: 127.0.0.1
  username: ha_user
  password: STRONG_PASS
  discovery: true
  discovery_prefix: homeassistant

# Automations in automations.yaml
automation: !include automations.yaml
script: !include scripts.yaml
scene: !include scenes.yaml
\`\`\`

External PostgreSQL — для large installs (recorder DB grows fast). См. [PostgreSQL tuning](/blog/postgresql-tuning-vps/).

---

## SSL и remote access

### Option A: Tailscale (recommended)

\`\`\`bash
# VPS
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# tailscale serve https / http://localhost:8123
\`\`\`

Access: \`https://vps-name.tailnet-name.ts.net\` — no public exposure.

Полный гайд — [Tailscale VPN](/blog/tailscale-vpn-vps/).

### Option B: Nginx + Let's Encrypt

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name ha.example.com;

    ssl_certificate /etc/letsencrypt/live/ha.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ha.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8123;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
\`\`\`

**Never expose HA without auth** — enable HA authentication + [Authentik](/blog/authentik-sso-vps/) proxy or strong passwords + 2FA.

### Option C: Cloudflare Tunnel

См. [Cloudflare + VPS](/blog/cloudflare-i-vps/) — Zero Trust access policies.

---

## Lovelace dashboards

Modern UI — drag-and-drop cards:

| Card | Use |
| --- | --- |
| Entities | List sensors/switches |
| Gauge | Temperature, power |
| History graph | Trends |
| Picture glance | Camera snapshot |
| Thermostat | Climate control |
| Button | Scripts, scenes |
| Markdown | Instructions |
| Custom: mini-graph-card | Advanced charts (HACS) |

**HACS** (Home Assistant Community Store):

\`\`\`bash
# Install via UI: hacs.xyz
# Adds 1000+ custom integrations and cards
\`\`\`

Dashboard per room: Living, Bedroom, Energy, Security.

Mobile: Companion App iOS/Android — push notifications, location triggers.

---

## Automations: patterns и examples

### Pattern 1: Motion → Light

\`\`\`yaml
automation:
  - alias: "Hallway motion light"
    trigger:
      - platform: state
        entity_id: binary_sensor.hallway_motion
        to: "on"
    action:
      - service: light.turn_on
        target:
          entity_id: light.hallway
        data:
          brightness: 200
    mode: restart

  - alias: "Hallway light off"
    trigger:
      - platform: state
        entity_id: binary_sensor.hallway_motion
        to: "off"
        for: "00:05:00"
    action:
      - service: light.turn_off
        target:
          entity_id: light.hallway
\`\`\`

### Pattern 2: Temperature alert → Telegram

\`\`\`yaml
automation:
  - alias: "Freezer too warm"
    trigger:
      - platform: numeric_state
        entity_id: sensor.freezer_temp
        above: -10
    action:
      - service: notify.telegram
        data:
          message: "⚠️ Freezer temperature {{ states('sensor.freezer_temp') }}°C"
\`\`\`

Setup Telegram bot — [Telegram bot VPS](/blog/telegram-bot-vps/) guide.

### Pattern 3: Sunrise curtains

\`\`\`yaml
automation:
  - alias: "Open curtains at sunrise"
    trigger:
      - platform: sun
        event: sunrise
        offset: "00:30:00"
    action:
      - service: cover.open_cover
        target:
          entity_id: cover.bedroom_curtains
\`\`\`

### Pattern 4: Away mode

\`\`\`yaml
automation:
  - alias: "Away — all off"
    trigger:
      - platform: state
        entity_id: input_boolean.away_mode
        to: "on"
    action:
      - service: light.turn_off
        target:
          entity_id: all
      - service: climate.set_preset_mode
        target:
          entity_id: climate.living
        data:
          preset_mode: away
\`\`\`

### Pattern 5: Energy price optimization

\`\`\`yaml
# Trigger when electricity price below threshold (Nordpool integration)
automation:
  - alias: "Run dishwasher on cheap energy"
    trigger:
      - platform: numeric_state
        entity_id: sensor.nordpool_price
        below: 5
    condition:
      - condition: time
        after: "22:00:00"
        before: "06:00:00"
    action:
      - service: switch.turn_on
        target:
          entity_id: switch.dishwasher
\`\`\`

**50+ automation ideas:** leak sensor → shut valve, CO alert → push + siren, door open > 5 min → notify, low battery batch notify Sunday, guest WiFi on doorbell, sunrise simulation, sleep mode dim lights, vacation random lights, bin day reminder, washing done notify.

---

## Node-RED vs HA native automations

| | HA Automations | Node-RED |
| --- | --- | --- |
| UI | HA UI + YAML | Visual flow |
| Learning curve | Medium | Low for devs |
| Complex logic | YAML verbose | JS function nodes |
| Performance | Native | Extra container |
| Best for | Standard rules | Complex flows, API glue |

Node-RED MQTT nodes connect directly to Mosquitto. Use HA for device management, Node-RED for glue to [n8n](/blog/n8n-self-hosted/) and external APIs.

---

## Voice: Whisper + Piper (local STT/TTS)

\`\`\`yaml
# Wyoming protocol integrations in HA
assist_pipeline:
  - name: "Local Assist"
    language: "ru"
    conversation_engine: homeassistant
    stt_engine: wyoming_whisper
    tts_engine: wyoming_piper
\`\`\`

Deploy Wyoming Whisper/Piper containers — no cloud for voice commands. Russian models supported.

Alternative: Google Assistant / Alexa integration (cloud, easier).

---

## Camera и Frigate NVR

Frigate — AI object detection (person, car, dog):

\`\`\`yaml
  frigate:
    image: ghcr.io/blakeblackshear/frigate:stable
    restart: unless-stopped
    shm_size: "256mb"
    devices:
      - /dev/dri/renderD128  # Intel GPU hwaccel
    volumes:
      - ./frigate/config:/config
      - ./frigate/storage:/media/frigate
    ports:
      - "127.0.0.1:5000:5000"
\`\`\`

**Frigate on VPS** — только если cameras stream RTSP over [Tailscale](/blog/tailscale-vpn-vps/) from home. CPU heavy — 8 GB VPS minimum for 2–3 cameras.

Integration: Frigate → HA binary_sensor person detected → automation.

---

## Top integrations catalog

| Category | Integration | Notes |
| --- | --- | --- |
| Climate | Daikin, Mitsubishi, Tuya | AC control |
| Lights | Philips Hue, IKEA TRÅDFRI, Tuya | Zigbee preferred |
| Covers | Somfy, Broadlink | Blinds |
| Energy | Shelly EM, Nordpool | Power monitoring |
| Security | Ring, Reolink, Frigate | Cameras |
| Vacuum | Roborock, Dreame | Map support |
| Media | [Jellyfin](/blog/jellyfin-media-server-vps/), Sonos | Playback |
| Weather | OpenWeatherMap, Met.no | Forecasts |
| Calendar | Google Calendar | Presence |
| Notify | Telegram, Slack, Matrix | Alerts |
| Lock | Nuki, Yale | Smart locks |
| Plant | Xiaomi Mi Flora | Moisture |
| Car | Tesla, BMW | Preheat |
| DNS | [AdGuard](/blog/adguard-dns-vps/) | Ad block stats |
| Monitoring | [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) | Combined dashboard |

Zigbee2MQTT supported devices: 3000+ — z2m.qeed.nl

---

## InfluxDB + Grafana long-term metrics

\`\`\`yaml
# configuration.yaml
influxdb:
  api_version: 2
  ssl: false
  host: 127.0.0.1
  port: 8086
  token: INFLUX_TOKEN
  organization: homeassistant
  bucket: ha_metrics
  tags:
    source: ha
  default_measurement: units
  include:
    domains:
      - sensor
      - binary_sensor
      - climate
\`\`\`

Grafana dashboards — temperature trends, energy consumption, uptime. См. [Grafana + Prometheus](/blog/grafana-prometheus-vps/).

---

## Backup и restore

**Automatic HA backup:**

\`\`\`yaml
# automations.yaml — weekly backup
automation:
  - alias: "Weekly HA backup"
    trigger:
      - platform: time
        at: "03:00:00"
    condition:
      - condition: time
        weekday:
          - mon
    action:
      - service: hassio.backup_full
        data:
          name: "weekly_{{ now().strftime('%Y%m%d') }}"
\`\`\`

Docker install backup:

\`\`\`bash
# Stop HA
docker compose stop homeassistant
tar czf ha-backup-$(date +%F).tar.gz ha-config/ mosquitto/ nodered/
docker compose start homeassistant
\`\`\`

Offsite: [Restic](/blog/restic-backup-vps/) → [MinIO S3](/blog/minio-s3-na-vps/). Strategy [3-2-1](/blog/backup-vps-3-2-1/).

**Critical:** Zigbee \`network_key\` and \`pan_id\` — backup separately. Loss = re-pair ALL devices.

Restore: extract tar → \`docker compose up\` → verify MQTT connections.

---

## Updates

\`\`\`bash
# HA Core update
docker compose pull homeassistant
docker compose up -d homeassistant

# Check breaking changes
# https://www.home-assistant.io/blog/categories/core/
\`\`\`

Subscribe release notes. Major updates — backup first. Test automations after update.

---

## Security hardening

| Risk | Mitigation |
| --- | --- |
| Public HA exposure | Tailscale only, no public 8123 |
| Weak password | Long password + 2FA (TOTP) |
| MQTT anonymous | Always auth + ACL |
| Zigbee network key leak | Encrypt backup, offline copy |
| Untrusted integrations | Review HACS before install |
| API token leak | Rotate, scope minimal |
| Camera streams public | Local only via VPN |
| SSH to gateway Pi | Key-only, [fail2ban](/blog/fail2ban-ot-bruteforce-vps/) |

\`\`\`yaml
# configuration.yaml
http:
  ip_ban_enabled: true
  login_attempts_threshold: 5
\`\`\`

[Authentik](/blog/authentik-sso-vps/) forward auth for Nginx — enterprise teams.

[CrowdSec](/blog/crowdsec-zashchita-vps/) on VPS if public domain.

---

## Performance tuning

| Issue | Fix |
| --- | --- |
| Slow UI | recorder purge, exclude domains, SSD |
| DB size huge | PostgreSQL external, purge_keep_days 7 |
| MQTT lag | Local broker, reduce publish rate |
| High CPU | Disable unused integrations |
| Memory leak integration | Identify via logs, remove |
| Zigbee mesh weak | More router devices (mains powered) |
| Startup slow | Split automations, lazy load |

\`\`\`yaml
recorder:
  exclude:
    domains:
      - automation
      - updater
    entity_globs:
      - sensor.weather_*
\`\`\`

---

## Troubleshooting encyclopedia

| Симптом | Причина | Fix |
| --- | --- | --- |
| HA won't start | Config YAML syntax | ha core check |
| MQTT devices missing | Discovery off | mqtt discovery true |
| Z2M can't connect MQTT | Wrong Tailscale IP | Ping VPS, check passwd |
| Devices unavailable | Gateway offline | Restart Pi, check USB |
| Zigbee device won't pair | Interference | Change channel, proximity |
| Automation not firing | Wrong entity_id | Developer tools → states |
| Automation not firing | Condition false | Trace automation in UI |
| Duplicate entities | Re-discovery | Delete stale, restart |
| Recorder DB corrupt | Disk full | Purge, repair sqlite |
| Slow history | Large DB | Reduce purge_keep_days |
| Camera stream lag | Bandwidth | Lower resolution, local |
| Frigate high CPU | No hwaccel | Intel GPU / Coral TPU |
| TTS not working | Wrong engine | Check Wyoming logs |
| Telegram notify fail | Token invalid | BotFather new token |
| SSL cert error | Expired LE | certbot renew |
| Tailscale can't reach | ACL | Check tailnet policy |
| ESPHome offline | WiFi weak | External antenna |
| InfluxDB empty | Token wrong | Regenerate token |
| HACS won't load | GitHub rate limit | Retry, auth token |
| Energy dashboard empty | Integration missing | Add utility meter |
| mDNS not working | network_mode host | Expected on Docker |
| High latency remote | Geographic distance | VPS closer region |
| PostgreSQL OOM | Too much history | Exclude sensors |

Logs: Settings → System → Logs. Gateway: \`docker logs zigbee2mqtt\`.

Community: community.home-assistant.io — largest smart home forum.

---

## Integration с DevOps экосистемой

| Service | Integration |
| --- | --- |
| [n8n](/blog/n8n-self-hosted/) | Webhook automations, external APIs |
| [Telegram bot](/blog/telegram-bot-vps/) | Notifications, commands |
| [Matrix Synapse](/blog/matrix-synapse-chat-vps/) | Alert rooms |
| [Grafana](/blog/grafana-prometheus-vps/) | Long-term charts |
| [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) | HA health check |
| [AdGuard](/blog/adguard-dns-vps/) | Network stats in HA |
| [Jellyfin](/blog/jellyfin-media-server-vps/) | Media player control |
| [Vaultwarden](/blog/vaultwarden-paroli-vps/) | Store API keys |
| [BookStack](/blog/bookstack-wiki-vps/) | Document automations |

Webhook example to n8n:

\`\`\`yaml
automation:
  - alias: "Door opened webhook"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_door
        to: "on"
    action:
      - service: rest_command.n8n_webhook
        data:
          message: "Front door opened"
\`\`\`

---

## Sample whole-home setup

**Apartment 60m²:**

| Device | Protocol | Count |
| --- | --- | --- |
| Temperature/humidity | Zigbee | 4 |
| Motion | Zigbee PIR | 3 |
| Smart plugs | Zigbee | 6 |
| Light bulbs | Zigbee | 8 |
| Door sensors | Zigbee | 2 |
| Smart thermostat | WiFi/MQTT | 1 |
| Robot vacuum | WiFi | 1 |
| Cameras | RTSP | 2 |

**Cost:** ~€300 devices + €10/mo VPS. Automations: climate, lighting, security, energy.

**Gateway:** Raspberry Pi 4 + Sonoff dongle (~€70)
**VPS:** 4 GB [StormNet Cloud](https://stormnetcloud.com/)

---

## Production checklist

1. [ ] VPS provisioned, Docker installed
2. [ ] Mosquitto with auth + TLS
3. [ ] Home Assistant running, auth enabled
4. [ ] Tailscale remote access configured
5. [ ] Home gateway Pi with Zigbee2MQTT → MQTT connected
6. [ ] First devices paired and tested
7. [ ] Automations for critical alerts (leak, smoke, door)
8. [ ] Backup cron + offsite [Restic](/blog/restic-backup-vps/)
9. [ ] Zigbee network_key backed up offline
10. [ ] Mobile app configured with push notifications
11. [ ] Documentation in [BookStack](/blog/bookstack-wiki-vps/)

---

## Итог

Home Assistant на VPS + Zigbee gateway дома — максимально гибкий self-hosted умный дом без vendor lock-in. Split architecture даёт 24/7 remote access и local device control одновременно.

VPS 4 GB — [StormNet Cloud](https://stormnetcloud.com/). Remote — [Tailscale](/blog/tailscale-vpn-vps/). MQTT — [EMQX guide](/blog/emqx-mqtt-na-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/). Этот гайд — полный reference от архитектуры до 30+ troubleshooting кейсов.`,
	},
];

for (const article of articles) {
	const dir = path.join(blogRoot, article.slug);
	fs.mkdirSync(dir, { recursive: true });

	const coverSrc = path.join(assetsRoot, article.coverFile);
	if (fs.existsSync(coverSrc)) {
		await sharp(coverSrc)
			.resize(1200, 630, { fit: 'cover' })
			.webp({ quality: 88 })
			.toFile(path.join(dir, 'cover.webp'));
		console.log('cover:', article.slug);
	} else {
		console.warn('missing cover:', coverSrc);
	}

	const keywordsYaml = article.keywords.map((k) => `  - "${k}"`).join('\n');
	const md = `---
title: "${article.title}"
description: "${article.description}"
pubDate: ${article.pubDate}
category: ${article.category}
keywords:
${keywordsYaml}
heroImage: ./cover.webp
---

${article.body}
`;

	fs.writeFileSync(path.join(dir, 'index.md'), md, 'utf8');
	console.log('article:', article.slug);
}
