---
title: "Go на VPS: деплой бинарника без лишних зависимостей"
description: "Деплой Go-приложения на VPS: кросс-компиляция, systemd, Nginx, graceful shutdown. Минимальный RAM и максимальная скорость."
pubDate: 2026-07-10
category: Разработка
keywords:
  - "Go VPS"
  - "Golang deploy"
  - "Go binary"
  - "systemd Go"
  - "backend Go"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** скомпилируйте Go в статический бинарник, скопируйте на VPS, запустите через systemd. Nginx — для SSL и reverse proxy. Go потребляет 20–50 MB RAM — идеален для маленького VPS.

Go — лучший выбор, когда на [2 GB VPS](/blog/choose-vps/) нужно держать API, worker и Nginx одновременно. Сравните с [Node.js](/blog/nodejs-pm2-deploy/) (100+ MB на процесс).

---

## Почему Go на VPS

| | Go binary | Node.js | Python |
| --- | --- | --- | --- |
| RAM | 20–50 MB | 100–300 MB | 80–200 MB |
| Зависимости на сервере | Нет | Node + node_modules | Python + venv |
| Старт | Мгновенный | 1–3 сек | 1–2 сек |
| Кросс-компиляция | Да | Нет | Нет |

---

## Кросс-компиляция

```bash
# На dev-машине (Windows/macOS/Linux)
GOOS=linux GOARCH=amd64 go build -o app ./cmd/main.go
```

Скопируйте один файл:

```bash
scp app deploy@VPS:/opt/myapp/app
```

Никакого runtime на сервере — только бинарник.

---

## systemd unit

```ini
[Unit]
Description=Go API
After=network.target

[Service]
User=deploy
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/app
Restart=on-failure
RestartSec=5
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now go-api
```

См. [systemd на Linux](/blog/systemd-linux-servisy/).

---

## Nginx + SSL

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

[SSL Let's Encrypt](/blog/ssl-letsencrypt-vps/) + [Cloudflare](/blog/cloudflare-i-vps/) для CDN.

---

## Graceful shutdown

```go
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit
srv.Shutdown(context.WithTimeout(context.Background(), 10*time.Second))
```

При `systemctl restart` — zero dropped connections.

---

## Docker альтернатива

```dockerfile
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o app .

FROM scratch
COPY --from=builder /app/app /app
ENTRYPOINT ["/app"]
```

Образ ~10 MB — см. [multi-stage builds](/blog/docker-multi-stage-builds/).

---

## Мониторинг и логи

- Structured JSON logs → [journalctl](/blog/journalctl-logi-linux-vps/)
- Метрики — Prometheus /metrics endpoint
- Алерты — [Grafana](/blog/grafana-prometheus-vps/)

---

## RAM на VPS

| Нагрузка | RAM |
| --- | --- |
| API 1000 rps | 512 MB–1 GB |
| API + worker | 1–2 GB |
| Несколько сервисов | 2 GB |

Go позволяет отложить апгрейд VPS дольше, чем Node/Python.

---

## Итог

Go + VPS = один бинарник, systemd, Nginx. Минимум moving parts, максимум производительности на дешёвом сервере.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). Docker-вариант — [Compose](/blog/docker-compose-vps/).
