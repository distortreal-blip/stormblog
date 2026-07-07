---
title: "Flask на VPS: деплой Python microframework"
description: "Деплой Flask на VPS: Gunicorn, Nginx, venv, systemd, SSL. Лёгкий Python backend для API и небольших приложений."
pubDate: 2026-07-11
updatedDate: 2026-07-13
category: Разработка
keywords:
  - "Flask VPS"
  - "деплой Flask"
  - "Gunicorn Flask"
  - "Python VPS"
  - "Flask production"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Flask + Gunicorn + Nginx + systemd — классический Python-стек на VPS. Виртуальное окружение, `gunicorn app:app`, reverse proxy с [SSL](/blog/ssl-letsencrypt-vps/).

Flask проще [Django](/blog/django-deploy-na-vps/) для API и микросервисов. [FastAPI](/blog/fastapi-deploy-vps/) — если нужен async и OpenAPI из коробки.

---

## Подготовка VPS

```bash
sudo apt install python3-venv nginx -y
```

[Ubuntu настройка](/blog/ubuntu-24-04-pervaya-nastroyka-vps/) — первым делом.

---

## venv и зависимости

```bash
cd /var/www/flask-app
python3 -m venv venv
source venv/bin/activate
pip install flask gunicorn
```

```python
# app.py
from flask import Flask
app = Flask(__name__)

@app.route('/health')
def health():
    return {'status': 'ok'}
```

---

## Gunicorn

```bash
gunicorn --workers 3 --bind 127.0.0.1:8000 app:app
```

```ini
[Service]
ExecStart=/var/www/flask-app/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 app:app
WorkingDirectory=/var/www/flask-app
User=deploy
```

[systemd](/blog/systemd-linux-servisy/) для автозапуска.

---

## Nginx

```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## БД и кэш

- PostgreSQL — [tuning](/blog/postgresql-tuning-vps/)
- Redis — [кэш](/blog/redis-kesh-vps/)
- Celery + [RabbitMQ](/blog/rabbitmq-ocheredi-na-vps/) для фоновых задач

---

## Workers и RAM

| VPS RAM | workers |
| --- | --- |
| 1 GB | 2 |
| 2 GB | 3 |
| 4 GB | 4–5 |

Каждый worker — отдельный Python-процесс.

---

## Итог

Flask на VPS — быстрый старт для Python API. Gunicorn + Nginx + systemd покрывают 90% pet-проектов.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). Async API — [FastAPI](/blog/fastapi-deploy-vps/).
