---
title: "Podman rootless на VPS: контейнеры без Docker daemon"
description: "Podman на VPS: rootless-контейнеры, podman-compose, systemd user units. Безопасная альтернатива Docker для одного сервера."
pubDate: 2026-07-03
category: Docker
keywords:
  - "Podman VPS"
  - "rootless containers"
  - "Docker альтернатива"
  - "podman-compose"
  - "containerd"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Podman запускает OCI-контейнеры без фонового daemon. Rootless-режим — контейнеры от обычного пользователя, меньше attack surface чем Docker socket.

На shared VPS или когда не хотите отдавать root Docker — Podman + [systemd user](/blog/systemd-linux-servisy/) = production-ready для одного приложения.

---

## Podman vs Docker

| | Podman | Docker |
| --- | --- | --- |
| Daemon | Нет | dockerd |
| Rootless | Из коробки | Возможен, сложнее |
| docker-compose | podman-compose / compose | Да |
| Kubernetes | pods natively | через k8s |

Миграция с [Docker Compose](/blog/docker-compose-vps/) — часто достаточно заменить `docker` на `podman`.

---

## Установка (Ubuntu/Debian)

```bash
sudo apt install podman podman-compose -y
podman --version
```

Rocky/RHEL:

```bash
sudo dnf install podman podman-compose -y
```

---

## Rootless setup

```bash
# От пользователя deploy (не root)
podman info --format '{{.Host.Security.Rootless}}'
```

Если `false`, настройте subuid/subgid:

```bash
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 deploy
```

Перелогиньтесь.

---

## Первый контейнер

```bash
podman run -d --name web -p 8080:80 docker.io/nginx:alpine
curl localhost:8080
```

---

## podman-compose

```yaml
# compose.yml
services:
  app:
    image: docker.io/library/nginx:alpine
    ports:
      - "8080:80"
```

```bash
podman-compose up -d
```

Reverse proxy — [Nginx](/blog/nginx-ili-caddy/) или [Traefik](/blog/traefik-reverse-proxy-vps/) на хосте.

---

## Автозапуск через systemd user

```bash
podman generate systemd --name web --files --new
mkdir -p ~/.config/systemd/user
mv container-web.service ~/.config/systemd/user/
systemctl --user enable --now container-web.service
loginctl enable-linger deploy
```

`enable-linger` — контейнеры стартуют после reboot без login session.

---

## Безопасность

- Не давайте доступ к Docker socket на prod — Podman rootless решает это
- Обновляйте образы: `podman pull` + restart
- Сеть — [nftables](/blog/nftables-firewall-vps/), только 80/443 снаружи

---

## Итог

Podman rootless на VPS — контейнеры без daemon и без root. Идеален для solo-dev и одного стека приложений.

VPS 1 GB+ — [StormNet Cloud](https://stormnetcloud.com/). UI — [Portainer](/blog/portainer-docker-vps/) (Docker). Оркестрация — [k3s](/blog/k3s-klaster-na-vps/).
