---
title: "Supervisor на VPS: управление Python-процессами"
description: "Supervisor на VPS: автозапуск Celery, Gunicorn, workers. Альтернатива systemd для нескольких процессов одного приложения."
pubDate: 2026-07-12
category: DevOps
keywords:
  - "Supervisor VPS"
  - "Python workers"
  - "Celery supervisor"
  - "process manager"
  - "Gunicorn"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Supervisor следит за группой процессов: перезапуск при падении, единый лог, `supervisorctl restart all`. Удобен когда одному приложению нужны web + worker + beat.

[systemd](/blog/systemd-linux-servisy/) — один unit = один процесс. Supervisor — один конфиг на стек [Django](/blog/django-deploy-na-vps/) + Celery + [RabbitMQ consumer](/blog/rabbitmq-ocheredi-na-vps/).

---

## Установка

```bash
sudo apt install supervisor -y
sudo systemctl enable supervisor
```

---

## Конфиг Gunicorn + Celery

```ini
; /etc/supervisor/conf.d/myapp.conf
[program:gunicorn]
command=/var/www/app/venv/bin/gunicorn --bind 127.0.0.1:8000 config.wsgi:application
directory=/var/www/app
user=deploy
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/gunicorn.err.log
stdout_logfile=/var/log/supervisor/gunicorn.out.log

[program:celery]
command=/var/www/app/venv/bin/celery -A config worker -l info
directory=/var/www/app
user=deploy
autostart=true
autorestart=true
numprocs=1
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status
```

---

## supervisorctl команды

```bash
sudo supervisorctl restart gunicorn
sudo supervisorctl tail -f celery stderr
sudo supervisorctl stop all
```

---

## Supervisor vs systemd vs PM2

| | Supervisor | systemd | PM2 |
| --- | --- | --- | --- |
| Python | Отлично | Хорошо | Node-focused |
| Несколько процессов | Да | Несколько units | Да |
| Стандарт Linux | Дополнение | Нативный | npm |

Node.js — [PM2](/blog/nodejs-pm2-deploy/). Go/Rust — [systemd](/blog/systemd-linux-servisy/).

---

## Итог

Supervisor упрощает Python-стек с воркерами. Один конфиг — web + queue + scheduler.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Flask — [Flask deploy](/blog/flask-deploy-na-vps/).
