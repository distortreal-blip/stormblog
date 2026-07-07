---
title: "Symfony на VPS: деплой PHP-приложения"
description: "Деплой Symfony на VPS: Composer, PHP-FPM, Nginx, Messenger, cache. Production checklist для enterprise PHP."
pubDate: 2026-07-12
updatedDate: 2026-07-13
category: Разработка
keywords:
  - "Symfony VPS"
  - "деплой Symfony"
  - "PHP enterprise"
  - "Symfony production"
  - "Messenger"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Symfony на VPS = Composer install --no-dev + PHP-FPM + Nginx + opcache + Messenger worker. Аналог [Laravel](/blog/laravel-na-vps/) с другой структурой.

Symfony — выбор для enterprise PHP в Европе. [PHP-FPM tuning](/blog/php-fpm-tuning-vps/) критичен на 2 GB VPS.

---

## Production deploy

```bash
composer install --no-dev --optimize-autoloader
php bin/console cache:clear --env=prod
php bin/console cache:warmup --env=prod
php bin/console doctrine:migrations:migrate --no-interaction
```

---

## Nginx

```nginx
root /var/www/symfony/public;
location / {
    try_files $uri /index.php$is_args$args;
}
location ~ ^/index\.php {
    fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
}
```

[SSL](/blog/ssl-letsencrypt-vps/) + [Cloudflare](/blog/cloudflare-i-vps/).

---

## Symfony Messenger

```bash
php bin/console messenger:consume async -vv
```

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

VPS 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Laravel альтернатива — [Laravel на VPS](/blog/laravel-na-vps/).
