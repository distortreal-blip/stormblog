import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.join(__dirname, '../src/content/blog');

const articles = [
	{
		slug: 'kubernetes-minikube-vps',
		title: 'Kubernetes на VPS: когда k3s и Minikube имеют смысл',
		description:
			'Нужен ли Kubernetes на одном VPS? Сравниваем k3s, Minikube и Docker Compose. Когда оркестратор оправдан, а когда — лишняя сложность.',
		category: 'Облака',
		keywords: ['Kubernetes VPS', 'k3s', 'Minikube', 'оркестрация', 'Docker', 'Storm Cloud'],
		body: `Kubernetes звучит серьёзно. Но на одном VPS он нужен не всегда.

**Краткий ответ:** для одного приложения на VPS чаще хватит Docker Compose. Kubernetes (k3s) имеет смысл при нескольких микросервисах, автомасштабировании или обучении DevOps.

---

## Docker Compose vs k3s vs Minikube

| Решение | RAM минимум | Когда использовать |
| --- | --- | --- |
| Docker Compose | 1–2 GB | 1–5 контейнеров, один сервер |
| k3s | 2–4 GB | Production-lite, несколько сервисов |
| Minikube | 4 GB+ | Локальное обучение K8s |

---

## Установка k3s на VPS за 2 минуты

\`\`\`bash
curl -sfL https://get.k3s.io | sh -
sudo kubectl get nodes
\`\`\`

Проверьте, что VPS имеет минимум **2 GB RAM**. На 1 GB k3s будет тормозить.

---

## Когда НЕ нужен Kubernetes

- Один сайт на Nginx
- Pet-проект на выходные
- WordPress без микросервисов
- Первый VPS — начните с [Docker Compose](/blog/docker-compose-vps/)

## Когда нужен

- 5+ сервисов с разными циклами деплоя
- Нужны health checks и self-healing
- Готовитесь к работе с K8s в компании

---

## Итог

Kubernetes на VPS — инструмент для конкретных задач, не обязательный атрибут «серьёзного» проекта. Начните с Compose, переходите на k3s когда упираетесь в лимиты.

Тестовый VPS для экспериментов — [StormNet Cloud](https://stormnetcloud.com/) с почасовой оплатой.`,
	},
	{
		slug: 'ansible-avtomatizaciya-servera',
		title: 'Ansible для автоматизации VPS: с нуля до playbook',
		description:
			'Как автоматизировать настройку VPS через Ansible: inventory, playbook, роли. Один раз описали — разворачиваете серверы за минуты.',
		category: 'DevOps',
		keywords: ['Ansible', 'автоматизация сервера', 'playbook', 'DevOps', 'VPS', 'Storm Cloud'],
		body: `Ручная настройка каждого VPS отнимает часы. Ansible решает это через декларативные playbook.

---

## Что такое Ansible

Agentless-инструмент: подключается по SSH, выполняет задачи, не требует установки агента на сервер.

**Нужно:** Python на control-машине, SSH-доступ к VPS.

---

## Минимальный playbook

\`\`\`yaml
# playbook.yml
- hosts: webservers
  become: yes
  tasks:
    - name: Update apt cache
      apt: update_cache=yes

    - name: Install nginx
      apt: name=nginx state=present

    - name: Start nginx
      service: name=nginx state=started enabled=yes
\`\`\`

\`\`\`ini
# inventory.ini
[webservers]
192.168.1.10 ansible_user=deploy
\`\`\`

Запуск:

\`\`\`bash
ansible-playbook -i inventory.ini playbook.yml
\`\`\`

---

## Типичные задачи для VPS

- Установка пакетов и обновлений
- Настройка UFW и fail2ban
- Деплой конфигов Nginx
- Создание пользователей и SSH-ключей
- Установка Docker

---

## Ansible vs bash-скрипты

| | Bash | Ansible |
| --- | --- | --- |
| Идемпотентность | Нет | Да |
| Масштаб | 1 сервер | 100+ серверов |
| Читаемость | Средняя | Высокая |
| Кривая обучения | Низкая | Средняя |

---

## Итог

Ansible окупается после второго-третьего сервера. Опишите [первичную настройку VPS](/blog/vps-first-steps/) как playbook — и каждый новый сервер будет готов за 5 минут.

VPS для тестов playbook — [аренда на StormNet Cloud](https://stormnetcloud.com/).`,
	},
	{
		slug: 'nginx-logi-i-oshibki',
		title: 'Логи Nginx: как читать ошибки и находить проблемы',
		description:
			'Разбираем access.log и error.log Nginx: коды 4xx/5xx, upstream timeout, медленные запросы. Команды grep и tail для диагностики.',
		category: 'Linux',
		keywords: ['логи Nginx', 'error.log', 'access.log', 'Linux VPS', 'диагностика', '502 ошибка'],
		body: `Когда сайт падает, первое место — логи Nginx. Научиться читать их = экономия часов дебага.

---

## Где лежат логи

\`\`\`bash
/var/log/nginx/access.log
/var/log/nginx/error.log
\`\`\`

Просмотр в реальном времени:

\`\`\`bash
sudo tail -f /var/log/nginx/error.log
\`\`\`

---

## Формат access.log

\`\`\`
IP - - [дата] "GET /api/users HTTP/1.1" 200 1234 "-" "Mozilla/5.0"
\`\`\`

| Код | Значение |
| --- | --- |
| 200 | OK |
| 301/302 | Редирект |
| 404 | Страница не найдена |
| 502 | Backend не отвечает |
| 504 | Gateway timeout |

---

## Топ-5 команд диагностики

\`\`\`bash
# Все 502 за сегодня
grep " 502 " /var/log/nginx/access.log

# Топ IP по запросам
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head

# Самые частые 404
awk '$9 == 404 {print $7}' access.log | sort | uniq -c | sort -rn | head

# Upstream ошибки
grep "upstream" /var/log/nginx/error.log | tail -20

# Медленные запросы (если настроен log_format с $request_time)
\`\`\`

---

## Частые ошибки в error.log

**connect() failed** — backend не запущен или неверный proxy_pass.

**upstream timed out** — приложение отвечает слишком долго. Увеличьте \`proxy_read_timeout\`.

**No such file or directory** — неверный root в конфиге.

---

## Итог

Логи Nginx — бесплатный мониторинг. Настройте ротацию (\`logrotate\`) и периодически проверяйте 4xx/5xx. Подробнее о мониторинге — [статья про VPS monitoring](/blog/vps-monitoring/).`,
	},
	{
		slug: 'docker-multi-stage-builds',
		title: 'Docker multi-stage build: образы в 10 раз меньше',
		description:
			'Как уменьшить Docker-образ с 1 GB до 50 MB через multi-stage build. Примеры для Node.js и Go на VPS.',
		category: 'Docker',
		keywords: ['Docker multi-stage', 'уменьшить образ Docker', 'Dockerfile', 'VPS', 'production'],
		body: `Образ на 1.2 GB — долгий деплой, много RAM, медленный pull. Multi-stage build решает это.

---

## Проблема

Обычный Dockerfile:

\`\`\`dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["node", "dist/index.js"]
\`\`\`

В образ попадают: node_modules, исходники, devDependencies. Итог — **800 MB–1.5 GB**.

---

## Решение: multi-stage

\`\`\`dockerfile
# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
\`\`\`

Или для Go — финальный образ на \`scratch\` или \`alpine\` — **15–30 MB**.

---

## Сравнение

| Подход | Размер образа | Время pull |
| --- | --- | --- |
| Single-stage Node | ~900 MB | 2–5 мин |
| Multi-stage Node | ~150 MB | 30 сек |
| Multi-stage Go | ~20 MB | 5 сек |

---

## Советы для VPS

- Используйте \`alpine\` базовые образы
- Добавьте \`.dockerignore\`
- Не копируйте \`node_modules\` — ставьте в build stage
- Кэшируйте слои: сначала \`package.json\`, потом код

---

## Итог

Multi-stage — must-have для production на VPS. Меньше образ = быстрее деплой и меньше расход диска.

Деплой контейнеров — [Docker Compose на VPS](/blog/docker-compose-vps/). VPS для CI/CD — [StormNet Cloud](https://stormnetcloud.com/).`,
	},
	{
		slug: 'zashchita-vps-ot-vzloma',
		title: 'Как защитить VPS от взлома: чек-лист безопасности 2026',
		description:
			'Пошаговая защита VPS: SSH-ключи, UFW, fail2ban, отключение root, автообновления. Что делают боты и как от них закрыться.',
		category: 'Безопасность',
		keywords: ['безопасность VPS', 'защита сервера', 'fail2ban', 'SSH', 'брутфорс', 'Storm Cloud'],
		body: `Новый VPS в интернете получает первые сканирования в течение **минут**. Без базовой защиты — компрометация за часы.

---

## Что атакуют боты в первую очередь

1. SSH (порт 22) — brute-force паролей
2. Слабые пароли панелей
3. Открытые Redis/MongoDB без пароля
4. Устаревшие версии ПО с CVE

---

## Чек-лист за 30 минут

### 1. SSH только по ключу

\`\`\`bash
# /etc/ssh/sshd_config
PasswordAuthentication no
PermitRootLogin prohibit-password
\`\`\`

\`\`\`bash
sudo systemctl restart sshd
\`\`\`

### 2. Firewall

\`\`\`bash
sudo ufw default deny incoming
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
\`\`\`

### 3. fail2ban

\`\`\`bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
\`\`\`

### 4. Автообновления

\`\`\`bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
\`\`\`

### 5. Отдельный пользователь

Не работайте под root. См. [первые шаги после запуска VPS](/blog/vps-first-steps/).

---

## Дополнительно

- Смените SSH-порт (спорно, но снижает шум)
- Настройте 2FA для панели провайдера
- Регулярные бэкапы
- Мониторинг failed login attempts

---

## Итог

Безопасность VPS — не разовая задача. Минимальный чек-лист выше закрывает 90% автоматических атак. Для тестов безопасности — [почасовой VPS](https://stormnetcloud.com/).`,
	},
	{
		slug: 'cloudflare-i-vps',
		title: 'Cloudflare перед VPS: CDN, SSL и защита от DDoS',
		description:
			'Как подключить Cloudflare к VPS: DNS, проксирование, Flexible/Full SSL, кэш статики. Плюсы и минусы для российских проектов.',
		category: 'Облака',
		keywords: ['Cloudflare VPS', 'CDN', 'DDoS защита', 'SSL', 'DNS', 'облако'],
		body: `Cloudflare между пользователем и VPS даёт CDN, кэш, SSL и базовую DDoS-защиту — бесплатно.

---

## Как это работает

\`\`\`
Пользователь → Cloudflare (CDN) → ваш VPS (Nginx)
\`\`\`

Запросы к статике (CSS, JS, картинки) отдаются из edge-серверов Cloudflare. Динамика идёт на VPS.

---

## Подключение за 10 минут

1. Зарегистрируйтесь на cloudflare.com
2. Добавьте домен
3. Смените NS-записи у регистратора на Cloudflare
4. В DNS добавьте A-запись → IP VPS (оранжевое облако = прокси включён)
5. SSL/TLS → **Full (strict)** + Let's Encrypt на VPS

---

## Режимы SSL

| Режим | Описание |
| --- | --- |
| Flexible | CF→VPS без HTTPS (не рекомендуется) |
| Full | CF→VPS с HTTPS (самоподписанный OK) |
| Full (strict) | CF→VPS с валидным сертификатом |

---

## Что кэшировать

**Page Rules / Cache Rules:**
- \`*.css\`, \`*.js\`, \`*.webp\` — Cache Everything
- \`/api/*\` — Bypass cache

---

## Плюсы и минусы

**Плюсы:** бесплатный CDN, DDoS mitigation, аналитика, WAF (платно).

**Минусы:** задержка при чистке кэша, иногда блокировки в РФ, реальный IP VPS виден при ошибках настройки.

---

## Итог

Cloudflare + VPS — стандарт для production-сайтов. Настройте Full (strict) SSL и кэш статики — и сервер разгрузится на 60–80%.

VPS под origin — [StormNet Cloud](https://stormnetcloud.com/).`,
	},
	{
		slug: 'fastapi-deploy-vps',
		title: 'FastAPI на VPS: деплой с Uvicorn, Nginx и systemd',
		description:
			'Полный гайд: FastAPI + Uvicorn + Nginx reverse proxy + systemd на Ubuntu VPS. От кода до production за вечер.',
		category: 'Разработка',
		keywords: ['FastAPI VPS', 'Uvicorn', 'деплой Python', 'Nginx reverse proxy', 'systemd'],
		body: `FastAPI — быстрый способ поднять API. На VPS деплой занимает один вечер.

---

## Минимальное приложение

\`\`\`python
# main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/health")
def health():
    return {"status": "ok"}
\`\`\`

---

## Uvicorn как сервис

\`\`\`bash
pip install fastapi uvicorn gunicorn
\`\`\`

\`\`\`ini
# /etc/systemd/system/fastapi.service
[Unit]
Description=FastAPI App
After=network.target

[Service]
User=deploy
WorkingDirectory=/var/www/app
ExecStart=/var/www/app/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
\`\`\`

\`\`\`bash
sudo systemctl enable fastapi
sudo systemctl start fastapi
\`\`\`

---

## Nginx reverse proxy

\`\`\`nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
\`\`\`

---

## Production советы

- Используйте **venv** или Docker
- Gunicorn + Uvicorn workers для нагрузки: \`gunicorn main:app -k uvicorn.workers.UvicornWorker\`
- Не открывайте порт 8000 наружу — только через Nginx
- Добавьте PostgreSQL для данных

---

## Итог

FastAPI + systemd + Nginx — простой и надёжный стек для API на VPS. Полный гайд по серверу — [развернуть сайт на VPS](/blog/razvernut-sayt-na-vps-2026/).

VPS для API — [StormNet Cloud](https://stormnetcloud.com/).`,
	},
	{
		slug: 'backup-vps-3-2-1',
		title: 'Правило 3-2-1: стратегия бэкапов на VPS',
		description:
			'Как не потерять данные на VPS: правило 3-2-1, snapshots, rsync, pg_dump. Автоматизация бэкапов через cron.',
		category: 'VPS',
		keywords: ['бэкап VPS', 'правило 3-2-1', 'snapshot', 'rsync', 'резервное копирование'],
		body: `Один \`rm -rf\` или сбой диска — и проект потерян. Бэкапы на VPS — ваша ответственность.

---

## Правило 3-2-1

- **3** копии данных
- **2** разных типа носителей
- **1** копия off-site (другой дата-центр)

---

## Варианты бэкапа на VPS

| Метод | Что бэкапит | Сложность |
| --- | --- | --- |
| Snapshot VPS | Весь диск | Низкая |
| rsync | Файлы | Низкая |
| pg_dump / mysqldump | База данных | Средняя |
| Restic / Borg | Инкрементальные | Средняя |

---

## Автоматизация через cron

\`\`\`bash
# Бэкап PostgreSQL каждый день в 3:00
0 3 * * * pg_dump -U myuser mydb | gzip > /backups/db-$(date +\\%F).sql.gz

# Удалять старше 14 дней
0 4 * * * find /backups -name "*.sql.gz" -mtime +14 -delete
\`\`\`

---

## Snapshot у провайдера

У Storm Cloud и аналогов — snapshots в панели. Делайте перед:
- Обновлением системы
- Миграцией базы
- Экспериментами с Docker

---

## Что НЕ бэкапить

- \`node_modules\` — восстанавливается через \`npm install\`
- Логи — ротируйте, не храните вечно
- Временные файлы

---

## Итог

Бэкап без автоматизации = бэкапа нет. Настройте cron + off-site копию (S3, другой VPS). Подробнее — [как не потерять код](/blog/dont-lose-code-rules/).`,
	},
	{
		slug: 'systemd-linux-servisy',
		title: 'Systemd на Linux: автозапуск и управление сервисами на VPS',
		description:
			'Гайд по systemd: unit-файлы, systemctl, journalctl. Как настроить автозапуск приложения, Nginx и бота на VPS.',
		category: 'Linux',
		keywords: ['systemd', 'systemctl', 'Linux VPS', 'автозапуск', 'journalctl', 'сервисы'],
		body: `На современном Linux всё крутится вокруг systemd. Понимание unit-файлов — must-have для VPS.

---

## Основные команды

\`\`\`bash
sudo systemctl start myapp
sudo systemctl stop myapp
sudo systemctl restart myapp
sudo systemctl enable myapp    # автозапуск
sudo systemctl status myapp
\`\`\`

Логи:

\`\`\`bash
journalctl -u myapp -f
journalctl -u myapp --since "1 hour ago"
\`\`\`

---

## Структура unit-файла

\`\`\`ini
[Unit]
Description=My Application
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/myapp
ExecStart=/var/www/myapp/start.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
\`\`\`

Файл: \`/etc/systemd/system/myapp.service\`

\`\`\`bash
sudo systemctl daemon-reload
sudo systemctl enable myapp
\`\`\`

---

## Типичные ошибки

**Restart loop** — приложение падает сразу. Смотрите \`journalctl -u myapp -n 50\`.

**Permission denied** — неверный User или права на файлы.

**Забыли daemon-reload** — после изменения unit-файла обязательно.

---

## Systemd vs cron

| | systemd timer | cron |
| --- | --- | --- |
| Логи | journalctl | mail/файлы |
| Зависимости | Да | Нет |
| Точность | Секунды | Минуты |

---

## Итог

Systemd — стандарт для сервисов на VPS. Каждое приложение = unit-файл + enable. Деплой бота — [Telegram-бот на VPS](/blog/telegram-bot-vps/).`,
	},
	{
		slug: 'postgresql-tuning-vps',
		title: 'PostgreSQL на VPS: установка, тюнинг и безопасность',
		description:
			'Как установить PostgreSQL на VPS, настроить shared_buffers и work_mem под RAM, удалённый доступ и бэкапы.',
		category: 'DevOps',
		keywords: ['PostgreSQL VPS', 'тюнинг PostgreSQL', 'база данных VPS', 'shared_buffers', 'Linux'],
		body: `PostgreSQL на VPS — стандарт для backend. Но из коробки он не оптимизирован под ваши ресурсы.

---

## Установка на Ubuntu

\`\`\`bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
\`\`\`

\`\`\`bash
sudo -u postgres createuser --interactive
sudo -u postgres createdb myapp
\`\`\`

---

## Тюнинг под RAM VPS

Для VPS с **4 GB RAM**:

\`\`\`ini
# /etc/postgresql/16/main/postgresql.conf
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 16MB
maintenance_work_mem = 256MB
max_connections = 100
\`\`\`

| RAM VPS | shared_buffers |
| --- | --- |
| 2 GB | 512 MB |
| 4 GB | 1 GB |
| 8 GB | 2 GB |

---

## Безопасность

- Не открывайте порт 5432 в интернет
- Приложение подключается через \`localhost\` или Docker network
- Сильный пароль + \`pg_hba.conf\`

\`\`\`
# Только локально
host  all  all  127.0.0.1/32  scram-sha-256
\`\`\`

---

## Бэкапы

\`\`\`bash
pg_dump -U myuser mydb | gzip > backup.sql.gz
\`\`\`

Автоматизация — [правило 3-2-1](/blog/backup-vps-3-2-1/).

---

## Итог

PostgreSQL на VPS требует тюнинга под RAM и закрытого внешнего доступа. На 2 GB VPS — легковесные нагрузки или managed DB.

VPS для БД — минимум 4 GB RAM. [StormNet Cloud](https://stormnetcloud.com/).`,
	},
];

for (const article of articles) {
	const dir = path.join(blogRoot, article.slug);
	fs.mkdirSync(dir, { recursive: true });

	const keywordsYaml = article.keywords.map((k) => `  - "${k}"`).join('\n');

	const md = `---
title: "${article.title}"
description: "${article.description}"
pubDate: 2026-07-07
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
