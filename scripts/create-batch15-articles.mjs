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
		slug: 'certbot-dns-ssl-vps',
		coverFile: 'cover-certbot-dns-vps.png',
		title: 'Certbot DNS challenge на VPS: wildcard SSL-сертификат',
		description:
			'Let\'s Encrypt через DNS challenge: wildcard SSL для *.example.com, Cloudflare API, автообновление certbot. Когда HTTP challenge не подходит.',
		category: 'DevOps',
		keywords: ['Certbot DNS', 'wildcard SSL', 'Let\'s Encrypt VPS', 'DNS challenge', 'Cloudflare certbot', 'Storm Cloud'],
		body: `**Краткий ответ:** DNS challenge выпускает wildcard-сертификат (\`*.example.com\`) без открытого HTTP на каждый поддомен. Certbot + API DNS-провайдера (Cloudflare) — TXT-запись, сертификат, cron для renew.

HTTP challenge из [базового SSL-гайда](/blog/ssl-letsencrypt-vps/) не покрывает wildcard и не работает, если backend скрыт за [Cloudflare](/blog/cloudflare-i-vps/) proxy без origin-доступа.

---

## HTTP vs DNS challenge

| | HTTP-01 | DNS-01 |
| --- | --- | --- |
| Wildcard | Нет | Да |
| Нужен порт 80 | Да | Нет |
| Автоматизация | Простая | API DNS |
| Cloudflare proxy | Сложнее | Идеально |

---

## Cloudflare + certbot

\`\`\`bash
sudo apt install certbot python3-certbot-dns-cloudflare -y
\`\`\`

\`\`\`ini
# /root/.secrets/cloudflare.ini
dns_cloudflare_api_token = YOUR_TOKEN
\`\`\`

\`\`\`bash
chmod 600 /root/.secrets/cloudflare.ini
sudo certbot certonly \\
  --dns-cloudflare \\
  --dns-cloudflare-credentials /root/.secrets/cloudflare.ini \\
  -d example.com -d '*.example.com'
\`\`\`

---

## Автообновление

\`\`\`bash
sudo certbot renew --dry-run
\`\`\`

Certbot добавляет systemd timer. После renew — reload [Nginx](/blog/nginx-ili-caddy/) или [Traefik](/blog/traefik-reverse-proxy-vps/):

\`\`\`bash
# /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
#!/bin/bash
systemctl reload nginx
\`\`\`

---

## Несколько сервисов на поддоменах

Wildcard покрывает \`api.example.com\`, \`app.example.com\`, \`s3.example.com\` — один cert для [MinIO](/blog/minio-s3-na-vps/), API и админки.

---

## Безопасность API token

- Только DNS Edit для нужной zone
- Не коммитьте credentials
- Храните на VPS chmod 600

---

## Итог

DNS challenge — must-have для wildcard и Cloudflare-full setup. Один раз настроили API — certbot обновляет автоматически.

VPS + домен — [StormNet Cloud](https://stormnetcloud.com/). Базовый SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/).`,
	},
	{
		slug: 'supervisor-python-vps',
		coverFile: 'cover-supervisor-vps.png',
		title: 'Supervisor на VPS: управление Python-процессами',
		description:
			'Supervisor на VPS: автозапуск Celery, Gunicorn, workers. Альтернатива systemd для нескольких процессов одного приложения.',
		category: 'DevOps',
		keywords: ['Supervisor VPS', 'Python workers', 'Celery supervisor', 'process manager', 'Gunicorn', 'Storm Cloud'],
		body: `**Краткий ответ:** Supervisor следит за группой процессов: перезапуск при падении, единый лог, \`supervisorctl restart all\`. Удобен когда одному приложению нужны web + worker + beat.

[systemd](/blog/systemd-linux-servisy/) — один unit = один процесс. Supervisor — один конфиг на стек [Django](/blog/django-deploy-na-vps/) + Celery + [RabbitMQ consumer](/blog/rabbitmq-ocheredi-na-vps/).

---

## Установка

\`\`\`bash
sudo apt install supervisor -y
sudo systemctl enable supervisor
\`\`\`

---

## Конфиг Gunicorn + Celery

\`\`\`ini
; /etc/supervisor/conf.d/myapp.conf
[program:gunicorn]
command=/var/www/app/venv/bin/gunicorn --bind 127.0.0.1:8000 config.wsgi:application
directory=/var/www/app
user=deploy
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/gunicorn.err.log
stdout_logfile=/var/log/supervisor/gunicorn.out.log

[program:celery]
command=/var/www/app/venv/bin/celery -A config worker -l info
directory=/var/www/app
user=deploy
autostart=true
autorestart=true
numprocs=1
\`\`\`

\`\`\`bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status
\`\`\`

---

## supervisorctl команды

\`\`\`bash
sudo supervisorctl restart gunicorn
sudo supervisorctl tail -f celery stderr
sudo supervisorctl stop all
\`\`\`

---

## Supervisor vs systemd vs PM2

| | Supervisor | systemd | PM2 |
| --- | --- | --- | --- |
| Python | Отлично | Хорошо | Node-focused |
| Несколько процессов | Да | Несколько units | Да |
| Стандарт Linux | Дополнение | Нативный | npm |

Node.js — [PM2](/blog/nodejs-pm2-deploy/). Go/Rust — [systemd](/blog/systemd-linux-servisy/).

---

## Итог

Supervisor упрощает Python-стек с воркерами. Один конфиг — web + queue + scheduler.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Flask — [Flask deploy](/blog/flask-deploy-na-vps/).`,
	},
	{
		slug: 'debian-12-pervaya-nastroyka-vps',
		coverFile: 'cover-debian-vps.png',
		title: 'Debian 12 на VPS: первая настройка сервера',
		description:
			'Чек-лист настройки Debian 12 Bookworm на VPS: SSH, UFW, обновления, sudo-пользователь. Альтернатива Ubuntu для production.',
		category: 'Linux',
		keywords: ['Debian 12 VPS', 'Bookworm сервер', 'настройка Debian', 'Debian vs Ubuntu', 'hardening', 'Storm Cloud'],
		body: `**Краткий ответ:** Debian 12 — стабильнее и легче Ubuntu. Те же шаги: sudo-пользователь, SSH keys, UFW, \`apt update\`. Отличия — пакеты без snap, иногда старее версии софта.

Многие провайдеры дают Ubuntu по умолчанию. Debian — для тех, кто хочет минимализм и предсказуемость. Сравните с [Ubuntu 24.04](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).

---

## Debian vs Ubuntu на VPS

| | Debian 12 | Ubuntu 24.04 |
| --- | --- | --- |
| Стабильность | Максимальная | LTS хорошая |
| Свежесть пакетов | Консервативнее | Новее |
| Документация | Меньше туториалов | Больше |
| Docker/K8s | Отлично | Отлично |

---

## Первые команды

\`\`\`bash
su -
apt update && apt upgrade -y
apt install sudo ufw curl git vim -y
\`\`\`

Создание пользователя — как в [Ubuntu гайде](/blog/ubuntu-24-04-pervaya-nastroyka-vps/):

\`\`\`bash
adduser deploy
usermod -aG sudo deploy
\`\`\`

---

## SSH hardening

\`\`\`ini
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
\`\`\`

\`\`\`bash
systemctl restart ssh
\`\`\`

---

## UFW

\`\`\`bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
\`\`\`

---

## non-free firmware (WiFi/диски)

Debian иногда требует non-free для драйверов — на VPS обычно не нужно. Для bare metal — \`contrib non-free\` в sources.

---

## cloud-init на Debian

[cloud-init](/blog/cloud-init-avtomatizaciya-vps/) работает на Debian cloud images — автоматизируйте bootstrap.

---

## Итог

Debian 12 — отличный выбор для production VPS. Чек-лист идентичен Ubuntu, пакеты чуть старее — проверяйте версии PHP/Node перед деплоем.

VPS с Debian — [StormNet Cloud](https://stormnetcloud.com/). Автоматизация — [Ansible](/blog/ansible-avtomatizaciya-servera/).`,
	},
	{
		slug: 'openlitespeed-wordpress-vps',
		coverFile: 'cover-openlitespeed-vps.png',
		title: 'OpenLiteSpeed + WordPress на VPS: быстрый хостинг',
		description:
			'Установка OpenLiteSpeed и WordPress на VPS: LSCache, HTTP/3, SSL. Альтернатива Nginx+PHP-FPM для скорости WordPress.',
		category: 'Разработка',
		keywords: ['OpenLiteSpeed VPS', 'WordPress VPS', 'LSCache', 'быстрый WordPress', 'LiteSpeed', 'Storm Cloud'],
		body: `**Краткий ответ:** OpenLiteSpeed — веб-сервер с встроенным PHP и LSCache. На VPS WordPress часто быстрее, чем [Nginx + PHP-FPM](/blog/php-fpm-tuning-vps/). Установка через скрипт LiteSpeed — 15 минут.

Классический [WordPress на VPS](/blog/wordpress-vps-2026/) — Nginx/Apache. OpenLiteSpeed — если скорость WordPress критична.

---

## OpenLiteSpeed vs Nginx

| | OpenLiteSpeed | Nginx + PHP-FPM |
| --- | --- | --- |
| WordPress cache | LSCache native | Redis/WP plugin |
| HTTP/3 | Да | Да (новые версии) |
| RAM | 512 MB+ | 512 MB+ |
| Конфиг | Web UI + conf | nginx.conf |

---

## Установка (официальный скрипт)

\`\`\`bash
wget -O - https://repo.openlitespeed.org | bash
apt install openlitespeed -y
\`\`\`

Web admin: \`https://VPS:7080\` — смените пароль admin.

---

## WordPress

\`\`\`bash
cd /usr/local/lsws/Example/html
wget https://wordpress.org/latest.tar.gz
tar xzf latest.tar.gz
\`\`\`

БД — [MariaDB](/blog/mariadb-optimizaciya-vps/). LSCache plugin — включите в WP admin.

---

## SSL

Let's Encrypt через OpenLiteSpeed admin или [certbot](/blog/ssl-letsencrypt-vps/). Wildcard — [DNS challenge](/blog/certbot-dns-ssl-vps/).

---

## Оптимизация

- LSCache + object cache
- [Memcached](/blog/memcached-kesh-vps/) опционально
- [Cloudflare](/blog/cloudflare-i-vps/) CDN для static
- Мониторинг — [Netdata](/blog/netdata-monitoring-vps/)

---

## RAM

| Сайт | RAM |
| --- | --- |
| Блог | 1 GB |
| WooCommerce | 2 GB+ |

---

## Итог

OpenLiteSpeed — специализированный стек для WordPress. Меньше тюнинга PHP-FPM, больше скорости out of the box.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Классический WP — [WordPress VPS 2026](/blog/wordpress-vps-2026/).`,
	},
	{
		slug: 'netdata-monitoring-vps',
		coverFile: 'cover-netdata-vps.png',
		title: 'Netdata на VPS: мониторинг в реальном времени',
		description:
			'Установка Netdata на VPS: CPU, RAM, диск, сеть за 1 минуту. Красивый dashboard без настройки Prometheus.',
		category: 'DevOps',
		keywords: ['Netdata VPS', 'мониторинг сервера', 'real-time metrics', 'Netdata install', 'dashboard VPS', 'Storm Cloud'],
		body: `**Краткий ответ:** Netdata ставится одной командой и сразу показывает метрики каждую секунду. Проще [Prometheus + Grafana](/blog/grafana-prometheus-vps/), но менее гибок для кастомных алертов.

Первый мониторинг на VPS — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) (доступность). Netdata — второй шаг (ресурсы).

---

## Netdata vs Prometheus vs Zabbix

| | Netdata | Prometheus | Zabbix |
| --- | --- | --- | --- |
| Установка | 1 мин | 30+ мин | 1+ час |
| RAM | ~100 MB | 1 GB+ | 1 GB+ |
| Алерты | Базовые | Мощные | Мощные |
| Retention | Короткий | Настраиваемый | БД |

---

## Установка

\`\`\`bash
wget -O /tmp/netdata-kickstart.sh https://my-netdata.io/kickstart.sh
sh /tmp/netdata-kickstart.sh
\`\`\`

Dashboard: \`http://VPS:19999\` — **закройте firewall** или Nginx + auth.

---

## Nginx reverse proxy

\`\`\`nginx
location / {
    proxy_pass http://127.0.0.1:19999;
    proxy_set_header Host $host;
}
\`\`\`

Доступ через [Tailscale](/blog/tailscale-vpn-vps/) или VPN — не публикуйте без auth.

---

## Алерты

Netdata Cloud (free tier) — уведомления в Slack/Telegram. Self-hosted — health entities в конфиге.

Для production SLA — добавьте [Alertmanager](/blog/prometheus-alertmanager-vps/).

---

## Что смотреть

- CPU steal time (noisy neighbor на VPS)
- Disk latency
- RAM pressure / swap
- Network drops

При проблемах — [journalctl](/blog/journalctl-logi-linux-vps/) и [логи Nginx](/blog/nginx-logi-i-oshibki/).

---

## Итог

Netdata — лучший «первый взгляд» на VPS. Ставьте в первый день, дополняйте Prometheus позже.

VPS — [StormNet Cloud](https://stormnetcloud.com/). Полный стек — [Grafana](/blog/grafana-prometheus-vps/).`,
	},
	{
		slug: 'zabbix-monitoring-vps',
		coverFile: 'cover-zabbix-vps.png',
		title: 'Zabbix на VPS: enterprise-мониторинг инфраструктуры',
		description:
			'Развёртывание Zabbix на VPS: агенты, триггеры, оповещения, карты сети. Мониторинг нескольких серверов из одной точки.',
		category: 'DevOps',
		keywords: ['Zabbix VPS', 'мониторинг серверов', 'Zabbix agent', 'инфраструктура', 'алерты Zabbix', 'Storm Cloud'],
		body: `**Краткий ответ:** Zabbix — полноценная система мониторинга: агент на каждом VPS, central server, триггеры, эскалация. Нужен при 5+ серверах. Минимум 2 GB RAM на Zabbix server.

[Netdata](/blog/netdata-monitoring-vps/) — для одного VPS. Zabbix — когда инфраструктура растёт.

---

## Zabbix vs Prometheus

| | Zabbix | Prometheus |
| --- | --- | --- |
| Модель | Push/pull agents | Pull metrics |
| UI | Встроенный | Grafana |
| Learning curve | Высокая | Средняя |
| Legacy enterprise | Да | Cloud-native |

---

## Docker Compose (быстрый старт)

\`\`\`yaml
services:
  zabbix-server:
    image: zabbix/zabbix-server-mysql:ubuntu-6.4-latest
    environment:
      DB_SERVER_HOST: mysql
      MYSQL_USER: zabbix
      MYSQL_PASSWORD: zabbix
      MYSQL_DATABASE: zabbix
    ports:
      - "10051:10051"

  zabbix-web:
    image: zabbix/zabbix-web-nginx-mysql:ubuntu-6.4-latest
    ports:
      - "8080:8080"
    environment:
      ZBX_SERVER_HOST: zabbix-server
      DB_SERVER_HOST: mysql
\`\`\`

Production — отдельный VPS только под Zabbix.

---

## Zabbix agent на monitored VPS

\`\`\`bash
sudo apt install zabbix-agent2
\`\`\`

\`\`\`ini
# /etc/zabbix/zabbix_agent2.conf
Server=ZABBIX_SERVER_IP
Hostname=vps-prod-01
\`\`\`

---

## Типичные триггеры

- CPU > 90% 5 min
- Disk > 85%
- Service down (Nginx, [PostgreSQL](/blog/postgresql-tuning-vps/))
- SSL expiry < 14 days

---

## Итог

Zabbix — для команд с десятками VPS. Overkill для одного pet-проекта — начните с [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) + Netdata.

VPS 4 GB для Zabbix — [StormNet Cloud](https://stormnetcloud.com/). Метрики — [Prometheus](/blog/grafana-prometheus-vps/).`,
	},
	{
		slug: 'vault-secrets-vps',
		coverFile: 'cover-vault-vps.png',
		title: 'HashiCorp Vault на VPS: хранение секретов',
		description:
			'Vault self-hosted на VPS: API keys, DB passwords, rotation. Централизованные секреты для приложений и CI/CD.',
		category: 'Безопасность',
		keywords: ['Vault VPS', 'HashiCorp Vault', 'secrets management', 'секреты приложения', 'Vault Docker', 'Storm Cloud'],
		body: `**Краткий ответ:** Vault хранит секреты централизованно: приложение запрашивает DB password по token, не из .env в git. Self-hosted на VPS — для команд без облачного Secrets Manager.

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

\`\`\`bash
docker run -d --name vault -p 8200:8200 \\
  -e VAULT_DEV_ROOT_TOKEN_ID=dev-token \\
  hashicorp/vault
\`\`\`

Production — Raft storage, TLS, unseal keys.

---

## Запись секрета

\`\`\`bash
export VAULT_ADDR='https://vault.example.com'
vault kv put secret/myapp db_password=xxx api_key=yyy
vault kv get secret/myapp
\`\`\`

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

VPS 2 GB+ — [StormNet Cloud](https://stormnetcloud.com/). Базовая безопасность — [защита VPS](/blog/zashchita-vps-ot-vzloma/).`,
	},
	{
		slug: 'symfony-deploy-na-vps',
		coverFile: 'cover-symfony-vps.png',
		title: 'Symfony на VPS: деплой PHP-приложения',
		description:
			'Деплой Symfony на VPS: Composer, PHP-FPM, Nginx, Messenger, cache. Production checklist для enterprise PHP.',
		category: 'Разработка',
		keywords: ['Symfony VPS', 'деплой Symfony', 'PHP enterprise', 'Symfony production', 'Messenger', 'Storm Cloud'],
		body: `**Краткий ответ:** Symfony на VPS = Composer install --no-dev + PHP-FPM + Nginx + opcache + Messenger worker. Аналог [Laravel](/blog/laravel-na-vps/) с другой структурой.

Symfony — выбор для enterprise PHP в Европе. [PHP-FPM tuning](/blog/php-fpm-tuning-vps/) критичен на 2 GB VPS.

---

## Production deploy

\`\`\`bash
composer install --no-dev --optimize-autoloader
php bin/console cache:clear --env=prod
php bin/console cache:warmup --env=prod
php bin/console doctrine:migrations:migrate --no-interaction
\`\`\`

---

## Nginx

\`\`\`nginx
root /var/www/symfony/public;
location / {
    try_files $uri /index.php$is_args$args;
}
location ~ ^/index\\.php {
    fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
}
\`\`\`

[SSL](/blog/ssl-letsencrypt-vps/) + [Cloudflare](/blog/cloudflare-i-vps/).

---

## Symfony Messenger

\`\`\`bash
php bin/console messenger:consume async -vv
\`\`\`

Автозапуск — [Supervisor](/blog/supervisor-python-vps/) или systemd. Transport — [RabbitMQ](/blog/rabbitmq-ocheredi-na-vps/) или Redis.

---

## БД и кэш

- PostgreSQL — [tuning](/blog/postgresql-tuning-vps/)
- Redis — [sessions/cache](/blog/redis-kesh-vps/)

---

## CI/CD

Deploy script в [GitHub Actions](/blog/github-actions-cicd/): rsync → cache warmup → reload php-fpm.

---

## Итог

Symfony на VPS — тот же стек что Laravel, другие команды console. Messenger + Supervisor для async.

VPS 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Laravel альтернатива — [Laravel на VPS](/blog/laravel-na-vps/).`,
	},
	{
		slug: 'emqx-mqtt-na-vps',
		coverFile: 'cover-emqx-vps.png',
		title: 'EMQX на VPS: MQTT-брокер для IoT',
		description:
			'Установка EMQX MQTT broker на VPS: IoT устройства, pub/sub, TLS, WebSocket. Self-hosted альтернатива облачному IoT Hub.',
		category: 'DevOps',
		keywords: ['EMQX VPS', 'MQTT broker', 'IoT VPS', 'MQTT self-hosted', 'pub sub', 'Storm Cloud'],
		body: `**Краткий ответ:** EMQX — MQTT-брокер для IoT: датчики публикуют в topics, подписчики получают. Docker на VPS за 5 минут. TLS + auth для production.

MQTT — лёгкий протокол для умного дома, телеметрии, [Telegram-ботов](/blog/telegram-bot-vps/) с hardware.

---

## MQTT vs HTTP для IoT

| | MQTT | HTTP |
| --- | --- | --- |
| Overhead | Минимальный | Высокий |
| Push от server | Да | Polling |
| Offline queue | Да | Нет |
| Battery devices | Идеально | Плохо |

---

## Docker установка

\`\`\`yaml
services:
  emqx:
    image: emqx/emqx:5
    ports:
      - "1883:1883"
      - "8883:8883"
      - "127.0.0.1:18083:18083"
    environment:
      EMQX_NAME: emqx
    volumes:
      - emqx_data:/opt/emqx/data
\`\`\`

Dashboard: \`http://127.0.0.1:18083\` (admin/public → смените пароль).

---

## TLS

Порт 8883 — MQTT over TLS. Сертификат — [Let's Encrypt](/blog/ssl-letsencrypt-vps/) или [wildcard DNS](/blog/certbot-dns-ssl-vps/).

---

## Масштабирование

| Устройств | RAM |
| --- | --- |
| < 1000 | 512 MB–1 GB |
| 10k+ | 2 GB+ |

Мониторинг — [Netdata](/blog/netdata-monitoring-vps/) + EMQX metrics.

---

## Связка с приложением

Backend на [Node.js](/blog/nodejs-pm2-deploy/) или [Go](/blog/go-golang-deploy-vps/) подписывается на MQTT → пишет в [MongoDB](/blog/mongodb-na-vps/) или [PostgreSQL](/blog/postgresql-tuning-vps/).

---

## Безопасность

- Смените default credentials
- ACL per device
- Не открывайте 1883 без TLS в интернет
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/)

---

## Итог

EMQX на VPS — свой IoT hub без облачной подписки. Docker + TLS + ACL = production-ready.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). Очереди — [RabbitMQ](/blog/rabbitmq-ocheredi-na-vps/).`,
	},
	{
		slug: 'prometheus-alertmanager-vps',
		coverFile: 'cover-alertmanager-vps.png',
		title: 'Prometheus Alertmanager на VPS: алерты в Telegram',
		description:
			'Настройка Alertmanager: правила Prometheus, группировка, silence, Telegram/Slack. Завершение monitoring-стека.',
		category: 'DevOps',
		keywords: ['Alertmanager VPS', 'Prometheus alerts', 'Telegram алерты', 'мониторинг', 'DevOps alerting', 'Storm Cloud'],
		body: `**Краткий ответ:** Prometheus собирает метрики, Alertmanager отправляет алерты. Настройте alert rules → Alertmanager → Telegram. Завершает стек [Grafana + Prometheus](/blog/grafana-prometheus-vps/).

Метрики без алертов бесполезны — узнаёте о проблеме из [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/), когда уже поздно.

---

## Стек мониторинга

\`\`\`
exporters → Prometheus → Alertmanager → Telegram
                ↓
             Grafana
\`\`\`

Логи — [Loki](/blog/loki-grafana-logi-vps/). Uptime — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).

---

## alert rules

\`\`\`yaml
# /etc/prometheus/alerts.yml
groups:
  - name: vps
    rules:
      - alert: HighCPU
        expr: 100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU > 90% on {{ $labels.instance }}"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 15
        for: 10m
        labels:
          severity: critical
\`\`\`

---

## Alertmanager config

\`\`\`yaml
# alertmanager.yml
route:
  receiver: telegram
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m

receivers:
  - name: telegram
    telegram_configs:
      - bot_token: YOUR_BOT_TOKEN
        chat_id: YOUR_CHAT_ID
        parse_mode: HTML
\`\`\`

---

## Docker Compose фрагмент

\`\`\`yaml
  alertmanager:
    image: prom/alertmanager
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    ports:
      - "127.0.0.1:9093:9093"
\`\`\`

---

## Silence и inhibition

\`\`\`bash
# Maintenance window — silence через UI :9093
amtool silence add alertname=HighCPU --duration=2h
\`\`\`

Inhibition — не спамить DiskSpaceLow если NodeDown.

---

## RAM

Alertmanager лёгкий (~50 MB). Весь стек Prometheus + Grafana + Alertmanager — 2 GB VPS минимум.

---

## Итог

Alertmanager превращает Prometheus в actionable monitoring. Telegram-алерт при CPU/disk — must-have для production.

VPS 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Базовый стек — [Grafana Prometheus](/blog/grafana-prometheus-vps/). Enterprise — [Zabbix](/blog/zabbix-monitoring-vps/).`,
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
pubDate: 2026-07-12
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
