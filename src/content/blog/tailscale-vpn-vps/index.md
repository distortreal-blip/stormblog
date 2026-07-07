---
title: "Tailscale на VPS: mesh VPN без настройки WireGuard"
description: "Tailscale на VPS: доступ к серверам, subnet router, MagicDNS. Простая альтернатива ручному WireGuard для команды."
pubDate: 2026-07-11
updatedDate: 2026-07-13
category: Безопасность
keywords:
  - "Tailscale VPS"
  - "mesh VPN"
  - "WireGuard альтернатива"
  - "доступ к серверу"
  - "Tailscale subnet"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Tailscale — mesh VPN на базе WireGuard с автоматической настройкой. Установите на VPS одной командой — сервер в вашей приватной сети без ручных ключей [WireGuard](/blog/wireguard-vpn-na-vps/).

WireGuard мощный, но ручная настройка ключей на 10 устройствах утомляет. Tailscale — WireGuard + coordination server.

---

## Tailscale vs WireGuard vs OpenVPN

| | Tailscale | WireGuard (ручной) | OpenVPN |
| --- | --- | --- | --- |
| Настройка | 2 мин | 15–30 мин | 1+ час |
| Mesh | Да | Вручную | Нет |
| NAT traversal | Да | Сложно | Средне |
| Self-hosted coord | Headscale | — | — |

---

## Установка на VPS

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --authkey=tskey-auth-xxxxx
tailscale ip -4
```

Auth key — в панели Tailscale (one-time или reusable).

---

## Subnet router

Доступ ко всей внутренней сети VPS:

```bash
sudo tailscale up --advertise-routes=10.0.0.0/24 --authkey=...
```

В панели Tailscale — approve routes. Теперь [Portainer](/blog/portainer-docker-vps/), [Grafana](/blog/grafana-prometheus-vps/) доступны без публичных портов.

---

## MagicDNS

```bash
# Доступ по имени
curl http://prod-vps:8080/health
```

Вместо запоминания IP — имена в Tailscale network.

---

## ACL (безопасность)

В панели Tailscale — ACL кто к кому ходит:

```json
{
  "acls": [
    { "action": "accept", "src": ["group:dev"], "dst": ["tag:prod:22,443"] }
  ]
}
```

Дополняет [CrowdSec](/blog/crowdsec-zashchita-vps/) — Tailscale закрывает публичный доступ.

---

## Headscale (self-hosted)

Не хотите зависеть от Tailscale Inc.? Headscale — open-source coordination server на вашем VPS.

---

## Когда Tailscale, когда WireGuard

- **Tailscale** — команда, много устройств, быстрый старт
- **WireGuard** — полный контроль, один VPS-VPN, без сторонних серверов

---

## Итог

Tailscale — лучший UX для VPN на VPS. Subnet router + закрытые порты = безопасный доступ к [Coolify](/blog/coolify-na-vps/), [k3s](/blog/k3s-klaster-na-vps/) API.

VPS для VPN — [StormNet Cloud](https://stormnetcloud.com/). Ручной VPN — [WireGuard](/blog/wireguard-vpn-na-vps/).
