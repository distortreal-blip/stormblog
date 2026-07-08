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
		slug: 'vaultwarden-paroli-vps',
		coverFile: 'cover-vaultwarden-vps.png',
		pubDate: '2026-07-08',
		title: 'Vaultwarden на VPS: self-hosted менеджер паролей как Bitwarden',
		description:
			'Vaultwarden на VPS: Docker, Nginx, SSL, 2FA, backup sqlite и интеграция с Bitwarden-клиентами. Приватная альтернатива LastPass и 1Password.',
		category: 'DevOps',
		keywords: [
			'Vaultwarden VPS',
			'Bitwarden self-hosted',
			'менеджер паролей',
			'password manager',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** Vaultwarden — лёгкий Rust-сервер, совместимый с клиентами Bitwarden. На VPS 512 MB–1 GB: Docker + [Nginx + SSL](/blog/ssl-letsencrypt-vps/) + ежедневный [backup](/blog/backup-vps-3-2-1/) sqlite.

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

\`\`\`
Bitwarden clients (browser, mobile, desktop)
        ↓ HTTPS
   Nginx reverse proxy + Let's Encrypt
        ↓
   Vaultwarden container (Rocket)
        ↓
   /data/vw.sqlite + attachments volume
\`\`\`

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

\`\`\`yaml
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
\`\`\`

После первого admin — \`SIGNUPS_ALLOWED=false\`, только invite.

---

## Nginx reverse proxy

\`\`\`nginx
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
\`\`\`

WebSocket нужен для live sync между устройствами.

---

## Первоначальная настройка

1. Откройте \`https://vault.example.com\`
2. Создайте первый аккаунт (станет admin)
3. **Settings → Email** — SMTP для invites и 2FA (Postfix или relay)
4. Включите **2FA** (TOTP, YubiKey, Duo)
5. Admin panel: \`https://vault.example.com/admin\` + \`ADMIN_TOKEN\`

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

\`\`\`bash
# Ежедневно cron
tar czf /backup/vaultwarden-$(date +%F).tar.gz ./vw-data/
\`\`\`

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

- Browser: Bitwarden extension → Server URL \`https://vault.example.com\`
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
| Attachments 413 | \`client_max_body_size 128M;\` в Nginx |
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

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). Backup — [Restic](/blog/restic-backup-vps/) + [3-2-1](/blog/backup-vps-3-2-1/).`,
	},
	{
		slug: 'code-server-ide-vps',
		coverFile: 'cover-code-server-vps.png',
		pubDate: '2026-07-08',
		title: 'code-server на VPS: VS Code в браузере для удалённой разработки',
		description:
			'code-server на VPS: Docker, SSL, Tailscale, extensions и безопасность. Полноценный VS Code в браузере без локальной установки.',
		category: 'DevOps',
		keywords: [
			'code-server VPS',
			'VS Code browser',
			'удалённая разработка',
			'cloud IDE',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** code-server — VS Code в браузере на [VPS](/blog/choose-vps/). Docker + [SSL](/blog/ssl-letsencrypt-vps/) + [Tailscale](/blog/tailscale-vpn-vps/) или [Authentik](/blog/authentik-sso-vps/). RAM 2 GB+ для комфортной работы.

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

\`\`\`
Browser (iPad, laptop, phone)
        ↓ HTTPS
   Nginx + SSL (+ Authentik forward auth)
        ↓
   code-server container
        ↓
   /home/coder/projects + Docker socket (optional)
\`\`\`

---

## Требования к VPS

| Нагрузка | RAM | CPU |
| --- | --- | --- |
| Лёгкие проекты (JS, Python) | 2 GB | 2 vCPU |
| TypeScript + LSP + Docker builds | 4 GB | 2–4 vCPU |
| Monorepo + несколько extensions | 8 GB | 4 vCPU |

SSD обязателен — LSP и \`node_modules\` I/O heavy.

---

## Docker Compose

\`\`\`yaml
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
\`\`\`

Reverse proxy — [Nginx](/blog/nginx-ili-caddy/) или [Traefik](/blog/traefik-reverse-proxy-vps/).

---

## Nginx + SSL

\`\`\`nginx
location / {
    proxy_pass https://127.0.0.1:8443;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection upgrade;
    proxy_set_header Accept-Encoding gzip;
    proxy_read_timeout 86400;
}
\`\`\`

\`proxy_read_timeout\` — для long-running terminal sessions.

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

\`\`\`bash
ssh-keygen -t ed25519 -C "coder@vps"
cat ~/.ssh/id_ed25519.pub  # → GitHub/GitLab deploy key
\`\`\`

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
| LSP OOM | \`typescript.tsserver.maxTsServerMemory\` |
| Slow file search | \`files.watcherExclude\`, .gitignore |
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

VPS 4 GB — [StormNet Cloud](https://stormnetcloud.com/). Безопасность — [Tailscale](/blog/tailscale-vpn-vps/) + [Authentik](/blog/authentik-sso-vps/). Альтернатива — [VS Code SSH](/blog/vscode-ssh-vps/).`,
	},
	{
		slug: 'syncthing-sync-vps',
		coverFile: 'cover-syncthing-vps.png',
		pubDate: '2026-07-08',
		title: 'Syncthing на VPS: синхронизация файлов без облака',
		description:
			'Syncthing на VPS: P2P sync, always-on node, Docker, версионирование и конфликты. Альтернатива Dropbox без посредника.',
		category: 'DevOps',
		keywords: [
			'Syncthing VPS',
			'P2P sync',
			'Dropbox alternative',
			'синхронизация файлов',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** Syncthing — децентрализованная синхронизация файлов device-to-device. VPS как always-on relay/node: Docker + [SSL GUI](/blog/ssl-letsencrypt-vps/) + [backup](/blog/backup-vps-3-2-1/) конфигурации.

Не хотите, чтобы файлы проходили через Dropbox/Google? Syncthing шифрует in transit, вы контролируете topology. [Nextcloud](/blog/nextcloud-oblako-vps/) — облако с UI; Syncthing — прямая sync папок.

---

## Syncthing vs Nextcloud vs rsync

| | Syncthing | [Nextcloud](/blog/nextcloud-oblako-vps/) | rsync + cron |
| --- | --- | --- | --- |
| Real-time sync | Да | Да | Нет (scheduled) |
| P2P | Да | Client-server | SSH one-way |
| Mobile app | Syncthing app | Nextcloud app | Нет |
| Conflict handling | Version vectors | Locking | Manual |
| VPS роль | Relay / always-on | Full server | Destination |

Часто используют вместе: Syncthing для dev-папок, Nextcloud для sharing с клиентами.

---

## Архитектура

\`\`\`
Laptop ←——P2P encrypted——→ VPS (always-on node)
   ↕                           ↕
Phone                    Home NAS / second VPS
\`\`\`

VPS не хранит ключи расшифровки содержимого — только relay или replica encrypted data.

---

## Требования к VPS

| Роль | RAM | Диск | Трафик |
| --- | --- | --- | --- |
| Relay only | 256 MB | 1 GB | Low |
| Always-on replica | 512 MB–1 GB | = sync folder size | Medium |
| Central hub (3+ devices) | 1 GB | Large SSD | High |

Relay не требует большого диска — только bandwidth.

---

## Docker Compose

\`\`\`yaml
services:
  syncthing:
    image: syncthing/syncthing:latest
    restart: unless-stopped
    hostname: vps-sync
    environment:
      STGUIADDRESS: 0.0.0.0:8384
    volumes:
      - ./st-config:/var/syncthing/config
      - ./sync:/var/syncthing/data
    ports:
      - "22000:22000/tcp"
      - "22000:22000/udp"
      - "21027:21027/udp"
      - "127.0.0.1:8384:8384"
\`\`\`

GUI — только через [Nginx reverse proxy](/blog/nginx-ili-caddy/) + auth.

---

## Первоначальная настройка

1. Откройте GUI \`https://sync.example.com\`
2. **Actions → Settings → GUI** — strong user/password
3. **Settings → Connections** — device ID вашего VPS
4. На laptop/phone: Add Remote Device → paste VPS device ID
5. Share folder → Send & Receive или Send Only

---

## Folder types

| Тип | Когда |
| --- | --- |
| Send & Receive | Двусторонняя sync |
| Send Only | VPS backup hub (phone → VPS only) |
| Receive Only | VPS collects from team |
| Ignore patterns | Exclude node_modules, .git |

**Send Only на VPS** — идеальный mobile backup без accidental delete propagation.

---

## Версионирование и конфликты

- **Settings → Folders → File Versioning** — Simple или Staggered
- Конфликты → \`.sync-conflict-*\` файлы — resolve manually
- **Ignore Delete** — защита от mass delete на одном device

---

## Relay vs direct connection

Syncthing предпочитает direct P2P. VPS помогает когда:

- Devices за NAT без port forward
- Need always-online copy
- [Tailscale](/blog/tailscale-vpn-vps/) mesh — direct without public relay

\`\`\`yaml
# Syncthing через Tailscale — disable public discovery
<connectionPriorityTcpLan>10</connectionPriorityTcpLan>
\`\`\`

---

## Безопасность

| Пункт | Действие |
| --- | --- |
| GUI auth | User/password, не public без auth |
| Device IDs | Approve only known devices |
| TLS GUI | [Let's Encrypt](/blog/ssl-letsencrypt-vps/) |
| Firewall | [nftables](/blog/nftables-firewall-vps/) — 22000 only if needed |
| Introducer | Off unless trust all devices |

---

## Backup конфигурации

\`\`\`bash
tar czf syncthing-config-$(date +%F).tar.gz ./st-config/
\`\`\`

Папка \`sync/\` — backup через [Restic](/blog/restic-backup-vps/) если VPS = replica hub.

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| Out of sync | Check folder errors, rescan, restart |
| Slow sync | Direct connection? Relay overhead |
| High CPU | Many small files, scan interval |
| Device disconnected | Firewall UDP 21027, NAT |
| Conflict storm | Send Only on one side, versioning |

---

## Use cases

- **Dev configs** — dotfiles, scripts между machines
- **Photo backup** — phone Send Only → VPS (или [Immich](/blog/immich-foto-bekap-vps/) для gallery UX)
- **Offsite replica** — VPS EU + NAS home
- **Team shared folder** — Receive Only VPS + Send from team laptops

---

## Итог

Syncthing — лучший P2P sync без vendor lock-in. VPS как always-on node решает «ноутбук был offline».

VPS 1 GB — [StormNet Cloud](https://stormnetcloud.com/). Для облака с sharing — [Nextcloud](/blog/nextcloud-oblako-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/).`,
	},
	{
		slug: 'harbor-docker-registry-vps',
		coverFile: 'cover-harbor-vps.png',
		pubDate: '2026-07-08',
		title: 'Harbor на VPS: private Docker Registry для CI/CD',
		description:
			'Harbor на VPS: установка, SSL, robot accounts, vulnerability scanning и интеграция с GitHub Actions, Jenkins и GitLab Runner.',
		category: 'DevOps',
		keywords: [
			'Harbor VPS',
			'Docker Registry',
			'private registry',
			'container images',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** Harbor — enterprise Docker/OCI registry с UI, RBAC, scanning и replication. VPS 4 GB+: Docker Compose или installer + [SSL](/blog/ssl-letsencrypt-vps/) + robot accounts для [CI/CD](/blog/github-actions-cicd/).

Docker Hub rate limits и публичные образы — риск supply chain. Private Harbor на [VPS](/blog/choose-vps/) = контроль версий, CVE scan, air-gapped deploy.

---

## Harbor vs Docker Registry vs GitHub GHCR

| | Harbor | registry:2 | GHCR |
| --- | --- | --- | --- |
| UI | Да | Нет | GitHub UI |
| Vulnerability scan | Trivy built-in | Нет | GitHub |
| RBAC | Projects, roles | Token only | Repo permissions |
| RAM | 4 GB+ | 512 MB | N/A |
| Self-hosted | Да | Да | Нет |

Для серьёзного CI — Harbor. Для minimal — [MinIO](/blog/minio-s3-na-vps/) + registry:2.

---

## Архитектура

\`\`\`
CI (GitHub Actions / Jenkins / GitLab Runner)
        ↓ docker push
   Harbor Registry (HTTPS)
        ↓ pull
Production VPS / K3s / [Docker Swarm](/blog/docker-swarm-na-vps/)
\`\`\`

---

## Требования к VPS

| Нагрузка | RAM | Диск |
| --- | --- | --- |
| Dev team, <50 images | 4 GB | 50 GB SSD |
| Production, scanning | 8 GB | 200 GB+ |
| Multi-tenant | 16 GB | NVMe |

Harbor heavy — не ставьте на 2 GB VPS.

---

## Установка (Docker Compose offline installer)

\`\`\`bash
wget https://github.com/goharbor/harbor/releases/download/v2.11.0/harbor-offline-installer-v2.11.0.tgz
tar xzf harbor-offline-installer-v2.11.0.tgz
cd harbor
cp harbor.yml.tmpl harbor.yml
# edit: hostname, admin password, HTTPS cert paths
./install.sh
\`\`\`

Или HTTPS через [Nginx](/blog/nginx-ili-caddy/) reverse proxy к harbor nginx.

---

## harbor.yml essentials

\`\`\`yaml
hostname: registry.example.com
https:
  port: 443
  certificate: /path/to/fullchain.pem
  private_key: /path/to/privkey.pem
harbor_admin_password: CHANGE_ME
data_volume: /data/harbor
\`\`\`

---

## Projects и RBAC

| Роль | Права |
| --- | --- |
| Project Admin | Full project control |
| Developer | push + pull |
| Guest | pull only |
| Limited Guest | pull public repos only |

Структура: \`library/\` (default), \`team-a/app\`, \`team-b/api\`.

---

## Robot accounts для CI

1. Project → Robot Accounts → New
2. Permissions: push + pull (or pull only for deploy)
3. Token → GitHub Secrets / [Vault](/blog/vault-secrets-vps/)

\`\`\`yaml
# GitHub Actions
- name: Login Harbor
  uses: docker/login-action@v3
  with:
    registry: registry.example.com
    username: robot$project+ci
    password: \${{ secrets.HARBOR_ROBOT_TOKEN }}
\`\`\`

---

## GitHub Actions push example

\`\`\`yaml
- name: Build and push
  uses: docker/build-push-action@v6
  with:
    context: .
    push: true
    tags: registry.example.com/myapp/api:\${{ github.sha }}
\`\`\`

Deploy stage — pull on [production VPS](/blog/docker-compose-vps/) via SSH or [Ansible](/blog/ansible-avtomatizaciya-servera/).

---

## Vulnerability scanning

Harbor 2.x — Trivy scanner built-in:

- Project → Configuration → Automatically scan images on push
- Intercept Critical CVE — prevent pull in production
- Reports в UI + webhooks

---

## Replication и backup

- **Replication** — Harbor → Harbor (DR site) или Harbor → [MinIO S3](/blog/minio-s3-na-vps/)
- **Backup** — \`/data/harbor\` volume + DB postgres inside stack
- Schedule — [Restic](/blog/restic-backup-vps/) nightly

---

## Docker daemon insecure registry (avoid)

Production — always valid TLS. Dev only:

\`\`\`json
{ "insecure-registries": ["registry.local:5000"] }
\`\`\`

---

## Integration matrix

| CI | Push | Pull deploy |
| --- | --- | --- |
| [GitHub Actions](/blog/github-actions-cicd/) | docker/login-action | SSH + docker pull |
| [Jenkins](/blog/jenkins-ci-cd-vps/) | docker.withRegistry | kubectl/compose |
| [GitLab Runner](/blog/gitlab-runner-cicd-vps/) | CI_REGISTRY vars | helm upgrade |

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| push denied | Robot permissions, project quota |
| x509 certificate | CA trust on build agents |
| Scan stuck | Trivy DB update, RAM |
| Disk full | Garbage collection, retention policy |
| Slow push | Layer cache, SSD, bandwidth |

\`\`\`bash
# GC unused blobs
docker exec harbor-core harbor_gc
\`\`\`

---

## Hardening

- [CrowdSec](/blog/crowdsec-zashchita-vps/) + rate limit login
- Disable self-registration
- OIDC via [Authentik](/blog/authentik-sso-vps/)
- Separate robot per pipeline — rotate tokens
- [nftables](/blog/nftables-firewall-vps/) — registry only from CI IPs if static

---

## Итог

Harbor — стандарт private registry для self-hosted DevOps. CVE scan + RBAC + robot accounts закрывают production requirements.

VPS 8 GB — [StormNet Cloud](https://stormnetcloud.com/). CI — [Jenkins](/blog/jenkins-ci-cd-vps/) или [GitHub Actions](/blog/github-actions-cicd/). Storage backend — [MinIO](/blog/minio-s3-na-vps/).`,
	},
	{
		slug: 'adguard-dns-vps',
		coverFile: 'cover-adguard-vps.png',
		pubDate: '2026-07-08',
		title: 'AdGuard Home на VPS: DNS-фильтрация и блокировка рекламы в сети',
		description:
			'AdGuard Home на VPS: Docker, DoH/DoT, blocklists, parental control и интеграция с домашним роутером. Ad blocking на уровне DNS.',
		category: 'DevOps',
		keywords: [
			'AdGuard Home VPS',
			'DNS filtering',
			'блокировка рекламы',
			'Pi-hole alternative',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** AdGuard Home — DNS-сервер с фильтрацией рекламы, trackers и malware domains. VPS 512 MB–1 GB: Docker + upstream DoH + [SSL admin UI](/blog/ssl-letsencrypt-vps/). Роутер → VPS DNS = ad-free на всех устройствах.

Pi-hole устаревает в UX? AdGuard Home — современный UI, DoH/DoT out of box, parental schedules. VPS как central DNS для home + [Tailscale](/blog/tailscale-vpn-vps/) devices.

---

## AdGuard Home vs Pi-hole vs NextDNS

| | AdGuard Home | Pi-hole | NextDNS |
| --- | --- | --- | --- |
| Self-hosted | Да | Да | SaaS |
| DoH/DoT server | Да | Plugins | Да |
| UI | Modern | Classic | Web |
| RAM | 512 MB | 512 MB | N/A |
| Cost | VPS | VPS | Free tier limited |

---

## Архитектура

\`\`\`
Devices (phone, TV, laptop)
        ↓ DNS queries :53 or DoH
   AdGuard Home on VPS
        ↓ filtered upstream
   Cloudflare 1.1.1.1 / Quad9 DoH
\`\`\`

VPS должен быть **stable IP** — домашний роутер указывает на него как DNS.

---

## Требования к VPS

| Сценарий | RAM | Трафик |
| --- | --- | --- |
| Семья 5–10 devices | 512 MB | ~1 GB/мес DNS |
| 50 queries/sec | 1 GB | Low bandwidth |
| Public resolver (не рекомендуется) | 2 GB+ | DDoS risk |

DNS lightweight — но latency matters. VPS ближе к пользователям geographically.

---

## Docker Compose

\`\`\`yaml
services:
  adguard:
    image: adguard/adguardhome:latest
    restart: unless-stopped
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "853:853/tcp"   # DoT
      - "784:784/udp"   # DNS-over-QUIC optional
      - "127.0.0.1:3000:3000"  # initial setup
      - "127.0.0.1:8080:80"    # admin after setup
    volumes:
      - ./adguard/work:/opt/adguardhome/work
      - ./adguard/conf:/opt/adguardhome/conf
\`\`\`

Port 53 на VPS — может конфликтовать с systemd-resolved. Disable stub:

\`\`\`bash
sudo systemctl disable systemd-resolved
# or change AdGuard to 5353 and DNAT from router
\`\`\`

---

## Первоначальная setup wizard

1. \`http://VPS_IP:3000\` — create admin
2. Port 53 DNS — confirm
3. Upstream: \`https://dns.cloudflare.com/dns-query\` (DoH)
4. Blocklists: AdGuard DNS filter + OISD + Steven Black
5. Admin UI move to port 80 behind [Nginx](/blog/nginx-ili-caddy/)

---

## Настройка домашнего роутера

| Router | Setting |
| --- | --- |
| DHCP DNS | Primary: VPS_IP, Secondary: 1.1.1.1 fallback |
| Custom DNS | Disable ISP DNS |
| DoH on router | Point to AdGuard DoH URL if supported |

Verify: \`nslookup doubleclick.net\` → 0.0.0.0 or NXDOMAIN.

---

## DoH / DoT для mobile

**AdGuard Home → Settings → Encryption settings**

- Enable HTTPS, upload [Let's Encrypt](/blog/ssl-letsencrypt-vps/) certs
- DoH: \`https://dns.example.com/dns-query\`
- Android Private DNS: \`dns.example.com\`
- iOS: AdGuard app or DNS profile

---

## Custom filtering rules

\`\`\`
||tracker.example.com^
@@||allowlist.example.com^
|https://ads.example.com^$important
\`\`\`

- **Block** social trackers on smart TV
- **Allow** bank domains (avoid false positives)
- **Schedule** — parental control evening block

---

## Query log и analytics

Dashboard показывает:

- Top blocked domains
- Top clients
- Query types (A, AAAA, HTTPS SVCB)

Privacy: disable query log retention if GDPR concern, or rotate logs.

---

## Tailscale integration

AdGuard слушает на Tailscale IP — DNS для mesh network без public exposure:

\`\`\`
Listen on: 100.x.x.x (Tailscale)
\`\`\`

[WireGuard](/blog/wireguard-vpn-na-vps/) alternative — same pattern.

---

## Безопасность

| Риск | Mitigation |
| --- | --- |
| Open resolver abuse | Allow only your IPs in Access settings |
| DNS amplification | Rate limit, [nftables](/blog/nftables-firewall-vps/) |
| Admin brute force | Strong password, VPN-only admin |
| VPS compromise | DNS MITM — monitor, 2FA admin |

**Never run open public DNS** without rate limits — abuse for DDoS.

---

## Failover

VPS down = no DNS = no internet at home.

| Strategy | Setup |
| --- | --- |
| Secondary DNS | Router: VPS + 1.1.1.1 (ads pass on fallback) |
| Local AdGuard | Raspberry Pi primary, VPS secondary |
| Health check | [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) ping VPS:53 |

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| Some ads pass | HTTPS ads need browser extension too |
| Broken sites | Query log → unblock, custom allow |
| Slow pages | Upstream DoH latency — switch upstream |
| Port 53 in use | systemd-resolved, stop or remap |
| IPv6 leaks | Enable IPv6 in AdGuard + block AAAA or filter v6 |

---

## Связка с экосистемой

- VPN mesh — [Tailscale](/blog/tailscale-vpn-vps/)
- Monitoring — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)
- Firewall — [nftables](/blog/nftables-firewall-vps/)
- Logs — [Loki](/blog/loki-grafana-logi-vps/) if shipping query logs

---

## Итог

AdGuard Home на VPS — один DNS для всей сети: реклама, trackers, malware domains off. Minimal RAM, maximum comfort.

VPS 1 GB EU — [StormNet Cloud](https://stormnetcloud.com/). Безопасный доступ — [Tailscale](/blog/tailscale-vpn-vps/). Мониторинг — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).`,
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
