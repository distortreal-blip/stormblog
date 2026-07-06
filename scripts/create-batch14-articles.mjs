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
		slug: 'restic-backup-vps',
		coverFile: 'cover-restic-vps.png',
		title: 'Restic на VPS: зашифрованные бэкапы на S3 и диск',
		description:
			'Настройка Restic на VPS: инкрементальные бэкапы, шифрование, S3/MinIO, cron и восстановление. Практика правила 3-2-1.',
		category: 'DevOps',
		keywords: ['Restic VPS', 'бэкап сервера', 'encrypted backup', 'S3 backup', 'инкрементальный бэкап', 'Storm Cloud'],
		body: `**Краткий ответ:** Restic — инкрементальные зашифрованные бэкапы в один репозиторий (локально, S3, [MinIO](/blog/minio-s3-na-vps/)). Установите бинарник, инициализируйте repo, настройте cron — данные защищены по [правилу 3-2-1](/blog/backup-vps-3-2-1/).

tar.gz бэкапы не масштабируются: каждый полный архив — гигабайты и часы. Restic хранит только изменения и шифрует end-to-end.

---

## Restic vs rsync vs mysqldump

| | Restic | rsync | mysqldump |
| --- | --- | --- | --- |
| Инкрементальный | Да | Да (файлы) | Нет |
| Шифрование | Да | Нет | Нет |
| Дедупликация | Да | Нет | Нет |
| S3/облако | Да | Через rclone | Вручную |

---

## Установка

\`\`\`bash
curl -L https://github.com/restic/restic/releases/latest/download/restic_linux_amd64.bz2 | bunzip2
sudo mv restic_linux_amd64 /usr/local/bin/restic
sudo chmod +x /usr/local/bin/restic
\`\`\`

---

## Инициализация репозитория

Локально:

\`\`\`bash
export RESTIC_PASSWORD="STRONG_REPO_PASSWORD"
restic init --repo /backup/restic-repo
\`\`\`

На [MinIO S3](/blog/minio-s3-na-vps/):

\`\`\`bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export RESTIC_REPOSITORY=s3:https://s3.example.com/backups/restic
restic init
\`\`\`

---

## Первый бэкап

\`\`\`bash
restic backup /var/www /etc/nginx /home/deploy
restic snapshots
\`\`\`

Исключения:

\`\`\`bash
restic backup /var/www --exclude='*.log' --exclude='node_modules'
\`\`\`

---

## Автоматизация cron

\`\`\`bash
# /etc/cron.d/restic-backup
0 3 * * * deploy RESTIC_PASSWORD=xxx /usr/local/bin/restic -r /backup/restic-repo backup /var/www /etc 2>&1 | logger -t restic
\`\`\`

Проверка:

\`\`\`bash
restic check
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
\`\`\`

---

## Восстановление

\`\`\`bash
restic snapshots
restic restore latest --target /restore-test
restic restore abc123def --target /restore --include /var/www/app
\`\`\`

Перед restore на production — тест на staging VPS ([почасовая аренда](/blog/pochasovaya-arenda-vps/)).

---

## Бэкап PostgreSQL/MySQL

\`\`\`bash
pg_dump mydb | restic backup --stdin --stdin-filename mydb.sql
\`\`\`

Или dump в файл → restic backup. См. [PostgreSQL tuning](/blog/postgresql-tuning-vps/) и [MariaDB](/blog/mariadb-optimizaciya-vps/).

---

## Мониторинг

- Алерт если cron не отработал — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)
- restic stats --mode raw-data
- Логи в [journalctl](/blog/journalctl-logi-linux-vps/)

---

## Итог

Restic — лучший выбор для encrypted off-site бэкапов на VPS. Один инструмент для файлов, конфигов и дампов БД.

VPS + [MinIO](/blog/minio-s3-na-vps/) — [StormNet Cloud](https://stormnetcloud.com/).`,
	},
	{
		slug: 'haproxy-load-balancer-vps',
		coverFile: 'cover-haproxy-vps.png',
		title: 'HAProxy на VPS: балансировка нагрузки между серверами',
		description:
			'Настройка HAProxy на VPS: round-robin, health checks, SSL termination, sticky sessions. Когда нужен load balancer перед приложением.',
		category: 'DevOps',
		keywords: ['HAProxy VPS', 'балансировка нагрузки', 'load balancer', 'high availability', 'reverse proxy', 'Storm Cloud'],
		body: `**Краткий ответ:** HAProxy — load balancer перед несколькими backend-серверами. Один VPS с HAProxy распределяет трафик, проверяет health и терминирует SSL. Нужен при 2+ app-серверах.

Один [Nginx](/blog/nginx-ili-caddy/) справляется с reverse proxy. HAProxy — когда нужны продвинутые алгоритмы балансировки и health checks на уровне TCP/HTTP.

---

## Когда нужен HAProxy

- 2+ VPS с одинаковым приложением
- Zero-downtime при падении одного backend
- Sticky sessions для stateful apps
- TCP балансировка (PostgreSQL read replicas)

Не нужен для одного VPS — достаточно Nginx или [Traefik](/blog/traefik-reverse-proxy-vps/).

---

## Установка

\`\`\`bash
sudo apt install haproxy -y
\`\`\`

\`\`\`cfg
# /etc/haproxy/haproxy.cfg
global
    maxconn 4096

defaults
    mode http
    timeout connect 5s
    timeout client 30s
    timeout server 30s
    option httplog

frontend web
    bind *:80
    bind *:443 ssl crt /etc/haproxy/certs/example.com.pem
    redirect scheme https if !{ ssl_fc }
    default_backend app_servers

backend app_servers
    balance roundrobin
    option httpchk GET /health
    server app1 10.0.0.2:8080 check
    server app2 10.0.0.3:8080 check
\`\`\`

\`\`\`bash
sudo systemctl restart haproxy
\`\`\`

Связь между VPS — приватная сеть или [Tailscale](/blog/tailscale-vpn-vps/) / [WireGuard](/blog/wireguard-vpn-na-vps/).

---

## Health checks

\`\`\`cfg
option httpchk GET /health HTTP/1.1\\r\\nHost:\\ example.com
http-check expect status 200
\`\`\`

Приложение должно отдавать /health — как в [Go](/blog/go-golang-deploy-vps/) или [FastAPI](/blog/fastapi-deploy-vps/) деплое.

---

## SSL termination

Объедините cert + key:

\`\`\`bash
cat fullchain.pem privkey.pem > /etc/haproxy/certs/example.com.pem
\`\`\`

Альтернатива — SSL на [Cloudflare](/blog/cloudflare-i-vps/) + HAProxy на HTTP внутри.

---

## Sticky sessions

\`\`\`cfg
backend app_servers
    balance roundrobin
    cookie SERVERID insert indirect nocache
    server app1 10.0.0.2:8080 cookie s1 check
    server app2 10.0.0.3:8080 cookie s2 check
\`\`\`

---

## Мониторинг

\`\`\`cfg
listen stats
    bind 127.0.0.1:8404
    stats enable
    stats uri /stats
\`\`\`

Метрики в [Prometheus](/blog/grafana-prometheus-vps/) через haproxy_exporter.

---

## HAProxy vs Nginx vs Traefik

| | HAProxy | Nginx | Traefik |
| --- | --- | --- | --- |
| Load balancing | Лучший | Хороший | Средний |
| Static files | Нет | Отлично | Нет |
| Docker discovery | Нет | Нет | Да |

---

## Итог

HAProxy — стандарт для балансировки между несколькими VPS. Один LB VPS + 2+ app VPS = отказоустойчивость без Kubernetes.

Несколько VPS — [StormNet Cloud](https://stormnetcloud.com/). Оркестрация — [k3s](/blog/k3s-klaster-na-vps/) или [Docker Swarm](/blog/docker-swarm-na-vps/).`,
	},
	{
		slug: 'cloud-init-avtomatizaciya-vps',
		coverFile: 'cover-cloud-init-vps.png',
		title: 'cloud-init на VPS: автоматизация первого запуска сервера',
		description:
			'cloud-init на VPS: user-data, SSH-ключи, пакеты, скрипты при создании. Воспроизводимая настройка без ручных шагов.',
		category: 'Linux',
		keywords: ['cloud-init VPS', 'автоматизация сервера', 'user-data', 'cloud-init Ubuntu', 'IaC', 'Storm Cloud'],
		body: `**Краткий ответ:** cloud-init выполняет скрипты и конфиги при первом boot VPS. Передайте user-data при создании сервера — получите готовый сервер с пользователем, SSH-ключами и пакетами без ручной [первой настройки](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).

Создаёте 5 одинаковых VPS? cloud-init экономит часы повторяющихся команд.

---

## Что делает cloud-init

1. Создаёт пользователей и SSH-ключи
2. Устанавливает пакеты
3. Запускает runcmd (shell-скрипты)
4. Настраивает hostname, timezone
5. Пишет лог в /var/log/cloud-init.log

---

## Пример user-data (YAML)

\`\`\`yaml
#cloud-config
users:
  - name: deploy
    groups: sudo
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - ssh-ed25519 AAAA... your-key

package_update: true
packages:
  - nginx
  - ufw
  - fail2ban

runcmd:
  - ufw allow OpenSSH
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw --force enable
  - systemctl enable nginx
\`\`\`

Провайдер передаёт user-data при создании VPS (metadata service или панель).

---

## Проверка

\`\`\`bash
cloud-init status
sudo cat /var/log/cloud-init-output.log
\`\`\`

Ошибки — в [journalctl](/blog/journalctl-logi-linux-vps/).

---

## cloud-init + Ansible

cloud-init — bootstrap при создании. [Ansible](/blog/ansible-avtomatizaciya-servera/) — полная конфигурация после boot. Связка:

1. cloud-init: user, SSH, базовые пакеты
2. Ansible: приложение, Nginx, SSL

[Terraform](/blog/terraform-vps-infrastruktura/) создаёт VPS + передаёт user-data.

---

## Секреты в user-data

**Не кладите пароли** в открытый user-data. Используйте:
- SSH-ключи только
- Секреты через vault после boot — [Restic](/blog/restic-backup-vps/) / env из CI
- [WireGuard](/blog/wireguard-vpn-na-vps/) keys — генерируйте на сервере

---

## Типичные runcmd

\`\`\`yaml
runcmd:
  - curl -fsSL https://get.docker.com | sh
  - usermod -aG docker deploy
  - timedatectl set-timezone Europe/Moscow
\`\`\`

Для [Docker Compose](/blog/docker-compose-vps/) стеков — отдельный скрипт в runcmd.

---

## Итог

cloud-init превращает «голый VPS» в «готовый к деплою» за минуты. Обязателен при масштабировании и IaC.

VPS с cloud-init — [StormNet Cloud](https://stormnetcloud.com/). Ручной чек-лист — [Ubuntu 24.04](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).`,
	},
	{
		slug: 'hugo-static-site-vps',
		coverFile: 'cover-hugo-vps.png',
		title: 'Hugo на VPS: деплой статического сайта за 20 минут',
		description:
			'Как задеплоить Hugo на VPS: build, Nginx, SSL, CI/CD. Быстрый статический блог без базы данных и PHP.',
		category: 'Разработка',
		keywords: ['Hugo VPS', 'статический сайт', 'деплой Hugo', 'Nginx static', 'SSG блог', 'Storm Cloud'],
		body: `**Краткий ответ:** Hugo генерирует статический HTML. На VPS нужен только Nginx + SSL — никакой БД и runtime. \`hugo build\` → rsync в /var/www → готово.

Статика — самый дешёвый и быстрый деплой на VPS. 512 MB RAM хватит с запасом. Идеален для блогов, документации, лендингов.

---

## Hugo vs WordPress vs Next.js

| | Hugo | WordPress | Next.js SSR |
| --- | --- | --- | --- |
| RAM на VPS | 128 MB | 1–2 GB | 1–2 GB |
| БД | Нет | MySQL | Опционально |
| Скорость | Максимум | Средняя | Высокая |
| Сложность | Низкая | Средняя | Высокая |

---

## Установка Hugo (dev/CI)

\`\`\`bash
# На машине сборки или CI
sudo snap install hugo --channel=extended
hugo version
\`\`\`

На VPS Hugo **не нужен** — только готовые HTML-файлы.

---

## Сборка

\`\`\`bash
hugo new site myblog
cd myblog
git submodule add https://github.com/theNewDynamic/gohugo-theme-ananke themes/ananke
echo "theme = 'ananke'" >> hugo.toml
hugo new content posts/hello.md
hugo --minify
# Результат в public/
\`\`\`

---

## Деплой на VPS

\`\`\`bash
rsync -avz --delete public/ deploy@VPS:/var/www/mysite/
\`\`\`

Nginx:

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name blog.example.com;
    root /var/www/mysite;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
\`\`\`

[SSL](/blog/ssl-letsencrypt-vps/) + [Cloudflare CDN](/blog/cloudflare-i-vps/) для глобальной скорости.

---

## CI/CD

\`\`\`yaml
# GitHub Actions
- run: hugo --minify
- run: rsync -avz public/ deploy@\${{ secrets.VPS_HOST }}:/var/www/mysite/
\`\`\`

См. [GitHub Actions](/blog/github-actions-cicd/) и [GitLab Runner](/blog/gitlab-runner-cicd-vps/).

---

## VPS требования

| Трафик | RAM | Диск |
| --- | --- | --- |
| Блог | 512 MB | 10 GB |
| Документация | 512 MB–1 GB | 20 GB |

Мониторинг — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).

---

## Сравнение с Astro/этим блогом

Stormblog на Astro — тот же принцип: SSG + deploy. Hugo проще для pure content-сайтов без React.

---

## Итог

Hugo + Nginx — минимальный стек на VPS. Дешёво, быстро, безопасно (нет PHP/БД для атаки).

VPS от 512 MB — [StormNet Cloud](https://stormnetcloud.com/). Полный гайд — [развернуть сайт](/blog/razvernut-sayt-na-vps-2026/).`,
	},
	{
		slug: 'rust-deploy-na-vps',
		coverFile: 'cover-rust-vps.png',
		title: 'Rust на VPS: деплой production-бинарника',
		description:
			'Деплой Rust на VPS: cargo build --release, systemd, Nginx, кросс-компиляция. Максимальная производительность на минимальном RAM.',
		category: 'Разработка',
		keywords: ['Rust VPS', 'деплой Rust', 'cargo release', 'Rust production', 'systemd Rust', 'Storm Cloud'],
		body: `**Краткий ответ:** \`cargo build --release\` → один бинарник на VPS → systemd. Nginx для SSL. Rust потребляет 5–20 MB RAM — идеален для [1 GB VPS](/blog/choose-vps/).

Rust на VPS — как [Go](/blog/go-golang-deploy-vps/): статическая компиляция, без runtime. Но zero-cost abstractions и memory safety без GC.

---

## Сборка release

\`\`\`bash
cargo build --release
# target/release/myapp — готов к деплою
\`\`\`

Кросс-компиляция для VPS (musl = полностью static):

\`\`\`bash
rustup target add x86_64-unknown-linux-musl
cargo build --release --target x86_64-unknown-linux-musl
\`\`\`

---

## Деплой

\`\`\`bash
scp target/release/myapp deploy@VPS:/opt/myapp/myapp
\`\`\`

\`\`\`ini
[Unit]
Description=Rust API
After=network.target

[Service]
User=deploy
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/myapp
Restart=on-failure
Environment=RUST_LOG=info

[Install]
WantedBy=multi-user.target
\`\`\`

[systemd](/blog/systemd-linux-servisy/) + [Nginx](/blog/nginx-ili-caddy/) reverse proxy.

---

## Docker альтернатива

\`\`\`dockerfile
FROM rust:1.78 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/myapp /usr/local/bin/
CMD ["myapp"]
\`\`\`

[multi-stage build](/blog/docker-multi-stage-builds/) — образ ~20 MB.

---

## Мониторинг

- RUST_LOG=debug для отладки
- tracing crate → JSON logs → [Loki](/blog/loki-grafana-logi-vps/)
- /metrics endpoint → [Prometheus](/blog/grafana-prometheus-vps/)

---

## Rust vs Go на VPS

| | Rust | Go |
| --- | --- | --- |
| RAM | 5–20 MB | 20–50 MB |
| Compile time | Дольше | Быстрее |
| Performance | Максимум | Высокая |
| Learning curve | Круче | Мягче |

---

## Итог

Rust — для latency-critical API на маленьком VPS. Один бинарник, systemd, минимум RAM.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). Логи — [journalctl](/blog/journalctl-logi-linux-vps/).`,
	},
	{
		slug: 'clickhouse-analytics-vps',
		coverFile: 'cover-clickhouse-vps.png',
		title: 'ClickHouse на VPS: аналитика и OLAP на своём сервере',
		description:
			'Установка ClickHouse на VPS: колоночная БД для логов и аналитики, запросы, интеграция с Grafana. Когда нужен OLAP.',
		category: 'DevOps',
		keywords: ['ClickHouse VPS', 'OLAP', 'аналитика', 'колоночная БД', 'логи аналитика', 'Storm Cloud'],
		body: `**Краткий ответ:** ClickHouse — колоночная СУБД для аналитики миллиардов строк. На VPS подходит для логов, метрик, event tracking. Минимум 4 GB RAM для production.

PostgreSQL и [MariaDB](/blog/mariadb-optimizaciya-vps/) — для OLTP (транзакции). ClickHouse — для OLAP (агрегации, отчёты, дашборды).

---

## ClickHouse vs PostgreSQL vs Elasticsearch

| | ClickHouse | PostgreSQL | Elasticsearch |
| --- | --- | --- | --- |
| Тип | OLAP | OLTP | Search/Logs |
| Сжатие | Отличное | Среднее | Среднее |
| RAM | 4 GB+ | 2 GB+ | 4 GB+ |
| SQL | Да | Да | Нет (DSL) |

Для логов проще — [Loki](/blog/loki-grafana-logi-vps/). ClickHouse — когда нужен SQL на больших данных.

---

## Установка (Docker)

\`\`\`yaml
services:
  clickhouse:
    image: clickhouse/clickhouse-server
    ports:
      - "127.0.0.1:8123:8123"
    volumes:
      - ch_data:/var/lib/clickhouse
    ulimits:
      nofile: 262144

volumes:
  ch_data:
\`\`\`

На VPS **4+ GB RAM**, SSD обязателен.

---

## Создание таблицы

\`\`\`sql
CREATE TABLE events (
    ts DateTime,
    user_id UInt64,
    event String,
    properties String
) ENGINE = MergeTree()
ORDER BY (ts, user_id);
\`\`\`

\`\`\`sql
INSERT INTO events VALUES (now(), 1, 'page_view', '{}');
SELECT event, count() FROM events GROUP BY event;
\`\`\`

---

## Импорт логов Nginx

\`\`\`bash
# Парсинг access.log → INSERT
clickhouse-client --query "INSERT INTO nginx_logs FORMAT JSONEachRow" < parsed.json
\`\`\`

Связка с [Nginx логами](/blog/nginx-logi-i-oshibki/) и [Grafana](/blog/grafana-prometheus-vps/).

---

## Безопасность

- bind только 127.0.0.1
- Пароль default user
- Не открывайте 8123 в интернет
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на Nginx перед CH

---

## RAM и диск

| Данные | RAM | Диск |
| --- | --- | --- |
| 10M events | 4 GB | 50 GB |
| 100M+ | 8 GB+ | 200 GB+ |

Бэкапы — [Restic](/blog/restic-backup-vps/) на volume.

---

## Итог

ClickHouse на VPS — для аналитики без облачного BigQuery. Закладывайте RAM и SSD, не ставьте на 2 GB VPS.

VPS 4–8 GB — [StormNet Cloud](https://stormnetcloud.com/). Лёгкие логи — [Loki](/blog/loki-grafana-logi-vps/).`,
	},
	{
		slug: 'tailscale-vpn-vps',
		coverFile: 'cover-tailscale-vps.png',
		title: 'Tailscale на VPS: mesh VPN без настройки WireGuard',
		description:
			'Tailscale на VPS: доступ к серверам, subnet router, MagicDNS. Простая альтернатива ручному WireGuard для команды.',
		category: 'Безопасность',
		keywords: ['Tailscale VPS', 'mesh VPN', 'WireGuard альтернатива', 'доступ к серверу', 'Tailscale subnet', 'Storm Cloud'],
		body: `**Краткий ответ:** Tailscale — mesh VPN на базе WireGuard с автоматической настройкой. Установите на VPS одной командой — сервер в вашей приватной сети без ручных ключей [WireGuard](/blog/wireguard-vpn-na-vps/).

WireGuard мощный, но ручная настройка ключей на 10 устройствах утомляет. Tailscale — WireGuard + coordination server.

---

## Tailscale vs WireGuard vs OpenVPN

| | Tailscale | WireGuard (ручной) | OpenVPN |
| --- | --- | --- | --- |
| Настройка | 2 мин | 15–30 мин | 1+ час |
| Mesh | Да | Вручную | Нет |
| NAT traversal | Да | Сложно | Средне |
| Self-hosted coord | Headscale | — | — |

---

## Установка на VPS

\`\`\`bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --authkey=tskey-auth-xxxxx
tailscale ip -4
\`\`\`

Auth key — в панели Tailscale (one-time или reusable).

---

## Subnet router

Доступ ко всей внутренней сети VPS:

\`\`\`bash
sudo tailscale up --advertise-routes=10.0.0.0/24 --authkey=...
\`\`\`

В панели Tailscale — approve routes. Теперь [Portainer](/blog/portainer-docker-vps/), [Grafana](/blog/grafana-prometheus-vps/) доступны без публичных портов.

---

## MagicDNS

\`\`\`bash
# Доступ по имени
curl http://prod-vps:8080/health
\`\`\`

Вместо запоминания IP — имена в Tailscale network.

---

## ACL (безопасность)

В панели Tailscale — ACL кто к кому ходит:

\`\`\`json
{
  "acls": [
    { "action": "accept", "src": ["group:dev"], "dst": ["tag:prod:22,443"] }
  ]
}
\`\`\`

Дополняет [CrowdSec](/blog/crowdsec-zashchita-vps/) — Tailscale закрывает публичный доступ.

---

## Headscale (self-hosted)

Не хотите зависеть от Tailscale Inc.? Headscale — open-source coordination server на вашем VPS.

---

## Когда Tailscale, когда WireGuard

- **Tailscale** — команда, много устройств, быстрый старт
- **WireGuard** — полный контроль, один VPS-VPN, без сторонних серверов

---

## Итог

Tailscale — лучший UX для VPN на VPS. Subnet router + закрытые порты = безопасный доступ к [Coolify](/blog/coolify-na-vps/), [k3s](/blog/k3s-klaster-na-vps/) API.

VPS для VPN — [StormNet Cloud](https://stormnetcloud.com/). Ручной VPN — [WireGuard](/blog/wireguard-vpn-na-vps/).`,
	},
	{
		slug: 'loki-grafana-logi-vps',
		coverFile: 'cover-loki-vps.png',
		title: 'Loki на VPS: централизованные логи с Grafana',
		description:
			'Установка Grafana Loki на VPS: сбор логов приложений, Promtail, запросы LogQL, алерты. Лёгкая альтернатива ELK.',
		category: 'DevOps',
		keywords: ['Loki VPS', 'Grafana Loki', 'централизация логов', 'Promtail', 'LogQL', 'Storm Cloud'],
		body: `**Краткий ответ:** Loki — хранилище логов от создателей Grafana. Promtail собирает логи с VPS → Loki → запросы в Grafana. Легче ELK, идеальная связка с [Prometheus](/blog/grafana-prometheus-vps/).

Логи разбросаны по [journalctl](/blog/journalctl-logi-linux-vps/), Nginx files, Docker — Loki собирает в одно место.

---

## Loki vs ELK vs файлы

| | Loki | ELK | grep /var/log |
| --- | --- | --- | --- |
| RAM | 1–2 GB | 8 GB+ | 0 |
| Поиск | LogQL | Elasticsearch | rg/grep |
| Grafana | Нативно | Плагин | Нет |

---

## Docker Compose стек

\`\`\`yaml
services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "127.0.0.1:3100:3100"
    volumes:
      - loki_data:/loki

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./promtail.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml

  grafana:
    image: grafana/grafana
    ports:
      - "127.0.0.1:3000:3000"

volumes:
  loki_data:
\`\`\`

---

## promtail.yml

\`\`\`yaml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: nginx
    static_configs:
      - targets: [localhost]
        labels:
          job: nginx
          __path__: /var/log/nginx/*.log
\`\`\`

---

## LogQL запросы

\`\`\`logql
{job="nginx"} |= "error"
{job="nginx"} | json | status >= 500
rate({job="nginx"}[5m])
\`\`\`

Алерты при росте 5xx — в Grafana Alerting → Telegram.

---

## RAM

| Нагрузка | RAM |
| --- | --- |
| 1 VPS, 7 дней retention | 1–2 GB |
| Несколько VPS | 2–4 GB |

Для аналитики больших логов — [ClickHouse](/blog/clickhouse-analytics-vps/).

---

## Безопасность

- Loki/Grafana на localhost + Nginx + [SSL](/blog/ssl-letsencrypt-vps/)
- Или доступ через [Tailscale](/blog/tailscale-vpn-vps/)
- Не храните пароли в логах

---

## Итог

Loki + Grafana — стандартный стек логов на VPS в 2026. Дополняет метрики Prometheus и [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).

VPS 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Nginx логи — [разбор ошибок](/blog/nginx-logi-i-oshibki/).`,
	},
	{
		slug: 'flask-deploy-na-vps',
		coverFile: 'cover-flask-vps.png',
		title: 'Flask на VPS: деплой Python microframework',
		description:
			'Деплой Flask на VPS: Gunicorn, Nginx, venv, systemd, SSL. Лёгкий Python backend для API и небольших приложений.',
		category: 'Разработка',
		keywords: ['Flask VPS', 'деплой Flask', 'Gunicorn Flask', 'Python VPS', 'Flask production', 'Storm Cloud'],
		body: `**Краткий ответ:** Flask + Gunicorn + Nginx + systemd — классический Python-стек на VPS. Виртуальное окружение, \`gunicorn app:app\`, reverse proxy с [SSL](/blog/ssl-letsencrypt-vps/).

Flask проще [Django](/blog/django-deploy-na-vps/) для API и микросервисов. [FastAPI](/blog/fastapi-deploy-vps/) — если нужен async и OpenAPI из коробки.

---

## Подготовка VPS

\`\`\`bash
sudo apt install python3-venv nginx -y
\`\`\`

[Ubuntu настройка](/blog/ubuntu-24-04-pervaya-nastroyka-vps/) — первым делом.

---

## venv и зависимости

\`\`\`bash
cd /var/www/flask-app
python3 -m venv venv
source venv/bin/activate
pip install flask gunicorn
\`\`\`

\`\`\`python
# app.py
from flask import Flask
app = Flask(__name__)

@app.route('/health')
def health():
    return {'status': 'ok'}
\`\`\`

---

## Gunicorn

\`\`\`bash
gunicorn --workers 3 --bind 127.0.0.1:8000 app:app
\`\`\`

\`\`\`ini
[Service]
ExecStart=/var/www/flask-app/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 app:app
WorkingDirectory=/var/www/flask-app
User=deploy
\`\`\`

[systemd](/blog/systemd-linux-servisy/) для автозапуска.

---

## Nginx

\`\`\`nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
\`\`\`

---

## БД и кэш

- PostgreSQL — [tuning](/blog/postgresql-tuning-vps/)
- Redis — [кэш](/blog/redis-kesh-vps/)
- Celery + [RabbitMQ](/blog/rabbitmq-ocheredi-na-vps/) для фоновых задач

---

## Workers и RAM

| VPS RAM | workers |
| --- | --- |
| 1 GB | 2 |
| 2 GB | 3 |
| 4 GB | 4–5 |

Каждый worker — отдельный Python-процесс.

---

## Итог

Flask на VPS — быстрый старт для Python API. Gunicorn + Nginx + systemd покрывают 90% pet-проектов.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). Async API — [FastAPI](/blog/fastapi-deploy-vps/).`,
	},
	{
		slug: 'mongodb-na-vps',
		coverFile: 'cover-mongodb-vps.png',
		title: 'MongoDB на VPS: установка и production-настройка',
		description:
			'MongoDB на VPS: установка, аутентификация, репликация, бэкапы, RAM tuning. NoSQL для Node.js и современных приложений.',
		category: 'DevOps',
		keywords: ['MongoDB VPS', 'NoSQL VPS', 'MongoDB production', 'установка MongoDB', 'MongoDB backup', 'Storm Cloud'],
		body: `**Краткий ответ:** MongoDB на VPS ставится через apt или Docker. Включите auth, bind 127.0.0.1, настройте WiredTiger cache ≤ 50% RAM. Бэкапы — mongodump + [Restic](/blog/restic-backup-vps/).

SQL или NoSQL? [MySQL vs PostgreSQL](/blog/mysql-ili-postgresql-vps/) — для реляционных данных. MongoDB — для гибкой схемы, документов, прототипов с [Node.js](/blog/nodejs-pm2-deploy/).

---

## MongoDB vs PostgreSQL на VPS

| | MongoDB | PostgreSQL |
| --- | --- | --- |
| Схема | Гибкая | Строгая |
| JSON | Нативно | JSONB |
| Транзакции | Да (multi-doc) | Да |
| RAM | Жадная | Умеренная |
| Типичный стек | MERN, NestJS | Laravel, Django |

---

## Установка (Ubuntu)

\`\`\`bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
# Добавьте repo по документации MongoDB для вашей Ubuntu
sudo apt install mongodb-org -y
sudo systemctl enable mongod
\`\`\`

---

## Безопасность

\`\`\`yaml
# /etc/mongod.conf
net:
  bindIp: 127.0.0.1
security:
  authorization: enabled
\`\`\`

\`\`\`javascript
use admin
db.createUser({ user: "admin", pwd: "STRONG", roles: ["root"] })
\`\`\`

Никогда не открывайте 27017 в интернет — см. [защита VPS](/blog/zashchita-vps-ot-vzloma/).

---

## RAM tuning (2 GB VPS)

\`\`\`yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.5
\`\`\`

Правило: WiredTiger cache ≈ 50% RAM минус ОС и приложение.

---

## Docker альтернатива

\`\`\`yaml
services:
  mongo:
    image: mongo:7
    ports:
      - "127.0.0.1:27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: STRONG
    volumes:
      - mongo_data:/data/db
\`\`\`

[Docker Compose](/blog/docker-compose-vps/) — проще изоляция.

---

## Бэкапы

\`\`\`bash
mongodump --uri="mongodb://admin:pass@127.0.0.1" --out=/backup/mongo-$(date +%F)
\`\`\`

Off-site — [Restic](/blog/restic-backup-vps/) или [MinIO](/blog/minio-s3-na-vps/). Стратегия — [3-2-1](/blog/backup-vps-3-2-1/).

---

## Репликация (2+ VPS)

Replica Set: primary + secondary на разных VPS. Автоматический failover при падении primary. Связь — [Tailscale](/blog/tailscale-vpn-vps/) или private network.

---

## Мониторинг

- mongostat, mongotop
- [Grafana](/blog/grafana-prometheus-vps/) + mongodb_exporter
- Алерты на connections, replication lag

---

## Итог

MongoDB на VPS — для MERN-стека и document-oriented apps. Auth + localhost bind + бэкапы — обязательный минимум.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Node.js деплой — [PM2](/blog/nodejs-pm2-deploy/).`,
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
pubDate: 2026-07-11
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
