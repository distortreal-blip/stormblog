---
title: "Portainer на VPS: веб-UI для управления Docker"
description: "Установка Portainer на VPS: стеки, контейнеры, volumes, логи через браузер. Удобное управление Docker без CLI."
pubDate: 2026-07-04
category: Docker
keywords:
  - "Portainer VPS"
  - "Docker UI"
  - "управление контейнерами"
  - "Docker web"
  - "Portainer CE"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Portainer — веб-интерфейс для Docker. Установите CE-версию в контейнер, откройте через HTTPS — управляйте контейнерами, стеками и логами без SSH.

CLI Docker мощный, но для визуального контроля и быстрых действий Portainer экономит время — особенно на [нескольких VPS](/blog/docker-swarm-na-vps/).

---

## Portainer CE vs Business

| | CE (бесплатно) | Business |
| --- | --- | --- |
| Управление контейнерами | Да | Да |
| Swarm / K8s | Да | Расширено |
| RBAC | Базовый | Полный |
| Edge agents | Да | Да |

Для личного VPS и малых команд — **CE достаточно**.

---

## Установка

```bash
docker volume create portainer_data
docker run -d \
  -p 127.0.0.1:9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Доступ: SSH tunnel или Nginx reverse proxy + [SSL](/blog/ssl-letsencrypt-vps/).

---

## Nginx перед Portainer

```nginx
server {
    listen 443 ssl;
    server_name portainer.example.com;
    location / {
        proxy_pass https://127.0.0.1:9443;
        proxy_ssl_verify off;
    }
}
```

Ограничьте доступ по IP или [WireGuard VPN](/blog/wireguard-vpn-na-vps/).

---

## Управление стеками

Импортируйте docker-compose.yml через UI:
- Редактирование env variables
- Restart / update образов
- Просмотр логов в реальном времени

Удобно для [Grafana](/blog/grafana-prometheus-vps/), [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/), [MinIO](/blog/minio-s3-na-vps/).

---

## Несколько серверов (Edge)

Portainer Agent на удалённых VPS → единый dashboard. Полезно при [Docker Swarm](/blog/docker-swarm-na-vps/) или нескольких проектах.

---

## Безопасность

- **Никогда** не открывайте Portainer в интернет без auth + SSL
- Сильный пароль admin
- [CrowdSec](/blog/crowdsec-zashchita-vps/) + [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/)
- Регулярные обновления образа portainer

---

## Portainer vs Coolify vs CLI

| | Portainer | Coolify | Docker CLI |
| --- | --- | --- | --- |
| UI | Да | Да | Нет |
| Git deploy | Нет | Да | Нет |
| Контроль | Высокий | Средний | Максимальный |

[Coolify](/blog/coolify-na-vps/) для деплоя, Portainer для ops.

---

## RAM

Portainer сам ~50–100 MB. Закладывайте RAM под контейнеры, не под UI.

---

## Итог

Portainer — must-have для Docker на VPS, если не хотите жить в терминале. CE бесплатен и покрывает 95% задач.

VPS с Docker — [StormNet Cloud](https://stormnetcloud.com/). Старт с Docker — [Compose на VPS](/blog/docker-compose-vps/).
