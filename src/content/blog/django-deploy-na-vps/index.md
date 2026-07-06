---
title: "Django на VPS: деплой production-приложения"
description: "Как задеплоить Django на VPS: Gunicorn, Nginx, PostgreSQL, static/media, systemd и SSL. Полный гайд для Python backend."
pubDate: 2026-07-10
category: Разработка
keywords:
  - "Django VPS"
  - "деплой Django"
  - "Gunicorn"
  - "Python production"
  - "PostgreSQL Django"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Django на VPS = Gunicorn (WSGI) + Nginx (static + reverse proxy) + PostgreSQL + systemd. Соберите static, настройте .env, выпустите SSL — production готов.

Python backend на VPS — классика. Если уже знаете [FastAPI деплой](/blog/fastapi-deploy-vps/) — Django отличается static files и admin panel.

---

## Стек production

```
Пользователь → Nginx (SSL) → Gunicorn → Django → PostgreSQL
                    ↓
              static / media
```

Опционально: [Redis](/blog/redis-kesh-vps/) для кэша и Celery, [RabbitMQ](/blog/rabbitmq-ocheredi-na-vps/) для очередей.

---

## Подготовка VPS

Следуйте [настройке Ubuntu](/blog/ubuntu-24-04-pervaya-nastroyka-vps/):

```bash
sudo apt install python3-pip python3-venv nginx postgresql -y
```

---

## Проект и venv

```bash
cd /var/www
sudo -u deploy git clone https://github.com/you/project.git django-app
cd django-app
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt gunicorn
```

```bash
python manage.py collectstatic --noinput
python manage.py migrate
```

---

## settings.py production

```python
DEBUG = False
ALLOWED_HOSTS = ['example.com', 'www.example.com']
STATIC_ROOT = BASE_DIR / 'staticfiles'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': '127.0.0.1',
    }
}
```

Тюнинг PostgreSQL — [PostgreSQL на VPS](/blog/postgresql-tuning-vps/).

---

## Gunicorn + systemd

```ini
# /etc/systemd/system/gunicorn.service
[Unit]
Description=Gunicorn Django
After=network.target

[Service]
User=deploy
WorkingDirectory=/var/www/django-app
EnvironmentFile=/var/www/django-app/.env
ExecStart=/var/www/django-app/venv/bin/gunicorn \
  --workers 3 --bind 127.0.0.1:8000 config.wsgi:application
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now gunicorn
```

Подробнее о systemd — [Linux-сервисы](/blog/systemd-linux-servisy/).

---

## Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    location /static/ {
        alias /var/www/django-app/staticfiles/;
    }
    location /media/ {
        alias /var/www/django-app/media/;
    }
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Media на больших объёмах — [MinIO S3](/blog/minio-s3-na-vps/).

---

## Workers и RAM

| VPS RAM | Gunicorn workers |
| --- | --- |
| 1 GB | 2 |
| 2 GB | 3 |
| 4 GB | 4–5 |

Формула: `(2 × CPU) + 1`, но не больше доступной RAM.

---

## CI/CD

Автодеплой через [GitHub Actions](/blog/github-actions-cicd/) или [GitLab Runner](/blog/gitlab-runner-cicd-vps/): pull → migrate → collectstatic → restart gunicorn.

---

## Итог

Django на VPS — предсказуемый стек: Gunicorn + Nginx + PostgreSQL. Один раз настроили — масштабируете workers и RAM.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Python API альтернатива — [FastAPI](/blog/fastapi-deploy-vps/).
