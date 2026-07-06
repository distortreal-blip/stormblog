---
title: "journalctl на VPS: работа с логами Linux и systemd"
description: "Гайд по journalctl: просмотр логов сервисов, фильтры, ротация, экспорт. Диагностика падений Nginx, Docker и приложений на VPS."
pubDate: 2026-07-10
category: Linux
keywords:
  - "journalctl VPS"
  - "логи Linux"
  - "systemd логи"
  - "диагностика сервера"
  - "journalctl фильтры"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** journalctl — центральный просмотр логов systemd на Linux VPS. `journalctl -u nginx -f` — live-лог сервиса. Без знания journalctl диагностика [Nginx ошибок](/blog/nginx-logi-i-oshibki/) и падений приложений занимает в разы больше времени.

На современном Ubuntu всё идёт через systemd/journald. Файлы в /var/log/ ещё есть, но systemd-сервисы — в journal.

---

## Базовые команды

```bash
journalctl -xe                    # последние ошибки
journalctl -u nginx -f            # follow nginx
journalctl -u gunicorn --since "1 hour ago"
journalctl -u docker -p err       # только error priority
```

---

## Фильтры по времени

```bash
journalctl --since "2026-07-10 09:00" --until "2026-07-10 10:00"
journalctl --since today
journalctl --since "-30min"
```

При инциденте — сузьте окно до минут падения.

---

## Несколько сервисов

```bash
journalctl -u nginx -u php8.3-fpm -u mysql --since "-1h"
```

Типичная цепочка [Laravel](/blog/laravel-na-vps/): Nginx 502 → смотрите php-fpm и gunicorn/node.

---

## Приоритеты (уровни логов)

| Priority | Уровень |
| --- | --- |
| 0–3 | emerg–err (критично) |
| 4 | warning |
| 6 | info |
| 7 | debug |

```bash
journalctl -p warning -u ssh
```

Полезно для [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) и SSH-атак.

---

## Экспорт и ротация

```bash
journalctl -u myapp --since today > /tmp/myapp.log
journalctl --disk-usage
sudo journalctl --vacuum-size=500M
```

В `/etc/systemd/journald.conf`:

```ini
SystemMaxUse=500M
MaxRetentionSec=30day
```

Иначе journal съест диск на маленьком VPS.

---

## Docker и journalctl

```bash
journalctl -u docker
docker logs container_name
```

Для [Portainer](/blog/portainer-docker-vps/) — UI логов удобнее, journalctl — для системных ошибок Docker daemon.

---

## Структурированные логи (JSON)

Приложения с JSON-логами в stdout (Go, structured Python):

```bash
journalctl -u go-api -o json-pretty
```

Для централизации — отправка в Loki/ELK (отдельная статья) или [Sentry](/blog/sentry-self-hosted-vps/) для ошибок.

---

## journalctl vs файлы в /var/log

| | journalctl | /var/log/nginx/ |
| --- | --- | --- |
| systemd сервисы | Да | Иногда дублирует |
| Nginx access log | Нет | Да |
| Бинарный формат | Да (читается через journalctl) | Текст |
| Ротация | journald vacuum | logrotate |

Для Nginx access — файлы + [анализ логов](/blog/nginx-logi-i-oshibki/). Для systemd — journalctl.

---

## Чек-лист диагностики падения

1. `journalctl -xe` — что упало последним
2. `systemctl status SERVICENAME` — код выхода
3. `journalctl -u SERVICENAME -n 100` — контекст
4. Проверить RAM/disk — [Grafana](/blog/grafana-prometheus-vps/)
5. [Бэкап](/blog/backup-vps-3-2-1/) перед рестартом

---

## Итог

journalctl — первый инструмент при любом «сервер не работает». Выучите 5–6 флагов — сэкономите часы при каждом инциденте.

VPS для практики — [StormNet Cloud](https://stormnetcloud.com/). Сервисы — [systemd гайд](/blog/systemd-linux-servisy/). Мониторинг — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).
