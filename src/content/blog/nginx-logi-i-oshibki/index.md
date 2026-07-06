---
title: "Логи Nginx: как читать ошибки и находить проблемы"
description: "Разбираем access.log и error.log Nginx: коды 4xx/5xx, upstream timeout, медленные запросы. Команды grep и tail для диагностики."
pubDate: 2026-07-07
category: Linux
keywords:
  - "логи Nginx"
  - "error.log"
  - "access.log"
  - "Linux VPS"
  - "диагностика"
  - "502 ошибка"
heroImage: ./cover.webp
---

Когда сайт падает, первое место — логи Nginx. Научиться читать их = экономия часов дебага.

---

## Где лежат логи

```bash
/var/log/nginx/access.log
/var/log/nginx/error.log
```

Просмотр в реальном времени:

```bash
sudo tail -f /var/log/nginx/error.log
```

---

## Формат access.log

```
IP - - [дата] "GET /api/users HTTP/1.1" 200 1234 "-" "Mozilla/5.0"
```

| Код | Значение |
| --- | --- |
| 200 | OK |
| 301/302 | Редирект |
| 404 | Страница не найдена |
| 502 | Backend не отвечает |
| 504 | Gateway timeout |

---

## Топ-5 команд диагностики

```bash
# Все 502 за сегодня
grep " 502 " /var/log/nginx/access.log

# Топ IP по запросам
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head

# Самые частые 404
awk '$9 == 404 {print $7}' access.log | sort | uniq -c | sort -rn | head

# Upstream ошибки
grep "upstream" /var/log/nginx/error.log | tail -20

# Медленные запросы (если настроен log_format с $request_time)
```

---

## Частые ошибки в error.log

**connect() failed** — backend не запущен или неверный proxy_pass.

**upstream timed out** — приложение отвечает слишком долго. Увеличьте `proxy_read_timeout`.

**No such file or directory** — неверный root в конфиге.

---

## Итог

Логи Nginx — бесплатный мониторинг. Настройте ротацию (`logrotate`) и периодически проверяйте 4xx/5xx. Подробнее о мониторинге — [статья про VPS monitoring](/blog/vps-monitoring/).
