---
title: "Memcached на VPS: кэширование для ускорения сайта"
description: "Установка Memcached на VPS: object cache для WordPress, Drupal, Laravel. Сравнение с Redis, настройка памяти и безопасность."
pubDate: 2026-07-04
category: DevOps
keywords:
  - "Memcached VPS"
  - "кэширование сайта"
  - "object cache"
  - "WordPress cache"
  - "Memcached Linux"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Memcached — in-memory кэш для ускорения чтения из БД. На VPS ставится за 5 минут, даёт 2–5× ускорение WordPress при правильных плагинах. Для очередей и persistence — [Redis](/blog/redis-kesh-vps/).

Когда БД — узкое место, object cache снимает нагрузку. Memcached проще Redis, если нужен только кэш без pub/sub.

---

## Memcached vs Redis

| | Memcached | Redis |
| --- | --- | --- |
| Модель | Только key-value cache | Cache + структуры + очереди |
| Persistence | Нет | Да (RDB/AOF) |
| RAM efficiency | Чуть лучше на простом кэше | Универсальнее |
| Laravel/WordPress | Да | Да |

Один VPS — выберите **одно**: Redis обычно достаточно. Memcached — если нужна максимальная простота кэша.

---

## Установка

```bash
sudo apt install memcached -y
sudo systemctl enable memcached
```

```ini
# /etc/memcached.conf
-m 256          # 256 MB RAM
-l 127.0.0.1   # только localhost
-u memcache
```

```bash
sudo systemctl restart memcached
echo "stats" | nc 127.0.0.1 11211
```

---

## WordPress + Memcached

Плагин W3 Total Cache или Object Cache Pro:

```php
// wp-config.php
define('WP_CACHE_KEY_SALT', 'example.com:');
```

Кэшируются: wp_options, post meta, taxonomy. Снижение запросов к [MariaDB](/blog/mariadb-optimizaciya-vps/) — в разы.

---

## Laravel

```env
CACHE_DRIVER=memcached
MEMCACHED_HOST=127.0.0.1
MEMCACHED_PORT=11211
```

Для сессий и очередей — лучше Redis или [RabbitMQ](/blog/rabbitmq-ocheredi-na-vps/).

---

## RAM на VPS

| Сайт | Memcached |
| --- | --- |
| Блог WordPress | 128–256 MB |
| WooCommerce | 512 MB |
| API + cache | 256–512 MB |

Не отдавайте Memcached больше 40% RAM VPS — оставьте место приложению и БД.

---

## Мониторинг hit rate

```bash
echo "stats" | nc 127.0.0.1 11211 | grep get_
```

- `get_hits` / (`get_hits` + `get_misses`) = hit rate
- Цель: > 90% для object cache

Метрики в [Grafana](/blog/grafana-prometheus-vps/) через memcached_exporter.

---

## Безопасность

- **Только 127.0.0.1** — порт 11211 без auth, открытый в интернет = утечка данных
- [UFW](/blog/ubuntu-24-04-pervaya-nastroyka-vps/) блокирует 11211 снаружи

---

## Итог

Memcached — быстрый win для WordPress и PHP на VPS. 256 MB кэша часто важнее апгрейда CPU.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Альтернатива — [Redis на VPS](/blog/redis-kesh-vps/).
