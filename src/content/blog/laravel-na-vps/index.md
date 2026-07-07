---
title: "Laravel на VPS: деплой PHP-приложения в production"
description: "Полный гайд по Laravel на Ubuntu VPS: PHP-FPM, Composer, Nginx, MySQL, очереди и scheduler через cron."
pubDate: 2026-07-08
updatedDate: 2026-07-13
category: Разработка
keywords:
  - "Laravel VPS"
  - "PHP деплой"
  - "PHP-FPM"
  - "Nginx Laravel"
  - "Storm Cloud"
heroImage: ./cover.webp
---

Laravel — популярнейший PHP-фреймворк. На VPS он работает через PHP-FPM + Nginx.

---

## Требования VPS

- Ubuntu 22.04+
- 2 GB RAM минимум
- PHP 8.2+, Composer, MySQL/PostgreSQL

```bash
sudo apt install nginx php8.2-fpm php8.2-mysql php8.2-mbstring \
  php8.2-xml php8.2-curl mysql-server composer -y
```

---

## Деплой

```bash
cd /var/www
git clone https://github.com/you/laravel-app.git
cd laravel-app
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

Права:

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
```

---

## Nginx конфиг

```nginx
root /var/www/laravel-app/public;
index index.php;
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    include fastcgi_params;
}
```

---

## Scheduler и очереди

```cron
* * * * * cd /var/www/laravel-app && php artisan schedule:run >> /dev/null 2>&1
```

---

## Итог

Laravel на VPS — классический LEMP-стек. Кэш конфигов и очереди через Redis — [Redis на VPS](/blog/redis-kesh-vps/).

Хостинг на VPS — [StormNet Cloud](https://stormnetcloud.com/).
