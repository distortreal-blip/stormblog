import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.join(__dirname, '../src/content/blog');
const assetsRoot =
	'C:/Users/User/.cursor/projects/C-Users-User-AppData-Local-Temp-08672e1e-9435-4efb-b076-895581788745/assets';

const articles = [
	{
		slug: 'rocky-linux-9-nastroyka-vps',
		coverFile: 'cover-rocky-linux-vps.png',
		pubDate: '2026-07-02',
		title: 'Rocky Linux 9 на VPS: первая настройка сервера',
		description:
			'Rocky Linux 9 на VPS: обновления, SSH, firewall, swap, hardening. Enterprise-альтернатива CentOS для production и DevOps.',
		category: 'Linux',
		keywords: ['Rocky Linux 9', 'VPS настройка', 'CentOS альтернатива', 'RHEL clone', 'Linux сервер', 'Storm Cloud'],
		body: `**Краткий ответ:** Rocky Linux 9 — RHEL-совместимый дистрибутив для production. На VPS: \`dnf update\`, пользователь с sudo, SSH по ключам, [nftables/UFW](/blog/nftables-firewall-vps/), swap — как на [Debian 12](/blog/debian-12-pervaya-nastroyka-vps/) и [Ubuntu 24.04](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).

Rocky выбирают, когда нужна стабильность RHEL-экосистемы без подписки: \`dnf\`, SELinux, долгий lifecycle (2032).

---

## Rocky vs Alma vs Debian/Ubuntu

| | Rocky 9 | Debian 12 | Ubuntu 24.04 |
| --- | --- | --- | --- |
| Пакеты | RHEL, dnf | apt, стабильно | apt, свежее |
| SELinux | Да (enforcing) | AppArmor | AppArmor |
| Docker/k8s | Отлично | Отлично | Отлично |
| Документация | Много RHEL-туториалов | Огромная | Огромная |

---

## Первый вход

\`\`\`bash
sudo dnf update -y
sudo dnf install vim curl git htop -y
\`\`\`

Создайте пользователя (не работайте под root):

\`\`\`bash
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG wheel deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
\`\`\`

---

## SSH hardening

\`\`\`bash
# /etc/ssh/sshd_config.d/99-hardening.conf
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
\`\`\`

\`\`\`bash
sudo systemctl restart sshd
\`\`\`

Полный чеклист — [защита VPS](/blog/zashchita-vps-ot-vzloma/), [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/).

---

## Firewall (firewalld)

\`\`\`bash
sudo systemctl enable --now firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
\`\`\`

На Rocky по умолчанию firewalld, не UFW. Логика та же: только нужные порты.

---

## Swap на VPS с 1 GB RAM

\`\`\`bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
\`\`\`

---

## Docker на Rocky 9

\`\`\`bash
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
sudo systemctl enable --now docker
sudo usermod -aG docker deploy
\`\`\`

Дальше — [Docker Compose](/blog/docker-compose-vps/), [Portainer](/blog/portainer-docker-vps/).

---

## SELinux и Docker volumes

При ошибках «Permission denied» на volume:

\`\`\`bash
sudo chcon -Rt svirt_sandbox_file_t /path/to/volume
\`\`\`

Или временно \`setenforce 0\` для диагностики (не в production).

---

## Итог

Rocky Linux 9 на VPS — solid choice для enterprise-стека: RHEL-совместимость, SELinux, долгая поддержка. Настройка = update + SSH + firewall + swap.

VPS — [StormNet Cloud](https://stormnetcloud.com/). Альтернативы — [Debian 12](/blog/debian-12-pervaya-nastroyka-vps/), [Ubuntu 24.04](/blog/ubuntu-24-04-pervaya-nastroyka-vps/). Автоматизация — [cloud-init](/blog/cloud-init-avtomatizaciya-vps/).`,
	},
	{
		slug: 'podman-rootless-vps',
		coverFile: 'cover-podman-vps.png',
		pubDate: '2026-07-03',
		title: 'Podman rootless на VPS: контейнеры без Docker daemon',
		description:
			'Podman на VPS: rootless-контейнеры, podman-compose, systemd user units. Безопасная альтернатива Docker для одного сервера.',
		category: 'Docker',
		keywords: ['Podman VPS', 'rootless containers', 'Docker альтернатива', 'podman-compose', 'containerd', 'Storm Cloud'],
		body: `**Краткий ответ:** Podman запускает OCI-контейнеры без фонового daemon. Rootless-режим — контейнеры от обычного пользователя, меньше attack surface чем Docker socket.

На shared VPS или когда не хотите отдавать root Docker — Podman + [systemd user](/blog/systemd-linux-servisy/) = production-ready для одного приложения.

---

## Podman vs Docker

| | Podman | Docker |
| --- | --- | --- |
| Daemon | Нет | dockerd |
| Rootless | Из коробки | Возможен, сложнее |
| docker-compose | podman-compose / compose | Да |
| Kubernetes | pods natively | через k8s |

Миграция с [Docker Compose](/blog/docker-compose-vps/) — часто достаточно заменить \`docker\` на \`podman\`.

---

## Установка (Ubuntu/Debian)

\`\`\`bash
sudo apt install podman podman-compose -y
podman --version
\`\`\`

Rocky/RHEL:

\`\`\`bash
sudo dnf install podman podman-compose -y
\`\`\`

---

## Rootless setup

\`\`\`bash
# От пользователя deploy (не root)
podman info --format '{{.Host.Security.Rootless}}'
\`\`\`

Если \`false\`, настройте subuid/subgid:

\`\`\`bash
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 deploy
\`\`\`

Перелогиньтесь.

---

## Первый контейнер

\`\`\`bash
podman run -d --name web -p 8080:80 docker.io/nginx:alpine
curl localhost:8080
\`\`\`

---

## podman-compose

\`\`\`yaml
# compose.yml
services:
  app:
    image: docker.io/library/nginx:alpine
    ports:
      - "8080:80"
\`\`\`

\`\`\`bash
podman-compose up -d
\`\`\`

Reverse proxy — [Nginx](/blog/nginx-ili-caddy/) или [Traefik](/blog/traefik-reverse-proxy-vps/) на хосте.

---

## Автозапуск через systemd user

\`\`\`bash
podman generate systemd --name web --files --new
mkdir -p ~/.config/systemd/user
mv container-web.service ~/.config/systemd/user/
systemctl --user enable --now container-web.service
loginctl enable-linger deploy
\`\`\`

\`enable-linger\` — контейнеры стартуют после reboot без login session.

---

## Безопасность

- Не давайте доступ к Docker socket на prod — Podman rootless решает это
- Обновляйте образы: \`podman pull\` + restart
- Сеть — [nftables](/blog/nftables-firewall-vps/), только 80/443 снаружи

---

## Итог

Podman rootless на VPS — контейнеры без daemon и без root. Идеален для solo-dev и одного стека приложений.

VPS 1 GB+ — [StormNet Cloud](https://stormnetcloud.com/). UI — [Portainer](/blog/portainer-docker-vps/) (Docker). Оркестрация — [k3s](/blog/k3s-klaster-na-vps/).`,
	},
	{
		slug: 'plausible-analytics-vps',
		coverFile: 'cover-plausible-vps.png',
		pubDate: '2026-07-04',
		title: 'Plausible Analytics на VPS: приватная веб-аналитика',
		description:
			'Self-hosted Plausible на VPS: Docker, GDPR-friendly метрики без cookies, альтернатива Google Analytics для блога и SaaS.',
		category: 'DevOps',
		keywords: ['Plausible Analytics', 'self-hosted analytics', 'VPS метрики', 'GDPR', 'веб-аналитика', 'Storm Cloud'],
		body: `**Краткий ответ:** Plausible — лёгкая privacy-first аналитика. Self-hosted на VPS 2 GB: Docker Compose, PostgreSQL + ClickHouse, snippet на сайт. Без cookie banner в EU (проверьте юриста).

Для блога вроде Storm Cloud Blog — альтернатива GA без «накрутки ботами» и без передачи данных Google.

---

## Plausible vs GA vs Matomo

| | Plausible CE | Google Analytics | Matomo |
| --- | --- | --- | --- |
| RAM | ~2 GB | SaaS | 4 GB+ |
| Cookies | Нет | Да | Опционально |
| Self-hosted | Да (CE) | Нет | Да |
| Сложность | Средняя | Низкая | Высокая |

Логи сервера — [journalctl](/blog/journalctl-logi-linux-vps/). Uptime — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).

---

## Требования

- VPS 2 GB RAM минимум (ClickHouse + Postgres)
- Домен \`analytics.example.com\`
- [SSL](/blog/ssl-letsencrypt-vps/)

---

## Docker Compose (упрощённо)

Клонируйте официальный community edition:

\`\`\`bash
git clone https://github.com/plausible/community-edition plausible-ce
cd plausible-ce
cp plausible-conf.env.example plausible-conf.env
# Задайте BASE_URL, SECRET_KEY_BASE, TOTP_VAULT_KEY
docker compose up -d
\`\`\`

Reverse proxy — [Nginx](/blog/nginx-ili-caddy/) → \`127.0.0.1:8000\`.

---

## Snippet на сайт

\`\`\`html
<script defer data-domain="blog.example.com"
  src="https://analytics.example.com/js/script.js"></script>
\`\`\`

Для Astro — в \`BaseLayout.astro\` или через env-переменную только в production.

---

## Что отслеживать

- Pageviews, referrers, countries
- UTM-кампании
- 404 страницы (custom events)

Не ждите «SEO-ранга от аналитики» — метрики для решений, не для накрутки.

---

## Бэкапы

\`\`\`bash
docker compose exec db pg_dump -U postgres plausible_db > backup.sql
\`\`\`

Стратегия [3-2-1](/blog/backup-vps-3-2-1/) + [Restic](/blog/restic-backup-vps/).

---

## Безопасность

- Не открывайте Plausible без auth в интернет — используйте SSO или VPN ([Tailscale](/blog/tailscale-vpn-vps/))
- Обновляйте CE регулярно
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на login

---

## Итог

Plausible CE на VPS — своя аналитика без GA и cookie-баннеров. 2 GB RAM, Docker, SSL — и вы видите реальный трафик.

VPS 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Мониторинг — [Grafana](/blog/grafana-prometheus-vps/).`,
	},
	{
		slug: 'bookstack-wiki-vps',
		coverFile: 'cover-bookstack-vps.png',
		pubDate: '2026-07-05',
		title: 'BookStack на VPS: wiki и база знаний команды',
		description:
			'BookStack wiki на VPS: Docker, книги/полки/главы, права доступа, LDAP. Self-hosted документация для команды и DevOps.',
		category: 'DevOps',
		keywords: ['BookStack VPS', 'wiki self-hosted', 'база знаний', 'team docs', 'DevOps документация', 'Storm Cloud'],
		body: `**Краткий ответ:** BookStack — wiki с WYSIWYG-редактором: полки → книги → главы. На VPS 1–2 GB: Docker + MariaDB, [SSL](/blog/ssl-letsencrypt-vps/), бэкапы.

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

\`\`\`yaml
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
\`\`\`

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

\`\`\`bash
# MariaDB dump + /config volume
mysqldump -u bookstack -p bookstack > wiki-backup.sql
tar czf bookstack-config.tar.gz ./bookstack
\`\`\`

[Restic](/blog/restic-backup-vps/) на [MinIO](/blog/minio-s3-na-vps/).

---

## Поиск

Встроенный поиск по заголовкам и тексту. Для большого объёма — [Meilisearch](/blog/meilisearch-poisk-na-vps/) как external index (опционально).

---

## Итог

BookStack на VPS — wiki за вечер. Docker, MariaDB, SSL — и команда пишет runbook'и в одном месте.

VPS 1–2 GB — [StormNet Cloud](https://stormnetcloud.com/). Секреты — [Vault](/blog/vault-secrets-vps/). Git-доки — [Gitea](/blog/gitea-git-server-vps/).`,
	},
	{
		slug: 'postgresql-replication-vps',
		coverFile: 'cover-postgres-replication-vps.png',
		pubDate: '2026-07-06',
		title: 'PostgreSQL replication на VPS: streaming replica и failover',
		description:
			'Настройка PostgreSQL streaming replication на VPS: primary/replica, pg_basebackup, мониторинг lag. High availability для малого проекта.',
		category: 'DevOps',
		keywords: ['PostgreSQL replication', 'streaming replica VPS', 'PostgreSQL HA', 'pg_basebackup', 'failover', 'Storm Cloud'],
		body: `**Краткий ответ:** Primary принимает записи, replica — read-only копия через WAL streaming. Два VPS или primary + replica на разных AZ — защита от падения диска/сервера.

Не заменяет полноценный Patroni-кластер, но для SaaS на 2 VPS — must-have step перед ростом.

---

## Архитектура

\`\`\`
App → Primary (read/write)
         ↓ WAL stream
      Replica (read-only, backup)
\`\`\`

Тюнинг primary — [PostgreSQL tuning](/blog/postgresql-tuning-vps/). Выбор БД — [MySQL vs PostgreSQL](/blog/mysql-ili-postgresql-vps/).

---

## Primary: postgresql.conf

\`\`\`ini
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB
\`\`\`

\`\`\`ini
# pg_hba.conf — разрешить replica IP
host replication replicator REPLICA_IP/32 scram-sha-256
\`\`\`

\`\`\`sql
CREATE USER replicator WITH REPLICATION PASSWORD 'secret';
\`\`\`

---

## Replica: pg_basebackup

\`\`\`bash
sudo systemctl stop postgresql
sudo rm -rf /var/lib/postgresql/16/main/*
sudo -u postgres pg_basebackup -h PRIMARY_IP -D /var/lib/postgresql/16/main -U replicator -P -R
sudo systemctl start postgresql
\`\`\`

Флаг \`-R\` создаёт \`standby.signal\` и \`primary_conninfo\`.

---

## Проверка lag

\`\`\`sql
-- на primary
SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn
FROM pg_stat_replication;
\`\`\`

\`\`\`sql
-- на replica
SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn();
\`\`\`

Алерты — [Prometheus](/blog/grafana-prometheus-vps/) + [Alertmanager](/blog/prometheus-alertmanager-vps/).

---

## Read-only на replica

\`\`\`sql
-- replica по умолчанию hot standby
SELECT pg_is_in_recovery(); -- true
\`\`\`

Приложение: read queries → replica, writes → primary. Laravel/Django — database routing.

---

## Failover (ручной)

1. Promote replica: \`pg_ctl promote\` или \`pg_promote()\`
2. Переключить DNS/apps на новый primary
3. Старый primary — rebuild как replica

Автоматический failover — Patroni/etcd (отдельная тема, 3+ nodes).

---

## Бэкапы

Replica — удобно для \`pg_dump\` без нагрузки на primary. Плюс [Restic](/blog/restic-backup-vps/) WAL archive (опционально).

---

## Итог

PostgreSQL streaming replication на двух VPS — первый шаг к HA. Primary + replica, мониторинг lag, plan ручного failover.

VPS 2× — [StormNet Cloud](https://stormnetcloud.com/). Балансировка — [HAProxy](/blog/haproxy-load-balancer-vps/). VPN между серверами — [WireGuard](/blog/wireguard-vpn-na-vps/).`,
	},
	{
		slug: 'authentik-sso-vps',
		coverFile: 'cover-authentik-vps.png',
		pubDate: '2026-07-07',
		title: 'Authentik SSO на VPS: единый вход для сервисов',
		description:
			'Authentik на VPS: OAuth2/OIDC, SAML, LDAP outpost. Single Sign-On для Gitea, Grafana, BookStack и своих приложений.',
		category: 'DevOps',
		keywords: ['Authentik SSO', 'OAuth VPS', 'single sign-on', 'OIDC self-hosted', 'identity provider', 'Storm Cloud'],
		body: `**Краткий ответ:** Authentik — IdP (Identity Provider) self-hosted. Один логин для [Grafana](/blog/grafana-prometheus-vps/), [Gitea](/blog/gitea-git-server-vps/), [BookStack](/blog/bookstack-wiki-vps/). Docker Compose на VPS 2 GB.

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

\`\`\`yaml
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
\`\`\`

\`https://auth.example.com\` через [Traefik](/blog/traefik-reverse-proxy-vps/) + [SSL](/blog/ssl-letsencrypt-vps/).

---

## Первый admin

Откройте setup wizard, создайте admin, включите 2FA (TOTP).

---

## OAuth2 для приложения

1. Authentik → Applications → Provider (OAuth2/OIDC)
2. Redirect URI: \`https://grafana.example.com/login/generic_oauth\`
3. Application → bind provider
4. В Grafana \`grafana.ini\` — generic_oauth config

То же для Gitea, BookStack, [Portainer](/blog/portainer-docker-vps/).

---

## Forward auth (outpost)

Authentik Outpost перед [Nginx](/blog/nginx-ili-caddy/) — защита internal admin без правок каждого app:

\`\`\`
User → Nginx → Authentik outpost → App (headers X-authentik-*)
\`\`\`

---

## Безопасность

- Только HTTPS
- 2FA обязательна для admin
- Не открывайте Authentik без rate limit — [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/)
- Admin через [Tailscale](/blog/tailscale-vpn-vps/) (опционально)

---

## Итог

Authentik на VPS — свой SSO для internal stack. OAuth2 + 2FA + один login для всей инфраструктуры.

VPS 2 GB — [StormNet Cloud](https://stormnetcloud.com/). VPN — [WireGuard](/blog/wireguard-vpn-na-vps/). Мониторинг auth — [Loki logs](/blog/loki-grafana-logi-vps/).`,
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
