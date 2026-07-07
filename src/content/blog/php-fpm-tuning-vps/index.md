---
title: "PHP-FPM на VPS: оптимизация пулов и производительности"
description: "Тюнинг PHP-FPM на VPS: pm.max_children, opcache, пулы per site, расчёт RAM. WordPress и Laravel без тормозов на ограниченных ресурсах."
pubDate: 2026-07-05
category: Разработка
keywords:
  - "PHP-FPM VPS"
  - "оптимизация PHP"
  - "PHP-FPM tuning"
  - "WordPress VPS"
  - "Laravel performance"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** главный параметр PHP-FPM — `pm.max_children`. Рассчитайте его из доступной RAM: (RAM − система − MySQL) / средний размер PHP-процесса. Включите OPcache и используйте `pm = dynamic`.

PHP на VPS часто ест всю память из-за неправильного пула. После тюнинга [WordPress](/blog/wordpress-vps-2026/) и [Laravel](/blog/laravel-na-vps/) стабильно держат нагрузку на 2 GB RAM.

---

## Как устроен PHP-FPM

Nginx → FastCGI → PHP-FPM pool → ваш PHP-код

Каждый запрос = PHP-процесс (или переиспользование из пула). Слишком много процессов = OOM killer. Слишком мало = очередь запросов.

---

## Расчёт pm.max_children

```bash
# Средний размер PHP-процесса (MB)
ps -o rss= -C php-fpm8.3 | awk '{sum+=$1; n++} END {print sum/n/1024}'
```

Формула:

```
max_children = (Total RAM - 512MB система - MySQL RAM) / avg PHP process MB
```

Пример: 2 GB VPS, MySQL 512 MB, PHP ~50 MB:

```
(2048 - 512 - 512) / 50 ≈ 20
```

---

## Рекомендуемый pool config

```ini
; /etc/php/8.3/fpm/pool.d/www.conf
pm = dynamic
pm.max_children = 20
pm.start_servers = 4
pm.min_spare_servers = 2
pm.max_spare_servers = 8
pm.max_requests = 500
request_terminate_timeout = 60s
```

```bash
sudo systemctl restart php8.3-fpm
```

---

## OPcache — бесплатный прирост

```ini
; /etc/php/8.3/mods-available/opcache.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.validate_timestamps=0  ; production — после деплоя reload fpm
```

В production `validate_timestamps=0` + reload после deploy.

---

## Отдельные пулы per site

```ini
; /etc/php/8.3/fpm/pool.d/laravel.conf
[laravel]
user = www-data
group = www-data
listen = /run/php/php8.3-fpm-laravel.sock
pm = dynamic
pm.max_children = 15
```

Nginx:

```nginx
fastcgi_pass unix:/run/php/php8.3-fpm-laravel.sock;
```

---

## PHP-FPM + Nginx тюнинг

```nginx
fastcgi_buffers 16 16k;
fastcgi_buffer_size 32k;
fastcgi_read_timeout 60;
```

Логи медленных запросов:

```ini
slowlog = /var/log/php-fpm/slow.log
request_slowlog_timeout = 5s
```

Диагностика — [логи Nginx](/blog/nginx-logi-i-oshibki/).

---

## Кэширование уровня приложения

- [Redis](/blog/redis-kesh-vps/) для сессий и кэша Laravel
- Object cache для WordPress
- [Cloudflare](/blog/cloudflare-i-vps/) для статики

---

## Мониторинг

```bash
# Статус пула
curl http://127.0.0.1/status?full  # нужен pm.status_path в pool
```

Метрики в [Prometheus](/blog/grafana-prometheus-vps/) через php-fpm_exporter.

---

## Типичные ошибки

1. `pm = ondemand` на высоком трафике — лаг при cold start
2. max_children = 200 на 2 GB — OOM
3. OPcache выключен — CPU тратится на парсинг
4. Нет [бэкапов](/blog/backup-vps-3-2-1/) перед изменениями

---

## Итог

PHP-FPM тюнинг — 20 минут работы, которые дают стабильность на маленьком VPS. Считайте RAM, включайте OPcache, мониторьте slow log.

VPS для PHP — [StormNet Cloud](https://stormnetcloud.com/). Деплой Laravel — [Laravel на VPS](/blog/laravel-na-vps/).
