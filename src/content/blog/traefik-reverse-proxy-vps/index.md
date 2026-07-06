---
title: "Traefik на VPS: reverse proxy с автоматическим SSL"
description: "Настройка Traefik на VPS: маршрутизация, Let's Encrypt, Docker labels, middleware. Альтернатива Nginx и Caddy для микросервисов."
pubDate: 2026-07-10
category: DevOps
keywords:
  - "Traefik VPS"
  - "reverse proxy"
  - "авто SSL"
  - "Docker Traefik"
  - "маршрутизация"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Traefik — reverse proxy с автоматическим SSL и discovery через Docker labels. Поднимите контейнер Traefik, укажите домены в labels — сертификаты и маршруты создаются сами.

Если устали вручную править конфиг Nginx при каждом новом сервисе — Traefik решает это декларативно. Сравнение с [Nginx и Caddy](/blog/nginx-ili-caddy/) — в конце статьи.

---

## Когда Traefik, а не Nginx

| Сценарий | Traefik | Nginx |
| --- | --- | --- |
| 5+ микросервисов в Docker | Отлично | Много ручных конфигов |
| Один сайт + API | Избыточен | Проще |
| Авто SSL для новых доменов | Из коробки | certbot + reload |
| Kubernetes / Swarm | Нативно | Нужен ingress controller |

Traefik идеален рядом с [Docker Compose](/blog/docker-compose-vps/) и [Docker Swarm](/blog/docker-swarm-na-vps/).

---

## Минимальный docker-compose

```yaml
services:
  traefik:
    image: traefik:v3.0
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.le.acme.httpchallenge=true
      - --certificatesresolvers.le.acme.httpchallenge.entrypoint=web
      - --certificatesresolvers.le.acme.email=admin@example.com
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_certs:/letsencrypt
    restart: unless-stopped

volumes:
  traefik_certs:
```

---

## Подключение приложения через labels

```yaml
services:
  api:
    image: myapi:latest
    labels:
      - traefik.enable=true
      - traefik.http.routers.api.rule=Host(`api.example.com`)
      - traefik.http.routers.api.entrypoints=websecure
      - traefik.http.routers.api.tls.certresolver=le
      - traefik.http.services.api.loadbalancer.server.port=8080
```

Traefik подхватит контейнер автоматически — без reload.

---

## Middleware: rate limit, auth, redirect

```yaml
labels:
  - traefik.http.middlewares.ratelimit.ratelimit.average=100
  - traefik.http.routers.api.middlewares=ratelimit
```

Для базовой auth — basicAuth middleware. Для DDoS — связка с [Cloudflare](/blog/cloudflare-i-vps/) и [CrowdSec](/blog/crowdsec-zashchita-vps/).

---

## Dashboard Traefik

```yaml
labels:
  - traefik.http.routers.dashboard.rule=Host(`traefik.example.com`)
  - traefik.http.routers.dashboard.service=api@internal
  - traefik.http.routers.dashboard.middlewares=auth
```

**Не публикуйте dashboard без auth** — только HTTPS + basicAuth или VPN ([WireGuard](/blog/wireguard-vpn-na-vps/)).

---

## RAM и production

| Нагрузка | RAM |
| --- | --- |
| 2–5 сервисов | 512 MB |
| 10+ сервисов | 1 GB |
| High traffic | 2 GB + CDN |

Мониторинг — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) + [Grafana](/blog/grafana-prometheus-vps/).

---

## Traefik vs Caddy vs Nginx

| | Traefik | Caddy | Nginx |
| --- | --- | --- | --- |
| Docker discovery | Да | Нет (нужен caddy-docker-proxy) | Нет |
| Конфиг | Labels/YAML | Caddyfile | nginx.conf |
| Сложность | Средняя | Низкая | Средняя |

---

## Итог

Traefik — лучший выбор для Docker-стека с часто меняющимися сервисами. Один раз настроили — добавляете контейнеры labels'ами.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Базовый деплой — [развернуть сайт на VPS](/blog/razvernut-sayt-na-vps-2026/).
