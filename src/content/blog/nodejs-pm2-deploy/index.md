---
title: "Node.js на VPS: деплой с PM2 и Nginx"
description: "Как запустить Node.js приложение на VPS: PM2 для автозапуска, кластеризация, логи и Nginx reverse proxy."
pubDate: 2026-07-06
category: Разработка
keywords:
  - "Node.js VPS"
  - "PM2"
  - "деплой Node"
  - "Nginx"
  - "JavaScript production"
heroImage: ./cover.webp
---

Node.js на VPS без process manager падает при закрытии SSH. PM2 решает это за одну команду.

---

## Установка

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
sudo npm install -g pm2
```

---

## Запуск приложения

```bash
cd /var/www/myapp
npm ci --production
pm2 start index.js --name myapp
pm2 save
pm2 startup
```

Кластер на все ядра:

```bash
pm2 start index.js -i max --name myapp
```

---

## Nginx reverse proxy

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
}
```

---

## Мониторинг

```bash
pm2 monit
pm2 logs myapp
pm2 status
```

---

## Итог

PM2 + Nginx — стандартный стек Node.js на VPS. Не забудьте SSL через [Let's Encrypt](/blog/ssl-letsencrypt-vps/).

VPS для Node — [StormNet Cloud](https://stormnetcloud.com/).
