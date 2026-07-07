---
title: "Docker Swarm на VPS: оркестрация без Kubernetes"
description: "Docker Swarm на VPS: когда имеет смысл, создание кластера, сервисы, rolling update, secrets. Альтернатива k3s для 2–3 серверов."
pubDate: 2026-07-09
updatedDate: 2026-07-13
category: Docker
keywords:
  - "Docker Swarm VPS"
  - "оркестрация Docker"
  - "Swarm vs Kubernetes"
  - "Docker cluster"
  - "rolling update"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Docker Swarm — встроенный оркестратор Docker для 2–5 VPS. Проще [Kubernetes/k3s](/blog/kubernetes-minikube-vps/), даёт rolling updates, service discovery и secrets. Имеет смысл при 2+ серверах; на одном VPS достаточно [Docker Compose](/blog/docker-compose-vps/).

Kubernetes моден, но для команды из двух человек и трёх микросервисов Swarm часто прагматичнее.

---

## Swarm vs Compose vs k3s

| | Compose | Swarm | k3s/K8s |
| --- | --- | --- | --- |
| Серверов | 1 | 2+ | 1+ |
| Сложность | Низкая | Средняя | Высокая |
| Rolling update | Нет | Да | Да |
| Экосистема | Большая | Умеренная | Огромная |

---

## Архитектура кластера

- **Manager node** — оркестрация (можно 1–3)
- **Worker nodes** — запуск контейнеров
- Минимум production: 1 manager + 1 worker на разных VPS

Связь между VPS — приватная сеть провайдера или [WireGuard mesh](/blog/wireguard-vpn-na-vps/).

---

## Инициализация Swarm

На manager:

```bash
docker swarm init --advertise-addr ВАШ_IP
# сохраните join token
```

На worker:

```bash
docker swarm join --token SWMTKN-... MANAGER_IP:2377
```

---

## Деплой сервиса

```yaml
# stack.yml
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    networks:
      - frontend

  api:
    image: myapi:latest
    deploy:
      replicas: 2
    networks:
      - frontend

networks:
  frontend:
    driver: overlay
```

```bash
docker stack deploy -c stack.yml myapp
docker service ls
docker service ps myapp_web
```

---

## Secrets и configs

```bash
echo "db_password" | docker secret create db_pass -
```

```yaml
services:
  api:
    secrets:
      - db_pass
secrets:
  db_pass:
    external: true
```

---

## Rolling update

```bash
docker service update --image myapi:v2 myapp_api
```

Swarm обновляет по одной реплике — zero-downtime при 2+ replicas.

---

## Ingress и SSL

Варианты:
- Nginx на manager как reverse proxy
- Traefik в Swarm mode с Let's Encrypt
- [Cloudflare](/blog/cloudflare-i-vps/) перед балансировщиком

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/).

---

## Мониторинг Swarm

```bash
docker node ls
docker service logs myapp_api
```

Централизованный стек — [Grafana + Prometheus](/blog/grafana-prometheus-vps/) + cAdvisor.

---

## Когда НЕ нужен Swarm

- Один VPS, один compose-файл
- Команда планирует K8s через 3 месяца — сразу [k3s](/blog/kubernetes-minikube-vps/)
- Нет опыта Docker — начните с [Compose](/blog/docker-compose-vps/)

---

## Итог

Docker Swarm — недооценённый вариант для 2–3 VPS: rolling updates, overlay network, secrets — без YAML-ада Kubernetes.

Несколько VPS — [StormNet Cloud](https://stormnetcloud.com/). IaC для серверов — [Terraform](/blog/terraform-vps-infrastruktura/).
