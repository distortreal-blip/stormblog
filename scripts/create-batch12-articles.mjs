import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.join(__dirname, '../src/content/blog');
const assetsRoot =
	'C:/Users/User/.cursor/projects/C-Users-User-AppData-Local-Temp-ecc7d104-1973-4588-9f5d-26f83cd5fdcc/assets';

const articles = [
	{
		slug: 'ubuntu-24-04-pervaya-nastroyka-vps',
		coverFile: 'cover-ubuntu-vps.png',
		title: 'Ubuntu 24.04 на VPS: первая настройка с нуля',
		description:
			'Полный чек-лист первой настройки Ubuntu 24.04 на VPS: пользователь, SSH, UFW, обновления, swap, часовой пояс и hardening. Команды для production.',
		category: 'Linux',
		keywords: [
			'Ubuntu 24.04 VPS',
			'настройка Ubuntu сервер',
			'первый запуск VPS',
			'UFW firewall',
			'hardening Linux',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** после создания VPS на Ubuntu 24.04 создайте sudo-пользователя, отключите root-login по паролю, настройте SSH-ключи, включите UFW, обновите систему и задайте hostname. Это база перед любым деплоем — от [развёртывания сайта](/blog/razvernut-sayt-na-vps-2026/) до Docker.

Свежий VPS — как чистый лист. Ошибки на этапе первой настройки потом обходятся дорого: взломы, простои, потерянные данные. Этот гайд — системный чек-лист для Ubuntu 24.04 LTS.

---

## Что сделать в первые 30 минут

| Шаг | Зачем | Время |
| --- | --- | --- |
| Создать sudo-пользователя | Не работать под root | 5 мин |
| SSH только по ключу | Защита от брутфорса | 10 мин |
| UFW firewall | Закрыть лишние порты | 5 мин |
| apt update && upgrade | Патчи безопасности | 5–15 мин |
| Часовой пояс и NTP | Корректные логи | 2 мин |

Подробнее о безопасности — [защита VPS от взлома](/blog/zashchita-vps-ot-vzloma/) и [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/).

---

## Шаг 1. Подключение и обновление

\`\`\`bash
ssh root@ВАШ_IP
apt update && apt upgrade -y
apt install -y curl wget git ufw fail2ban unattended-upgrades
\`\`\`

Включите автоматические security-обновления:

\`\`\`bash
dpkg-reconfigure -plow unattended-upgrades
\`\`\`

---

## Шаг 2. Создание пользователя

\`\`\`bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
\`\`\`

Проверьте вход в **новом терминале**, не закрывая root-сессию:

\`\`\`bash
ssh deploy@ВАШ_IP
\`\`\`

---

## Шаг 3. Hardening SSH

\`\`\`bash
sudo nano /etc/ssh/sshd_config
\`\`\`

Рекомендуемые значения:

\`\`\`ini
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers deploy
\`\`\`

\`\`\`bash
sudo systemctl restart ssh
\`\`\`

Для работы из VS Code — [VS Code + SSH на VPS](/blog/vscode-ssh-vps/).

---

## Шаг 4. UFW firewall

\`\`\`bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
\`\`\`

Дополнительные порты (WireGuard, Minecraft) — только по необходимости. См. [WireGuard VPN](/blog/wireguard-vpn-na-vps/).

---

## Шаг 5. Hostname и часовой пояс

\`\`\`bash
sudo hostnamectl set-hostname prod-web-01
sudo timedatectl set-timezone Europe/Moscow
timedatectl status
\`\`\`

Правильный timezone критичен для [логов Nginx](/blog/nginx-logi-i-oshibki/) и мониторинга.

---

## Шаг 6. Swap (для VPS с 1–2 GB RAM)

\`\`\`bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
\`\`\`

На 4+ GB RAM swap часто не нужен, но для Ollama или тяжёлых сборок — полезен.

---

## Шаг 7. Мониторинг ресурсов

Базовые утилиты:

\`\`\`bash
sudo apt install -y htop iotop ncdu
\`\`\`

Для production добавьте [Grafana + Prometheus](/blog/grafana-prometheus-vps/) или лёгкий [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).

---

## Чек-лист перед деплоем

- [ ] Вход только по SSH-ключу
- [ ] Root login отключён
- [ ] UFW включён
- [ ] Система обновлена
- [ ] Fail2ban или CrowdSec активен
- [ ] Бэкап-стратегия определена — [правило 3-2-1](/blog/backup-vps-3-2-1/)

---

## Типичные ошибки новичков

1. **Работа под root** — одна ошибка = компрометация всего сервера
2. **Парольный SSH** — брутфорс за часы
3. **Все порты открыты** — сканеры найдут Redis/MySQL за минуты
4. **Нет бэкапов** — диск умер — проект умер

Больше ошибок — в [типичных ошибках VPS](/blog/vps-mistakes/).

---

## Итог

Правильная первая настройка Ubuntu 24.04 занимает меньше часа и экономит дни при инцидентах. После чек-листа переходите к [полному гайду деплоя](/blog/razvernut-sayt-na-vps-2026/) или [Docker Compose](/blog/docker-compose-vps/).

VPS для старта — [StormNet Cloud](https://stormnetcloud.com/). Для тестов — [почасовая аренда](/blog/pochasovaya-arenda-vps/).`,
	},
	{
		slug: 'fail2ban-ot-bruteforce-vps',
		coverFile: 'cover-fail2ban-vps.png',
		title: 'Fail2ban на VPS: защита от брутфорса SSH и веб-атак',
		description:
			'Настройка Fail2ban на Ubuntu VPS: jail для SSH, Nginx, защита от брутфорса, whitelist IP, уведомления. Пошаговый гайд с конфигами.',
		category: 'Безопасность',
		keywords: [
			'Fail2ban VPS',
			'защита SSH',
			'брутфорс',
			'безопасность сервера',
			'Nginx fail2ban',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** Fail2ban анализирует логи и временно банит IP после серии неудачных попыток входа. На VPS установите пакет, включите jail для SSH и Nginx, задайте bantime и whitelist для своего IP.

Если VPS в интернете — брутфорс SSH начинается в первые минуты. Fail2ban — первый рубеж обороны после [базовой настройки Ubuntu](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).

---

## Как работает Fail2ban

1. Сервис (sshd, nginx) пишет неудачные попытки в лог
2. Fail2ban парсит лог по filter
3. При превышении maxretry — IP блокируется через iptables/nftables
4. После bantime бан снимается автоматически

Современная альтернатива с crowd intelligence — [CrowdSec](/blog/crowdsec-zashchita-vps/).

---

## Установка

\`\`\`bash
sudo apt update
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
\`\`\`

Не редактируйте \`jail.conf\` напрямую — создайте локальный override:

\`\`\`bash
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
\`\`\`

---

## Базовый jail.local

\`\`\`ini
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
banaction = ufw
ignoreip = 127.0.0.1/8 ВАШ_СТАТИЧЕСКИЙ_IP

[sshd]
enabled = true
port    = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 24h
\`\`\`

\`\`\`bash
sudo systemctl restart fail2ban
sudo fail2ban-client status sshd
\`\`\`

---

## Fail2ban для Nginx

Защита от сканирования и флуда:

\`\`\`ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
\`\`\`

Перед этим настройте [Nginx rate limiting](/blog/nginx-logi-i-oshibki/) и [SSL](/blog/ssl-letsencrypt-vps/).

---

## Мониторинг банов

\`\`\`bash
sudo fail2ban-client status
sudo fail2ban-client status sshd
sudo fail2ban-client set sshd unbanip 1.2.3.4
\`\`\`

Логи:

\`\`\`bash
sudo tail -f /var/log/fail2ban.log
\`\`\`

Интегрируйте алерты с [Grafana](/blog/grafana-prometheus-vps/) или Telegram-ботом.

---

## Fail2ban vs CrowdSec vs только UFW

| Решение | Плюсы | Минусы |
| --- | --- | --- |
| UFW | Просто, быстро | Не реагирует на атаки |
| Fail2ban | Проверен годами, лёгкий | Только локальные логи |
| CrowdSec | Общая база угроз | Сложнее в настройке |

Для большинства VPS достаточно **UFW + Fail2ban**. CrowdSec — следующий уровень.

---

## Частые проблемы

**Заблокировали себя:** добавьте IP в \`ignoreip\`, разбаньте через \`fail2ban-client set sshd unbanip\`.

**Не банит:** проверьте logpath, права на логи, что sshd пишет в /var/log/auth.log.

**Конфликт с Cloudflare:** баньте реальный IP из заголовка CF-Connecting-IP — см. [Cloudflare + VPS](/blog/cloudflare-i-vps/).

---

## Итог

Fail2ban — обязательный слой для любого VPS с SSH. 15 минут настройки закрывают 90% автоматических атак.

VPS с защитой — [StormNet Cloud](https://stormnetcloud.com/). Полный hardening — [защита VPS](/blog/zashchita-vps-ot-vzloma/) + [WireGuard](/blog/wireguard-vpn-na-vps/) для админ-доступа.`,
	},
	{
		slug: 'nextjs-deploy-na-vps',
		coverFile: 'cover-nextjs-vps.png',
		title: 'Next.js на VPS: деплой production-приложения',
		description:
			'Как задеплоить Next.js на VPS: build, PM2, Nginx reverse proxy, SSL, переменные окружения и zero-downtime. Standalone и Node.js режимы.',
		category: 'Разработка',
		keywords: [
			'Next.js VPS',
			'деплой Next.js',
			'Next.js production',
			'PM2 Next.js',
			'Nginx Next.js',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** соберите Next.js (\`next build\`), запустите через PM2 на порту 3000, настройте Nginx как reverse proxy с SSL. Для production используйте standalone output — меньше зависимостей на сервере.

Next.js на Vercel — просто. Но когда нужен полный контроль, свой домен без лимитов или интеграция с [Redis](/blog/redis-kesh-vps/) и [PostgreSQL](/blog/postgresql-tuning-vps/) на том же VPS — деплой на сервер логичен.

---

## Выбор режима деплоя

| Режим | Когда | RAM |
| --- | --- | --- |
| \`next start\` (Node) | SSR, API routes, ISR | 1–2 GB+ |
| Standalone | Production, меньше node_modules | 512 MB–1 GB |
| Static export | Только SSG, без API | Минимум |

---

## Подготовка VPS

Следуйте [первой настройке Ubuntu](/blog/ubuntu-24-04-pervaya-nastroyka-vps/), установите Node.js 20 LTS:

\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
\`\`\`

---

## Standalone build

\`\`\`js
// next.config.js
module.exports = {
  output: 'standalone',
};
\`\`\`

\`\`\`bash
npm ci
npm run build
\`\`\`

Артефакты: \`.next/standalone\`, \`.next/static\`, \`public/\`.

---

## PM2 для автозапуска

\`\`\`bash
sudo npm install -g pm2
cd .next/standalone
PORT=3000 pm2 start server.js --name nextjs-app
pm2 save
pm2 startup
\`\`\`

Подробнее о PM2 — [Node.js деплой](/blog/nodejs-pm2-deploy/). Для zero-downtime:

\`\`\`bash
pm2 reload nextjs-app
\`\`\`

---

## Nginx reverse proxy

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

SSL — [Let's Encrypt на VPS](/blog/ssl-letsencrypt-vps/). Альтернатива Nginx — [Caddy](/blog/nginx-ili-caddy/).

---

## CI/CD

Автоматизируйте через [GitHub Actions](/blog/github-actions-cicd/) или [GitLab Runner](/blog/gitlab-runner-cicd-vps/):

1. Push в main
2. Build на runner или VPS
3. rsync/scp артефактов
4. \`pm2 reload\`

---

## Переменные окружения

\`\`\`bash
# /home/deploy/app/.env.production
DATABASE_URL=postgresql://...
REDIS_URL=redis://127.0.0.1:6379
NEXT_PUBLIC_API_URL=https://api.example.com
\`\`\`

Не коммитьте секреты. Для секретов в CI — GitHub Secrets.

---

## Оптимизация production

- Включите gzip/brotli в Nginx
- Кэшируйте \`/_next/static\` на CDN — [Cloudflare](/blog/cloudflare-i-vps/)
- Мониторинг — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)
- Логи — [Nginx ошибки](/blog/nginx-logi-i-oshibki/)

---

## RAM и масштабирование

| Трафик | RAM | PM2 instances |
| --- | --- | --- |
| Pet-проект | 1 GB | 1 |
| 10k визитов/день | 2 GB | 2 (cluster) |
| 100k+ | 4 GB+ | 2–4 + CDN |

---

## Итог

Next.js на VPS — полный контроль над стеком. Standalone + PM2 + Nginx + SSL — проверенная связка для production.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Базовый деплой — [развернуть сайт на VPS](/blog/razvernut-sayt-na-vps-2026/).`,
	},
	{
		slug: 'minio-s3-na-vps',
		coverFile: 'cover-minio-vps.png',
		title: 'MinIO на VPS: своё S3-хранилище для файлов и бэкапов',
		description:
			'Развёртывание MinIO на VPS: S3-совместимое хранилище, buckets, политики доступа, интеграция с приложениями и бэкапами. Docker и bare metal.',
		category: 'DevOps',
		keywords: [
			'MinIO VPS',
			'S3 хранилище',
			'object storage',
			'бэкапы S3',
			'self-hosted S3',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** MinIO — S3-совместимое хранилище, которое поднимается на VPS за 10 минут. Используйте для загрузки файлов приложения, бэкапов БД и статики — дешевле и приватнее публичного S3.

AWS S3 удобен, но для pet-проектов и [бэкапов по правилу 3-2-1](/blog/backup-vps-3-2-1/) своё хранилище на втором VPS часто выгоднее.

---

## Зачем MinIO на VPS

- Загрузка аватаров, документов, медиа
- Хранение бэкапов PostgreSQL/MySQL
- Совместимость с AWS SDK (drop-in замена)
- Полный контроль над данными

Связка: app VPS + MinIO VPS + [WireGuard](/blog/wireguard-vpn-na-vps/) между ними.

---

## Требования к VPS

| Нагрузка | RAM | Диск |
| --- | --- | --- |
| Dev / тесты | 1 GB | 20 GB |
| Production малый | 2 GB | 100 GB+ |
| Много файлов | 4 GB | 500 GB+ SSD |

Диск важнее CPU. Используйте SSD/NVMe.

---

## Установка через Docker

\`\`\`yaml
# docker-compose.yml
services:
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: STRONG_PASSWORD_HERE
    volumes:
      - minio_data:/data
    restart: unless-stopped

volumes:
  minio_data:
\`\`\`

\`\`\`bash
docker compose up -d
\`\`\`

**Не открывайте** порты 9000/9001 в интернет без Nginx + SSL + auth.

---

## Nginx + SSL для MinIO

\`\`\`nginx
server {
    listen 443 ssl;
    server_name s3.example.com;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        client_max_body_size 100M;
    }
}
\`\`\`

Console — отдельный поддомен \`minio-console.example.com\` на порт 9001.

---

## Создание bucket и ключей

\`\`\`bash
mc alias set local https://s3.example.com admin PASSWORD
mc mb local/uploads
mc mb local/backups
mc admin user add local appuser APP_SECRET_KEY
mc admin policy attach local readwrite --user appuser
\`\`\`

---

## Интеграция с приложением

\`\`\`javascript
// AWS SDK v3 — endpoint MinIO
const s3 = new S3Client({
  endpoint: 'https://s3.example.com',
  region: 'us-east-1',
  credentials: { accessKeyId: '...', secretAccessKey: '...' },
  forcePathStyle: true,
});
\`\`\`

Laravel, Next.js, FastAPI — все работают с S3 API.

---

## Бэкапы в MinIO

\`\`\`bash
# PostgreSQL dump → MinIO
pg_dump mydb | gzip | mc pipe local/backups/mydb-$(date +%F).sql.gz
\`\`\`

Автоматизируйте через cron или [Ansible](/blog/ansible-avtomatizaciya-servera/).

---

## Безопасность

- TLS обязателен
- Отдельные ключи для каждого приложения
- Versioning buckets для защиты от случайного удаления
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на Nginx
- Репликация на второй VPS для DR

---

## MinIO vs облачный S3

| | MinIO на VPS | AWS S3 |
| --- | --- | --- |
| Цена | Диск VPS | Pay per GB + requests |
| Контроль | Полный | AWS |
| Масштаб | До TB | Практически безлимит |
| Надёжность | Ваша ответственность | 99.99% SLA |

---

## Итог

MinIO превращает VPS в персональный S3. Идеален для бэкапов, медиа и приложений с file upload.

VPS с большим диском — [StormNet Cloud](https://stormnetcloud.com/). Docker-стек — [Docker Compose на VPS](/blog/docker-compose-vps/).`,
	},
	{
		slug: 'rabbitmq-ocheredi-na-vps',
		coverFile: 'cover-rabbitmq-vps.png',
		title: 'RabbitMQ на VPS: очереди задач для приложений',
		description:
			'Установка RabbitMQ на VPS: exchanges, queues, workers, management UI. Интеграция с Laravel, Node.js и Python. Надёжная доставка сообщений.',
		category: 'DevOps',
		keywords: [
			'RabbitMQ VPS',
			'очереди сообщений',
			'message queue',
			'Laravel queue',
			'background jobs',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** RabbitMQ — брокер сообщений для фоновых задач: отправка email, обработка изображений, синхронизация данных. На VPS ставится через apt или Docker, management UI — на localhost за Nginx.

Синхронный код не масштабируется. Когда API должен отвечать за 100 мс, а задача занимает 30 секунд — нужна очередь. RabbitMQ — классика рядом с [Redis](/blog/redis-kesh-vps/) (который тоже умеет очереди, но проще).

---

## RabbitMQ vs Redis vs SQS

| | RabbitMQ | Redis (Bull/Celery) | AWS SQS |
| --- | --- | --- | --- |
| Сложность | Средняя | Низкая | Низкая (managed) |
| Гарантии доставки | Сильные | Зависит от настройки | Сильные |
| Routing | Гибкий (exchanges) | Базовый | Базовый |
| Self-hosted | Да | Да | Нет |

Для [Laravel на VPS](/blog/laravel-na-vps/) RabbitMQ — стандарт production-очередей.

---

## Установка (Docker)

\`\`\`yaml
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "127.0.0.1:5672:5672"
      - "127.0.0.1:15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: STRONG_PASS
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    restart: unless-stopped

volumes:
  rabbitmq_data:
\`\`\`

Management UI: \`http://127.0.0.1:15672\` (через SSH tunnel).

---

## Базовые концепции

- **Producer** — отправляет сообщение
- **Exchange** — маршрутизирует в очереди
- **Queue** — хранит сообщения
- **Consumer/Worker** — обрабатывает

Типы exchange: direct, fanout, topic, headers.

---

## Laravel + RabbitMQ

\`\`\`bash
composer require php-amqplib/php-amqplib
\`\`\`

\`\`\`env
QUEUE_CONNECTION=rabbitmq
RABBITMQ_HOST=127.0.0.1
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=...
\`\`\`

\`\`\`bash
php artisan queue:work --tries=3
\`\`\`

Supervisor или [systemd](/blog/systemd-linux-servisy/) для автозапуска воркеров.

---

## Node.js (amqplib)

\`\`\`javascript
const amqp = require('amqplib');
const conn = await amqp.connect('amqp://admin:pass@localhost');
const ch = await conn.createChannel();
await ch.assertQueue('tasks');
ch.sendToQueue('tasks', Buffer.from(JSON.stringify({ job: 'send-email' })));
\`\`\`

---

## Python (Celery)

\`\`\`python
# celery.py
app = Celery('tasks', broker='amqp://admin:pass@localhost//')
\`\`\`

---

## RAM и производительность

| Очередей/сообщений | RAM |
| --- | --- |
| Dev | 512 MB |
| Production малый | 1–2 GB |
| High throughput | 4 GB+ |

Мониторьте queue depth через management UI или [Grafana](/blog/grafana-prometheus-vps/).

---

## Надёжность

- Durable queues + persistent messages
- Publisher confirms
- Dead letter exchange для failed jobs
- Бэкап \`rabbitmq_data\` volume — [бэкапы 3-2-1](/blog/backup-vps-3-2-1/)

---

## Безопасность

- Не открывайте 5672/15672 в интернет
- Отдельные vhost и пользователи per app
- TLS для production между VPS
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) на Nginx

---

## Итог

RabbitMQ на VPS — фундамент для асинхронной архитектуры. Начните с Docker, одной очереди и одного воркера — масштабируйте по мере роста.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). PHP-стек — [Laravel на VPS](/blog/laravel-na-vps/).`,
	},
	{
		slug: 'php-fpm-tuning-vps',
		coverFile: 'cover-php-fpm-vps.png',
		title: 'PHP-FPM на VPS: оптимизация пулов и производительности',
		description:
			'Тюнинг PHP-FPM на VPS: pm.max_children, opcache, пулы per site, расчёт RAM. WordPress и Laravel без тормозов на ограниченных ресурсах.',
		category: 'Разработка',
		keywords: [
			'PHP-FPM VPS',
			'оптимизация PHP',
			'PHP-FPM tuning',
			'WordPress VPS',
			'Laravel performance',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** главный параметр PHP-FPM — \`pm.max_children\`. Рассчитайте его из доступной RAM: (RAM − система − MySQL) / средний размер PHP-процесса. Включите OPcache и используйте \`pm = dynamic\`.

PHP на VPS часто ест всю память из-за неправильного пула. После тюнинга [WordPress](/blog/wordpress-vps-2026/) и [Laravel](/blog/laravel-na-vps/) стабильно держат нагрузку на 2 GB RAM.

---

## Как устроен PHP-FPM

Nginx → FastCGI → PHP-FPM pool → ваш PHP-код

Каждый запрос = PHP-процесс (или переиспользование из пула). Слишком много процессов = OOM killer. Слишком мало = очередь запросов.

---

## Расчёт pm.max_children

\`\`\`bash
# Средний размер PHP-процесса (MB)
ps -o rss= -C php-fpm8.3 | awk '{sum+=$1; n++} END {print sum/n/1024}'
\`\`\`

Формула:

\`\`\`
max_children = (Total RAM - 512MB система - MySQL RAM) / avg PHP process MB
\`\`\`

Пример: 2 GB VPS, MySQL 512 MB, PHP ~50 MB:

\`\`\`
(2048 - 512 - 512) / 50 ≈ 20
\`\`\`

---

## Рекомендуемый pool config

\`\`\`ini
; /etc/php/8.3/fpm/pool.d/www.conf
pm = dynamic
pm.max_children = 20
pm.start_servers = 4
pm.min_spare_servers = 2
pm.max_spare_servers = 8
pm.max_requests = 500
request_terminate_timeout = 60s
\`\`\`

\`\`\`bash
sudo systemctl restart php8.3-fpm
\`\`\`

---

## OPcache — бесплатный прирост

\`\`\`ini
; /etc/php/8.3/mods-available/opcache.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.validate_timestamps=0  ; production — после деплоя reload fpm
\`\`\`

В production \`validate_timestamps=0\` + reload после deploy.

---

## Отдельные пулы per site

\`\`\`ini
; /etc/php/8.3/fpm/pool.d/laravel.conf
[laravel]
user = www-data
group = www-data
listen = /run/php/php8.3-fpm-laravel.sock
pm = dynamic
pm.max_children = 15
\`\`\`

Nginx:

\`\`\`nginx
fastcgi_pass unix:/run/php/php8.3-fpm-laravel.sock;
\`\`\`

---

## PHP-FPM + Nginx тюнинг

\`\`\`nginx
fastcgi_buffers 16 16k;
fastcgi_buffer_size 32k;
fastcgi_read_timeout 60;
\`\`\`

Логи медленных запросов:

\`\`\`ini
slowlog = /var/log/php-fpm/slow.log
request_slowlog_timeout = 5s
\`\`\`

Диагностика — [логи Nginx](/blog/nginx-logi-i-oshibki/).

---

## Кэширование уровня приложения

- [Redis](/blog/redis-kesh-vps/) для сессий и кэша Laravel
- Object cache для WordPress
- [Cloudflare](/blog/cloudflare-i-vps/) для статики

---

## Мониторинг

\`\`\`bash
# Статус пула
curl http://127.0.0.1/status?full  # нужен pm.status_path в pool
\`\`\`

Метрики в [Prometheus](/blog/grafana-prometheus-vps/) через php-fpm_exporter.

---

## Типичные ошибки

1. \`pm = ondemand\` на высоком трафике — лаг при cold start
2. max_children = 200 на 2 GB — OOM
3. OPcache выключен — CPU тратится на парсинг
4. Нет [бэкапов](/blog/backup-vps-3-2-1/) перед изменениями

---

## Итог

PHP-FPM тюнинг — 20 минут работы, которые дают стабильность на маленьком VPS. Считайте RAM, включайте OPcache, мониторьте slow log.

VPS для PHP — [StormNet Cloud](https://stormnetcloud.com/). Деплой Laravel — [Laravel на VPS](/blog/laravel-na-vps/).`,
	},
	{
		slug: 'docker-swarm-na-vps',
		coverFile: 'cover-docker-swarm-vps.png',
		title: 'Docker Swarm на VPS: оркестрация без Kubernetes',
		description:
			'Docker Swarm на VPS: когда имеет смысл, создание кластера, сервисы, rolling update, secrets. Альтернатива k3s для 2–3 серверов.',
		category: 'Docker',
		keywords: [
			'Docker Swarm VPS',
			'оркестрация Docker',
			'Swarm vs Kubernetes',
			'Docker cluster',
			'rolling update',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** Docker Swarm — встроенный оркестратор Docker для 2–5 VPS. Проще [Kubernetes/k3s](/blog/kubernetes-minikube-vps/), даёт rolling updates, service discovery и secrets. Имеет смысл при 2+ серверах; на одном VPS достаточно [Docker Compose](/blog/docker-compose-vps/).

Kubernetes моден, но для команды из двух человек и трёх микросервисов Swarm часто прагматичнее.

---

## Swarm vs Compose vs k3s

| | Compose | Swarm | k3s/K8s |
| --- | --- | --- | --- |
| Серверов | 1 | 2+ | 1+ |
| Сложность | Низкая | Средняя | Высокая |
| Rolling update | Нет | Да | Да |
| Экосистема | Большая | Умеренная | Огромная |

---

## Архитектура кластера

- **Manager node** — оркестрация (можно 1–3)
- **Worker nodes** — запуск контейнеров
- Минимум production: 1 manager + 1 worker на разных VPS

Связь между VPS — приватная сеть провайдера или [WireGuard mesh](/blog/wireguard-vpn-na-vps/).

---

## Инициализация Swarm

На manager:

\`\`\`bash
docker swarm init --advertise-addr ВАШ_IP
# сохраните join token
\`\`\`

На worker:

\`\`\`bash
docker swarm join --token SWMTKN-... MANAGER_IP:2377
\`\`\`

---

## Деплой сервиса

\`\`\`yaml
# stack.yml
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    networks:
      - frontend

  api:
    image: myapi:latest
    deploy:
      replicas: 2
    networks:
      - frontend

networks:
  frontend:
    driver: overlay
\`\`\`

\`\`\`bash
docker stack deploy -c stack.yml myapp
docker service ls
docker service ps myapp_web
\`\`\`

---

## Secrets и configs

\`\`\`bash
echo "db_password" | docker secret create db_pass -
\`\`\`

\`\`\`yaml
services:
  api:
    secrets:
      - db_pass
secrets:
  db_pass:
    external: true
\`\`\`

---

## Rolling update

\`\`\`bash
docker service update --image myapi:v2 myapp_api
\`\`\`

Swarm обновляет по одной реплике — zero-downtime при 2+ replicas.

---

## Ingress и SSL

Варианты:
- Nginx на manager как reverse proxy
- Traefik в Swarm mode с Let's Encrypt
- [Cloudflare](/blog/cloudflare-i-vps/) перед балансировщиком

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/).

---

## Мониторинг Swarm

\`\`\`bash
docker node ls
docker service logs myapp_api
\`\`\`

Централизованный стек — [Grafana + Prometheus](/blog/grafana-prometheus-vps/) + cAdvisor.

---

## Когда НЕ нужен Swarm

- Один VPS, один compose-файл
- Команда планирует K8s через 3 месяца — сразу [k3s](/blog/kubernetes-minikube-vps/)
- Нет опыта Docker — начните с [Compose](/blog/docker-compose-vps/)

---

## Итог

Docker Swarm — недооценённый вариант для 2–3 VPS: rolling updates, overlay network, secrets — без YAML-ада Kubernetes.

Несколько VPS — [StormNet Cloud](https://stormnetcloud.com/). IaC для серверов — [Terraform](/blog/terraform-vps-infrastruktura/).`,
	},
	{
		slug: 'uptime-kuma-monitoring-vps',
		coverFile: 'cover-uptime-kuma-vps.png',
		title: 'Uptime Kuma на VPS: мониторинг доступности сайтов',
		description:
			'Установка Uptime Kuma на VPS: HTTP/TCP/ping мониторы, алерты в Telegram, status page. Лёгкая альтернатива Grafana для uptime.',
		category: 'DevOps',
		keywords: [
			'Uptime Kuma VPS',
			'мониторинг uptime',
			'проверка сайта',
			'status page',
			'алерты Telegram',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** Uptime Kuma — self-hosted мониторинг доступности с красивым UI. Ставится через Docker за 5 минут, шлёт алерты в Telegram/Slack при падении сайта. Дополняет [Grafana/Prometheus](/blog/grafana-prometheus-vps/), но не заменяет метрики CPU/RAM.

Без мониторинга вы узнаёте о падении от клиентов. Uptime Kuma — самый быстрый способ получить алерт за 0 ₽.

---

## Uptime Kuma vs Grafana vs внешние сервисы

| | Uptime Kuma | Grafana | UptimeRobot |
| --- | --- | --- | --- |
| Self-hosted | Да | Да | Нет (free tier) |
| Метрики CPU/RAM | Нет | Да | Нет |
| Status page | Да | С плагинами | Да |
| RAM | ~200 MB | 1 GB+ | — |

Идеальная связка: **Uptime Kuma** (доступность) + **Prometheus** (ресурсы).

---

## Установка

\`\`\`yaml
# docker-compose.yml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    ports:
      - "127.0.0.1:3001:3001"
    volumes:
      - uptime_data:/app/data
    restart: unless-stopped

volumes:
  uptime_data:
\`\`\`

\`\`\`bash
docker compose up -d
\`\`\`

Доступ: SSH tunnel или Nginx reverse proxy + [SSL](/blog/ssl-letsencrypt-vps/).

---

## Nginx reverse proxy

\`\`\`nginx
server {
    listen 443 ssl;
    server_name status.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
\`\`\`

---

## Настройка мониторов

Типы проверок:
- **HTTP(s)** — код ответа, keyword, JSON query
- **TCP** — порт открыт
- **Ping** — ICMP
- **DNS** — резолв записи
- **Docker container** — статус контейнера

Рекомендуемые интервалы:
- Production API: 60 сек
- Блог/лендинг: 120 сек
- Внутренние сервисы: 300 сек

---

## Алерты в Telegram

1. Создайте бота через @BotFather
2. В Uptime Kuma → Settings → Notifications → Telegram
3. Укажите Bot Token и Chat ID

Дублируйте критичные алерты в Grafana Alertmanager.

---

## Status Page

Публичная страница статуса для клиентов:
- Settings → Status Pages
- Добавьте мониторы
- Опубликуйте на \`status.example.com\`

Повышает доверие B2B-клиентов.

---

## Что мониторить на VPS

- Главный сайт (HTTPS 200)
- API health endpoint (\`/health\`)
- [PostgreSQL](/blog/postgresql-tuning-vps/) / [Redis](/blog/redis-kesh-vps/) TCP порты (localhost)
- SSL expiry (встроено в HTTP monitor)
- Внешний [MinIO](/blog/minio-s3-na-vps/) endpoint

---

## Несколько VPS

Один Uptime Kuma на отдельном «management» VPS мониторит все проекты. Не ставьте мониторинг на тот же VPS, который мониторите — при падении сервера упадёт и алерт.

---

## Бэкап

\`\`\`bash
docker run --rm -v uptime-kuma_uptime_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/uptime-kuma-backup.tar.gz /data
\`\`\`

Храните на [MinIO](/blog/minio-s3-na-vps/) или втором VPS — [бэкапы 3-2-1](/blog/backup-vps-3-2-1/).

---

## Итог

Uptime Kuma — первый мониторинг, который стоит поставить на VPS. 5 минут установки, алерты в Telegram, бесплатная status page.

Отдельный VPS для мониторинга — [StormNet Cloud](https://stormnetcloud.com/). Метрики сервера — [Grafana + Prometheus](/blog/grafana-prometheus-vps/).`,
	},
	{
		slug: 'gitlab-runner-cicd-vps',
		coverFile: 'cover-gitlab-runner-vps.png',
		title: 'GitLab Runner на VPS: свой CI/CD pipeline',
		description:
			'Настройка GitLab Runner на VPS: shell и Docker executor, .gitlab-ci.yml, деплой на staging/production. Альтернатива GitHub Actions на своём железе.',
		category: 'DevOps',
		keywords: [
			'GitLab Runner VPS',
			'CI/CD self-hosted',
			'GitLab CI',
			'деплой pipeline',
			'GitHub Actions альтернатива',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** GitLab Runner на VPS выполняет CI/CD jobs: тесты, сборка, деплой. Зарегистрируйте runner в GitLab, выберите Docker executor, опишите pipeline в \`.gitlab-ci.yml\`.

Self-hosted CI/CD — когда [GitHub Actions](/blog/github-actions-cicd/) минут не хватает, нужны приватные runners или деплой во внутреннюю сеть.

---

## GitLab Runner vs GitHub Actions

| | GitLab Runner (VPS) | GitHub Actions |
| --- | --- | --- |
| Хостинг | Ваш VPS | GitHub |
| Стоимость | VPS + время | Free tier / pay per minute |
| Доступ к internal network | Прямой | Через self-hosted runner |
| Экосистема | GitLab-centric | GitHub-centric |

---

## Требования к VPS

| Нагрузка | RAM | Диск |
| --- | --- | --- |
| Малые проекты | 2 GB | 40 GB |
| Docker builds | 4 GB | 80 GB |
| Несколько проектов | 8 GB | 100 GB+ |

Docker executor съедает RAM при параллельных jobs.

---

## Установка Runner

\`\`\`bash
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt install gitlab-runner -y
\`\`\`

Регистрация:

\`\`\`bash
sudo gitlab-runner register
# URL: https://gitlab.com
# Token: из Settings → CI/CD → Runners
# Executor: docker
# Image: docker:24
\`\`\`

---

## Docker executor config

\`\`\`toml
# /etc/gitlab-runner/config.toml
[[runners]]
  name = "vps-runner"
  executor = "docker"
  [runners.docker]
    image = "node:20"
    privileged = false
    volumes = ["/cache"]
\`\`\`

\`\`\`bash
sudo gitlab-runner restart
\`\`\`

---

## Пример .gitlab-ci.yml

\`\`\`yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"

test:
  stage: test
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy_production:
  stage: deploy
  script:
    - rsync -avz dist/ deploy@VPS:/var/www/app/
    - ssh deploy@VPS 'pm2 reload app'
  only:
    - main
\`\`\`

Деплой [Next.js](/blog/nextjs-deploy-na-vps/) или [Node.js](/blog/nodejs-pm2-deploy/) — аналогично.

---

## Shell executor (проще, но менее изолирован)

Runner выполняет команды напрямую на VPS — быстрее, но job'ы видят всю систему. Только для доверенных репозиториев.

---

## Безопасность

- Отдельный VPS для runner, не production
- \`privileged = false\` в Docker executor
- Protected branches + manual deploy
- SSH deploy keys с ограниченными правами
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) + [UFW](/blog/ubuntu-24-04-pervaya-nastroyka-vps/)

---

## Кэш и ускорение

\`\`\`yaml
cache:
  key: \${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
\`\`\`

Docker layer cache — mount \`/var/run/docker.sock\` (осторожно с безопасностью).

---

## Мониторинг pipeline

- GitLab CI/CD analytics
- Алерты при failed pipeline → Telegram
- Runner health — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)

---

## Итог

GitLab Runner на VPS — полный контроль над CI/CD. Docker executor для изоляции, rsync/ssh для деплоя на [production VPS](/blog/razvernut-sayt-na-vps-2026/).

VPS для runner — [StormNet Cloud](https://stormnetcloud.com/). IaC — [Terraform](/blog/terraform-vps-infrastruktura/) + [Ansible](/blog/ansible-avtomatizaciya-servera/).`,
	},
	{
		slug: 'crowdsec-zashchita-vps',
		coverFile: 'cover-crowdsec-vps.png',
		title: 'CrowdSec на VPS: коллективная защита от атак',
		description:
			'Установка CrowdSec на VPS: парсинг логов, community blocklist, bouncer для Nginx/UFW. Современная альтернатива Fail2ban с общей базой угроз.',
		category: 'Безопасность',
		keywords: [
			'CrowdSec VPS',
			'защита сервера',
			'WAF self-hosted',
			'блокировка IP',
			'безопасность VPS',
			'Storm Cloud',
		],
		body: `**Краткий ответ:** CrowdSec анализирует логи (SSH, Nginx, etc.) и блокирует IP через bouncers. Главное преимущество перед [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) — общая база атакующих IP от сообщества.

Один забаненный IP на тысячах серверов — блокируется у всех. CrowdSec — эволюция идеи Fail2ban для 2026 года.

---

## CrowdSec vs Fail2ban

| | CrowdSec | Fail2ban |
| --- | --- | --- |
| Community blocklist | Да | Нет |
| Сценарии (scenarios) | Гибкие YAML | jails + filters |
| Bouncers | Nginx, UFW, Cloudflare | iptables/ufw |
| Сложность | Выше | Ниже |
| RAM | ~100–200 MB | ~50 MB |

Можно использовать **оба**: Fail2ban для SSH, CrowdSec для веб и community list.

---

## Установка

\`\`\`bash
curl -s https://install.crowdsec.net | sudo sh
sudo apt install crowdsec -y
sudo systemctl enable crowdsec
\`\`\`

Установите коллекции:

\`\`\`bash
sudo cscli collections install crowdsecurity/linux
sudo cscli collections install crowdsecurity/nginx
sudo cscli collections install crowdsecurity/sshd
\`\`\`

---

## Bouncer для UFW

\`\`\`bash
sudo apt install crowdsec-firewall-bouncer-iptables
sudo systemctl enable crowdsec-firewall-bouncer-iptables
\`\`\`

Или Nginx bouncer для challenge/captcha при подозрительных запросах.

---

## Проверка работы

\`\`\`bash
sudo cscli metrics
sudo cscli decisions list
sudo cscli alerts list
\`\`\`

Симуляция атаки (с другого IP):

\`\`\`bash
# Несколько неудачных SSH — должен появиться ban
\`\`\`

---

## Интеграция с Nginx

\`\`\`bash
sudo cscli collections install crowdsecurity/nginx
\`\`\`

Убедитесь, что Nginx пишет access/error log в стандартные пути. См. [логи Nginx](/blog/nginx-logi-i-oshibki/).

С [Cloudflare](/blog/cloudflare-i-vps/) — используйте bouncer для Cloudflare или парсите реальный IP.

---

## CrowdSec Console (опционально)

Бесплатная cloud-консоль на app.crowdsec.net — централизованный дашборд для нескольких VPS. Удобно при 3+ серверах.

---

## Whitelist

\`\`\`bash
sudo cscli parsers install crowdsecurity/whitelists
# Добавьте свой IP в /etc/crowdsec/parsers/s02-enrich/whitelists.yaml
\`\`\`

Обязательно whitelist офисный IP и CI/CD runners — [GitLab Runner](/blog/gitlab-runner-cicd-vps/).

---

## Производительность

CrowdSec легче SIEM вроде ELK. На VPS 1 GB RAM работает, но комфортнее 2 GB при Nginx + app + CrowdSec.

Мониторинг — [Grafana](/blog/grafana-prometheus-vps/) или [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).

---

## Полный стек безопасности VPS

1. [Первая настройка Ubuntu](/blog/ubuntu-24-04-pervaya-nastroyka-vps/) — SSH keys, UFW
2. [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) или CrowdSec для SSH
3. CrowdSec community blocklist
4. [SSL](/blog/ssl-letsencrypt-vps/) + [Cloudflare](/blog/cloudflare-i-vps/)
5. [WireGuard](/blog/wireguard-vpn-na-vps/) для админки
6. [Бэкапы 3-2-1](/blog/backup-vps-3-2-1/)

---

## Итог

CrowdSec — следующий уровень после Fail2ban: community intelligence, гибкие сценарии, bouncers под любой стек.

VPS для production — [StormNet Cloud](https://stormnetcloud.com/). Базовый hardening — [защита VPS от взлома](/blog/zashchita-vps-ot-vzloma/).`,
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
pubDate: 2026-07-09
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
