---
title: "Next.js на VPS: деплой production-приложения"
description: "Как задеплоить Next.js на VPS: build, PM2, Nginx reverse proxy, SSL, переменные окружения и zero-downtime. Standalone и Node.js режимы."
pubDate: 2026-07-09
category: Разработка
keywords:
  - "Next.js VPS"
  - "деплой Next.js"
  - "Next.js production"
  - "PM2 Next.js"
  - "Nginx Next.js"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** соберите Next.js (`next build`), запустите через PM2 на порту 3000, настройте Nginx как reverse proxy с SSL. Для production используйте standalone output — меньше зависимостей на сервере.

Next.js на Vercel — просто. Но когда нужен полный контроль, свой домен без лимитов или интеграция с [Redis](/blog/redis-kesh-vps/) и [PostgreSQL](/blog/postgresql-tuning-vps/) на том же VPS — деплой на сервер логичен.

---

## Выбор режима деплоя

| Режим | Когда | RAM |
| --- | --- | --- |
| `next start` (Node) | SSR, API routes, ISR | 1–2 GB+ |
| Standalone | Production, меньше node_modules | 512 MB–1 GB |
| Static export | Только SSG, без API | Минимум |

---

## Подготовка VPS

Следуйте [первой настройке Ubuntu](/blog/ubuntu-24-04-pervaya-nastroyka-vps/), установите Node.js 20 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

---

## Standalone build

```js
// next.config.js
module.exports = {
  output: 'standalone',
};
```

```bash
npm ci
npm run build
```

Артефакты: `.next/standalone`, `.next/static`, `public/`.

---

## PM2 для автозапуска

```bash
sudo npm install -g pm2
cd .next/standalone
PORT=3000 pm2 start server.js --name nextjs-app
pm2 save
pm2 startup
```

Подробнее о PM2 — [Node.js деплой](/blog/nodejs-pm2-deploy/). Для zero-downtime:

```bash
pm2 reload nextjs-app
```

---

## Nginx reverse proxy

```nginx
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
```

SSL — [Let's Encrypt на VPS](/blog/ssl-letsencrypt-vps/). Альтернатива Nginx — [Caddy](/blog/nginx-ili-caddy/).

---

## CI/CD

Автоматизируйте через [GitHub Actions](/blog/github-actions-cicd/) или [GitLab Runner](/blog/gitlab-runner-cicd-vps/):

1. Push в main
2. Build на runner или VPS
3. rsync/scp артефактов
4. `pm2 reload`

---

## Переменные окружения

```bash
# /home/deploy/app/.env.production
DATABASE_URL=postgresql://...
REDIS_URL=redis://127.0.0.1:6379
NEXT_PUBLIC_API_URL=https://api.example.com
```

Не коммитьте секреты. Для секретов в CI — GitHub Secrets.

---

## Оптимизация production

- Включите gzip/brotli в Nginx
- Кэшируйте `/_next/static` на CDN — [Cloudflare](/blog/cloudflare-i-vps/)
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

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Базовый деплой — [развернуть сайт на VPS](/blog/razvernut-sayt-na-vps-2026/).
