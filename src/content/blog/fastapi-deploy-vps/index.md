---
title: "FastAPI на VPS: деплой с Uvicorn, Nginx и systemd"
description: "Полный гайд: FastAPI + Uvicorn + Nginx reverse proxy + systemd на Ubuntu VPS. От кода до production за вечер."
pubDate: 2026-07-07
category: Разработка
keywords:
  - "FastAPI VPS"
  - "Uvicorn"
  - "деплой Python"
  - "Nginx reverse proxy"
  - "systemd"
heroImage: ./cover.webp
---

FastAPI — быстрый способ поднять API. На VPS деплой занимает один вечер.

---

## Минимальное приложение

```python
# main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/health")
def health():
    return {"status": "ok"}
```

---

## Uvicorn как сервис

```bash
pip install fastapi uvicorn gunicorn
```

```ini
# /etc/systemd/system/fastapi.service
[Unit]
Description=FastAPI App
After=network.target

[Service]
User=deploy
WorkingDirectory=/var/www/app
ExecStart=/var/www/app/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable fastapi
sudo systemctl start fastapi
```

---

## Nginx reverse proxy

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## Production советы

- Используйте **venv** или Docker
- Gunicorn + Uvicorn workers для нагрузки: `gunicorn main:app -k uvicorn.workers.UvicornWorker`
- Не открывайте порт 8000 наружу — только через Nginx
- Добавьте PostgreSQL для данных

---

## Итог

FastAPI + systemd + Nginx — простой и надёжный стек для API на VPS. Полный гайд по серверу — [развернуть сайт на VPS](/blog/razvernut-sayt-na-vps-2026/).

VPS для API — [StormNet Cloud](https://stormnetcloud.com/).
