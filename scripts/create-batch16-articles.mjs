import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.join(__dirname, '../src/content/blog');
const assetsRoot =
	'C:/Users/User/.cursor/projects/C-Users-User-AppData-Local-Temp-6db3dac4-eb42-4608-8fd2-b5369ae9bf0c/assets';

const articles = [
	{
		slug: 'gitea-git-server-vps',
		coverFile: 'cover-gitea-vps.png',
		title: 'Gitea на VPS: свой Git-сервер и CI за вечер',
		description:
			'Развёртывание Gitea на VPS: Docker, SSH-ключи, Actions runner, бэкапы репозиториев. Альтернатива GitHub для команды и pet-проектов.',
		category: 'DevOps',
		keywords: ['Gitea VPS', 'Git сервер', 'self-hosted Git', 'Gitea Actions', 'CI/CD', 'Storm Cloud'],
		body: `**Краткий ответ:** Gitea — лёгкий self-hosted Git с веб-UI, PR, issues и Actions. На VPS 1–2 GB RAM: Docker Compose, PostgreSQL, [SSL](/blog/ssl-letsencrypt-vps/) через [Nginx](/blog/nginx-ili-caddy/).

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

\`\`\`yaml
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
\`\`\`

Reverse proxy — [Traefik](/blog/traefik-reverse-proxy-vps/) или Nginx. SSH Git через порт 2222.

---

## Первый запуск

1. Откройте \`https://git.example.com\`
2. Создайте admin, отключите open registration или включите только по invite
3. Добавьте SSH-ключ в Settings → SSH Keys
4. \`git clone git@git.example.com:user/repo.git\`

---

## Gitea Actions runner

\`\`\`bash
# На отдельном VPS или том же (не production!)
docker run -d --name gitea-runner \\
  -e GITEA_INSTANCE_URL=https://git.example.com \\
  -e GITEA_RUNNER_REGISTRATION_TOKEN=TOKEN_FROM_UI \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  gitea/act_runner:latest
\`\`\`

Runner выполняет CI — изолируйте как [GitLab Runner](/blog/gitlab-runner-cicd-vps/). Альтернатива — webhook на [GitHub Actions](/blog/github-actions-cicd/) для mirror.

---

## Бэкапы

\`\`\`bash
# Ежедневно через cron
tar czf /backup/gitea-\$(date +%F).tar.gz ./gitea ./postgres
\`\`\`

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

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). CI/CD — [GitHub Actions](/blog/github-actions-cicd/). Секреты — [Vault](/blog/vault-secrets-vps/).`,
	},
	{
		slug: 'postfix-dovecot-pochta-vps',
		coverFile: 'cover-postfix-mail-vps.png',
		title: 'Postfix + Dovecot на VPS: свой почтовый сервер',
		description:
			'Настройка почты на VPS: Postfix SMTP, Dovecot IMAP, SPF, DKIM, DMARC. Когда нужен свой mail и как не попасть в spam.',
		category: 'DevOps',
		keywords: ['Postfix VPS', 'Dovecot IMAP', 'свой mail сервер', 'SPF DKIM DMARC', 'почта на VPS', 'Storm Cloud'],
		body: `**Краткий ответ:** Postfix принимает и отправляет SMTP, Dovecot отдаёт IMAP. На VPS нужны reverse DNS, SPF/DKIM/DMARC и репутация IP — иначе письма в spam.

Transactional mail (регистрация, сброс пароля) с приложения — частый кейс. SaaS (SendGrid, Mailgun) проще, но свой Postfix даёт контроль и нулевую абонплату за объём.

---

## Когда свой mail на VPS — плохая идея

- Массовые рассылки → используйте ESP
- Shared IP без rDNS → 90% в spam
- Нет времени на DMARC/DKIM → лучше SaaS

Когда OK: 10–500 писем/день, свой домен, чистый IP, [Debian/Ubuntu](/blog/debian-12-pervaya-nastroyka-vps/) с [базовой защитой](/blog/zashchita-vps-ot-vzloma/).

---

## Стек

\`\`\`
Internet → Postfix :25/:587 → Dovecot :993 (IMAP)
                ↓
           Maildir /var/mail/vhosts/
\`\`\`

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Firewall — [nftables](/blog/nftables-firewall-vps/) или UFW: 25, 587, 993.

---

## Установка (Debian/Ubuntu)

\`\`\`bash
sudo apt install postfix dovecot-imapd dovecot-lmtpd opendkim opendkim-tools -y
# Postfix: Internet Site, mail.example.com
\`\`\`

Virtual domains в \`/etc/postfix/main.cf\`:

\`\`\`
myhostname = mail.example.com
mydomain = example.com
myorigin = $mydomain
inet_interfaces = all
mydestination = localhost
virtual_mailbox_domains = example.com
virtual_mailbox_base = /var/mail/vhosts
virtual_mailbox_maps = hash:/etc/postfix/vmailbox
\`\`\`

---

## DKIM + SPF + DMARC

**SPF** — TXT у домена:

\`\`\`
v=spf1 mx ip4:YOUR_VPS_IP -all
\`\`\`

**DKIM** — opendkim генерирует ключ, TXT \`default._domainkey\`.

**DMARC** — TXT \`_dmarc.example.com\`:

\`\`\`
v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com
\`\`\`

Проверка: mail-tester.com после настройки.

---

## Reverse DNS (PTR)

У провайдера VPS PTR для IP → \`mail.example.com\`. Без rDNS Gmail часто отклоняет. У [StormNet Cloud](https://stormnetcloud.com/) настройте в панели.

---

## Dovecot IMAP

\`\`\`
# /etc/dovecot/conf.d/10-mail.conf
mail_location = maildir:/var/mail/vhosts/%d/%n
\`\`\`

Клиент: Thunderbird, Apple Mail. Webmail — Roundcube (опционально).

---

## Мониторинг очереди

\`\`\`bash
mailq
postqueue -p
journalctl -u postfix -f
\`\`\`

Алерты — [Prometheus](/blog/grafana-prometheus-vps/) или [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) на порт 25.

---

## Итог

Свой mail на VPS реален для transactional и малого объёма. PTR + DKIM + DMARC обязательны. Для marketing — ESP, не Postfix.

VPS с чистым IP — [StormNet Cloud](https://stormnetcloud.com/). DNS — [Cloudflare](/blog/cloudflare-i-vps/). Защита — [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/).`,
	},
	{
		slug: 'meilisearch-poisk-na-vps',
		coverFile: 'cover-meilisearch-vps.png',
		title: 'Meilisearch на VPS: мгновенный поиск для сайта и API',
		description:
			'Meilisearch на VPS: установка, индексация, typo-tolerance, интеграция с Laravel/Django/Next.js. Альтернатива Elasticsearch для малого и среднего проекта.',
		category: 'DevOps',
		keywords: ['Meilisearch VPS', 'full-text search', 'поиск на сайте', 'Laravel Scout', 'Elasticsearch альтернатива', 'Storm Cloud'],
		body: `**Краткий ответ:** Meilisearch — быстрый full-text search с typo-tolerance и простым REST API. На VPS 1 GB RAM: Docker, master key, индексация из [PostgreSQL](/blog/postgresql-tuning-vps/) или приложения.

SQL \`LIKE '%query%'\` ломается на 100k+ строк. Elasticsearch тяжёлый для pet-проекта. Meilisearch — зол середины.

---

## Meilisearch vs Elasticsearch

| | Meilisearch | Elasticsearch |
| --- | --- | --- |
| RAM | 512 MB–2 GB | 4 GB+ |
| Setup | Минуты | Часы |
| Typo-tolerance | Из коробки | Плагины |
| Analytics/logs | Нет | Да ([ClickHouse](/blog/clickhouse-analytics-vps/)) |

Для логов — [Loki](/blog/loki-grafana-logi-vps/). Для поиска товаров/статей — Meilisearch.

---

## Docker

\`\`\`yaml
services:
  meilisearch:
    image: getmeili/meilisearch:v1.11
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: \${MEILI_MASTER_KEY}
      MEILI_ENV: production
    volumes:
      - ./meili_data:/meili_data
    ports:
      - "127.0.0.1:7700:7700"
\`\`\`

\`\`\`bash
openssl rand -hex 32  # master key
\`\`\`

Nginx reverse proxy + [SSL](/blog/ssl-letsencrypt-vps/). Не открывайте 7700 без auth.

---

## Индексация

\`\`\`bash
curl -X POST 'https://search.example.com/indexes/articles/documents' \\
  -H "Authorization: Bearer MASTER_KEY" \\
  -H 'Content-Type: application/json' \\
  --data-binary @articles.json
\`\`\`

\`\`\`json
[
  {"id": 1, "title": "VPS для новичка", "content": "..."},
  {"id": 2, "title": "Docker Compose", "content": "..."}
]
\`\`\`

Поиск:

\`\`\`bash
curl 'https://search.example.com/indexes/articles/search' \\
  -H "Authorization: Bearer MASTER_KEY" \\
  -d '{"q": "docker vps"}'
\`\`\`

---

## Laravel Scout

\`\`\`php
// .env
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=https://search.example.com
MEILISEARCH_KEY=MASTER_KEY
\`\`\`

\`\`\`bash
php artisan scout:import "App\\\\Models\\\\Article"
\`\`\`

См. также [Laravel на VPS](/blog/laravel-na-vps/) и [Redis](/blog/redis-kesh-vps/) для кеша.

---

## Django / Next.js

- Django: \`django-meilisearch\` или прямой HTTP client
- Next.js: server action → Meilisearch API, UI — instant search

Деплой приложения — [Django](/blog/django-deploy-na-vps/) / [Next.js](/blog/nextjs-deploy-na-vps/).

---

## Бэкапы индекса

\`\`\`bash
curl -X POST 'https://search.example.com/dumps' \\
  -H "Authorization: Bearer MASTER_KEY"
\`\`\`

Volume \`meili_data\` — в [Restic](/blog/restic-backup-vps/). При падении — переиндексация из БД.

---

## RAM и production

- Dev: 512 MB
- 100k документов: 1–2 GB
- Несколько индексов: 2 GB VPS

Мониторинг — [Netdata](/blog/netdata-monitoring-vps/) или [Grafana](/blog/grafana-prometheus-vps/).

---

## Итог

Meilisearch на VPS — поиск за вечер. Docker + master key + reverse proxy = production-ready для SaaS и e-commerce.

VPS 1–2 GB — [StormNet Cloud](https://stormnetcloud.com/). Стек приложения — [Docker Compose](/blog/docker-compose-vps/).`,
	},
	{
		slug: 'nftables-firewall-vps',
		coverFile: 'cover-nftables-vps.png',
		title: 'nftables на VPS: современный firewall вместо iptables',
		description:
			'Настройка nftables на Linux VPS: базовые правила, SSH, HTTP/HTTPS, rate limit. Замена UFW и iptables в 2026.',
		category: 'DevOps',
		keywords: ['nftables VPS', 'firewall Linux', 'iptables замена', 'защита VPS', 'rate limit SSH', 'Storm Cloud'],
		body: `**Краткий ответ:** nftables — наследник iptables в ядре Linux. Один синтаксис, таблицы inet, встроенный set для блокировок. На свежем [Ubuntu 24.04](/blog/ubuntu-24-04-pervaya-nastroyka-vps/) и [Debian 12](/blog/debian-12-pervaya-nastroyka-vps/) — default.

UFW — обёртка над iptables/nftables. Понимание nftables даёт контроль: rate limit SSH, geo-блок (опционально), интеграция с [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) и [CrowdSec](/blog/crowdsec-zashchita-vps/).

---

## UFW vs nftables

| | UFW | nftables |
| --- | --- | --- |
| Простота | Высокая | Средняя |
| Rate limit | Сложно | natively |
| Sets / блок-листы | Ограничено | Да |
| Debian 12 default | nft backend | Да |

Для новичка — UFW из [гайда по защите](/blog/zashchita-vps-ot-vzloma/). Для production — nftables ruleset в git.

---

## Базовый ruleset

\`\`\`nft
#!/usr/sbin/nft -f
flush ruleset

table inet filter {
  set blocked_ips {
    type ipv4_addr
    flags timeout
    timeout 1h
  }

  chain input {
    type filter hook input priority filter; policy drop;

    iif "lo" accept
    ct state established,related accept
    ip protocol icmp accept
    ip6 nexthdr icmpv6 accept

    tcp dport 22 ct state new limit rate over 6/minute add @blocked_ips { ip saddr } drop
    tcp dport { 22, 80, 443 } accept
  }

  chain forward {
    type filter hook forward priority filter; policy drop;
  }

  chain output {
    type filter hook output priority filter; policy accept;
  }
}
\`\`\`

\`\`\`bash
sudo nft -f /etc/nftables.conf
sudo systemctl enable nftables
\`\`\`

**Важно:** перед \`policy drop\` держите вторую SSH-сессию открытой.

---

## Разрешить Docker

Docker манипулирует iptables/nftables. При [Docker Compose](/blog/docker-compose-vps/) добавьте:

\`\`\`nft
chain input {
  # ... existing rules ...
  iifname "docker0" accept
}
\`\`\`

Или используйте \`docker run --network host\` только где нужно. [Traefik](/blog/traefik-reverse-proxy-vps/) слушает 80/443 на хосте.

---

## Fail2ban + nftables

\`\`\`ini
# /etc/fail2ban/jail.local
[sshd]
banaction = nftables-multiport
\`\`\`

CrowdSec bouncer тоже поддерживает nftables — см. [CrowdSec](/blog/crowdsec-zashchita-vps/).

---

## Логирование dropped

\`\`\`nft
chain input {
  counter drop
}
\`\`\`

\`\`\`bash
journalctl -k | grep nft
\`\`\`

Централизация — [journalctl](/blog/journalctl-logi-linux-vps/) и [Loki](/blog/loki-grafana-logi-vps/).

---

## IPv6

\`\`\`nft
table inet filter {
  chain input {
    tcp dport { 22, 80, 443 } accept
  }
}
\`\`\`

\`inet\` покрывает IPv4 и IPv6 одной таблицей — проще чем отдельные ip/ip6 tables в iptables.

---

## Чеклист безопасности VPS

1. nftables: drop by default, только 22/80/443
2. SSH: ключи, PermitRootLogin no
3. [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/)
4. [Автообновления](/blog/ubuntu-24-04-pervaya-nastroyka-vps/) security
5. [VPN admin](/blog/tailscale-vpn-vps/) вместо открытого SSH (опционально)

---

## Итог

nftables — стандарт firewall на Linux VPS в 2026. Один конфиг в git, rate limit SSH, интеграция с Fail2ban — база перед деплоем приложений.

VPS — [StormNet Cloud](https://stormnetcloud.com/). Полный чеклист — [защита VPS](/blog/zashchita-vps-ot-vzloma/). Мониторинг атак — [CrowdSec](/blog/crowdsec-zashchita-vps/).`,
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
pubDate: 2026-07-13
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
