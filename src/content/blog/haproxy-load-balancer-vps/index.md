---
title: "HAProxy на VPS: балансировка нагрузки между серверами"
description: "Настройка HAProxy на VPS: round-robin, health checks, SSL termination, sticky sessions. Когда нужен load balancer перед приложением."
pubDate: 2026-07-03
category: DevOps
keywords:
  - "HAProxy VPS"
  - "балансировка нагрузки"
  - "load balancer"
  - "high availability"
  - "reverse proxy"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** HAProxy — load balancer перед несколькими backend-серверами. Один VPS с HAProxy распределяет трафик, проверяет health и терминирует SSL. Нужен при 2+ app-серверах.

Один [Nginx](/blog/nginx-ili-caddy/) справляется с reverse proxy. HAProxy — когда нужны продвинутые алгоритмы балансировки и health checks на уровне TCP/HTTP.

---

## Когда нужен HAProxy

- 2+ VPS с одинаковым приложением
- Zero-downtime при падении одного backend
- Sticky sessions для stateful apps
- TCP балансировка (PostgreSQL read replicas)

Не нужен для одного VPS — достаточно Nginx или [Traefik](/blog/traefik-reverse-proxy-vps/).

---

## Установка

```bash
sudo apt install haproxy -y
```

```cfg
# /etc/haproxy/haproxy.cfg
global
    maxconn 4096

defaults
    mode http
    timeout connect 5s
    timeout client 30s
    timeout server 30s
    option httplog

frontend web
    bind *:80
    bind *:443 ssl crt /etc/haproxy/certs/example.com.pem
    redirect scheme https if !{ ssl_fc }
    default_backend app_servers

backend app_servers
    balance roundrobin
    option httpchk GET /health
    server app1 10.0.0.2:8080 check
    server app2 10.0.0.3:8080 check
```

```bash
sudo systemctl restart haproxy
```

Связь между VPS — приватная сеть или [Tailscale](/blog/tailscale-vpn-vps/) / [WireGuard](/blog/wireguard-vpn-na-vps/).

---

## Health checks

```cfg
option httpchk GET /health HTTP/1.1\r\nHost:\ example.com
http-check expect status 200
```

Приложение должно отдавать /health — как в [Go](/blog/go-golang-deploy-vps/) или [FastAPI](/blog/fastapi-deploy-vps/) деплое.

---

## SSL termination

Объедините cert + key:

```bash
cat fullchain.pem privkey.pem > /etc/haproxy/certs/example.com.pem
```

Альтернатива — SSL на [Cloudflare](/blog/cloudflare-i-vps/) + HAProxy на HTTP внутри.

---

## Sticky sessions

```cfg
backend app_servers
    balance roundrobin
    cookie SERVERID insert indirect nocache
    server app1 10.0.0.2:8080 cookie s1 check
    server app2 10.0.0.3:8080 cookie s2 check
```

---

## Мониторинг

```cfg
listen stats
    bind 127.0.0.1:8404
    stats enable
    stats uri /stats
```

Метрики в [Prometheus](/blog/grafana-prometheus-vps/) через haproxy_exporter.

---

## HAProxy vs Nginx vs Traefik

| | HAProxy | Nginx | Traefik |
| --- | --- | --- | --- |
| Load balancing | Лучший | Хороший | Средний |
| Static files | Нет | Отлично | Нет |
| Docker discovery | Нет | Нет | Да |

---

## Итог

HAProxy — стандарт для балансировки между несколькими VPS. Один LB VPS + 2+ app VPS = отказоустойчивость без Kubernetes.

Несколько VPS — [StormNet Cloud](https://stormnetcloud.com/). Оркестрация — [k3s](/blog/k3s-klaster-na-vps/) или [Docker Swarm](/blog/docker-swarm-na-vps/).
