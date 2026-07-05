---
title: "Docker Compose на VPS: первый проект с нуля"
description: "Первый проект на Docker Compose на VPS: установка Docker, compose-файл, volumes, сети и автозапуск. Практическое руководство для backend и DevOps-новичков."
pubDate: 2026-07-06
category: Docker
keywords:
  - "docker compose vps"
  - "docker на сервере"
  - "контейнеры vps"
  - "docker compose tutorial"
  - "nginx docker"
  - "container deployment"
  - "linux docker"
heroImage: ./cover.png
---

Docker Compose — стандартный способ упаковать приложение с базой данных, кэшем и reverse proxy в один конфиг. На VPS это избавляет от ручной установки PostgreSQL, Redis и nginx по отдельности. Разберём деплой с нуля на чистом Ubuntu-сервере.

Предположим, у вас есть простое веб-приложение (API + фронт) и PostgreSQL. Такой стек — идеальный первый проект.

---

## Установка Docker на VPS

Подключитесь к серверу и установите Docker Engine:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

Проверьте: `docker run hello-world`. Docker Compose v2 входит в пакет как плагин: `docker compose version`.

Минимальные требования VPS: 2 vCPU, 2 ГБ RAM. Docker потребляет 200–400 МБ на системные процессы, остальное — контейнерам.

---

## Структура проекта

Создайте директорию на сервере:

```
~/myapp/
├── docker-compose.yml
├── .env
├── app/
│   └── Dockerfile
└── nginx/
    └── nginx.conf
```

Файл `.env` хранит секреты:

```
POSTGRES_PASSWORD=secure_pass_here
APP_PORT=3000
DOMAIN=example.com
```

Не коммитьте `.env` в git — только `.env.example` с пустыми значениями.

---

## docker-compose.yml для первого проекта

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: myapp
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      retries: 5

  app:
    build: ./app
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@db:5432/myapp
    expose:
      - "3000"

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - certbot-certs:/etc/letsencrypt
    depends_on:
      - app

volumes:
  pgdata:
  certbot-certs:
```

Ключевые моменты:

- `restart: unless-stopped` — контейнеры поднимаются после перезагрузки VPS
- `depends_on` с healthcheck — app не стартует до готовности БД
- `volumes` — данные PostgreSQL переживают пересборку контейнера
- nginx проксирует трафик на app, порты 80/443 открыты наружу

---

## Запуск и проверка

```bash
cd ~/myapp
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Приложение доступно по IP сервера. Для домена добавьте A-запись и настройте SSL через Certbot в отдельном контейнере или на хосте.

Обновление приложения:

```bash
git pull
docker compose up -d --build app
```

База данных не пересобирается — данные в volume сохраняются.

---

## Сети, логи и отладка

Docker Compose создаёт изолированную сеть: контейнеры общаются по имени сервиса (`db`, `app`). Наружу торчат только порты, указанные в `ports`.

Полезные команды:

- `docker compose exec app sh` — зайти в контейнер
- `docker compose logs --tail=100 db` — логи PostgreSQL
- `docker system df` — занятое место на диске
- `docker compose down` — остановить (данные в volumes остаются)
- `docker compose down -v` — удалить volumes (осторожно!)

Настройте ротацию логов в `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
```

Без ротации логи заполнят диск за недели.

---

## Автозапуск и production-практики

Docker Compose v2 с флагом `--restart` и директивой `restart: unless-stopped` обеспечивает автозапуск. Дополнительно создайте systemd unit:

```ini
[Unit]
Description=MyApp Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/user/myapp
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Production-чеклист:

- Pin версии образов (`postgres:16-alpine`, не `latest`)
- Бэкап volume pgdata: `docker run --rm -v myapp_pgdata:/data -v $(pwd):/backup alpine tar czf /backup/pgdata.tar.gz /data`
- Мониторинг через Portainer или простой healthcheck endpoint
- Firewall: открыты только 80, 443, 22

---

## Итог

Docker Compose на VPS превращает разрозненные сервисы в один управляемый стек. Первый проект — это docker-compose.yml с app, db и nginx, volumes для персистентности и restart policies для отказоустойчивости. После освоения базового стека добавляйте Redis, очереди и CI/CD через GitHub Actions.

Для экспериментов с контейнерами удобно арендовать VPS с NVMe и достаточным RAM — например, у Storm Cloud, где сервер активируется за минуты и не мешает сосредоточиться на конфигурации, а не на ожидании.
