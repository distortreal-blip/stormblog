---
title: "Syncthing на VPS: синхронизация файлов без облака"
description: "Syncthing на VPS: P2P sync, always-on node, Docker, версионирование и конфликты. Альтернатива Dropbox без посредника."
pubDate: 2026-07-08
category: DevOps
keywords:
  - "Syncthing VPS"
  - "P2P sync"
  - "Dropbox alternative"
  - "синхронизация файлов"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Syncthing — децентрализованная синхронизация файлов device-to-device. VPS как always-on relay/node: Docker + [SSL GUI](/blog/ssl-letsencrypt-vps/) + [backup](/blog/backup-vps-3-2-1/) конфигурации.

Не хотите, чтобы файлы проходили через Dropbox/Google? Syncthing шифрует in transit, вы контролируете topology. [Nextcloud](/blog/nextcloud-oblako-vps/) — облако с UI; Syncthing — прямая sync папок.

---

## Syncthing vs Nextcloud vs rsync

| | Syncthing | [Nextcloud](/blog/nextcloud-oblako-vps/) | rsync + cron |
| --- | --- | --- | --- |
| Real-time sync | Да | Да | Нет (scheduled) |
| P2P | Да | Client-server | SSH one-way |
| Mobile app | Syncthing app | Nextcloud app | Нет |
| Conflict handling | Version vectors | Locking | Manual |
| VPS роль | Relay / always-on | Full server | Destination |

Часто используют вместе: Syncthing для dev-папок, Nextcloud для sharing с клиентами.

---

## Архитектура

```
Laptop ←——P2P encrypted——→ VPS (always-on node)
   ↕                           ↕
Phone                    Home NAS / second VPS
```

VPS не хранит ключи расшифровки содержимого — только relay или replica encrypted data.

---

## Требования к VPS

| Роль | RAM | Диск | Трафик |
| --- | --- | --- | --- |
| Relay only | 256 MB | 1 GB | Low |
| Always-on replica | 512 MB–1 GB | = sync folder size | Medium |
| Central hub (3+ devices) | 1 GB | Large SSD | High |

Relay не требует большого диска — только bandwidth.

---

## Docker Compose

```yaml
services:
  syncthing:
    image: syncthing/syncthing:latest
    restart: unless-stopped
    hostname: vps-sync
    environment:
      STGUIADDRESS: 0.0.0.0:8384
    volumes:
      - ./st-config:/var/syncthing/config
      - ./sync:/var/syncthing/data
    ports:
      - "22000:22000/tcp"
      - "22000:22000/udp"
      - "21027:21027/udp"
      - "127.0.0.1:8384:8384"
```

GUI — только через [Nginx reverse proxy](/blog/nginx-ili-caddy/) + auth.

---

## Первоначальная настройка

1. Откройте GUI `https://sync.example.com`
2. **Actions → Settings → GUI** — strong user/password
3. **Settings → Connections** — device ID вашего VPS
4. На laptop/phone: Add Remote Device → paste VPS device ID
5. Share folder → Send & Receive или Send Only

---

## Folder types

| Тип | Когда |
| --- | --- |
| Send & Receive | Двусторонняя sync |
| Send Only | VPS backup hub (phone → VPS only) |
| Receive Only | VPS collects from team |
| Ignore patterns | Exclude node_modules, .git |

**Send Only на VPS** — идеальный mobile backup без accidental delete propagation.

---

## Версионирование и конфликты

- **Settings → Folders → File Versioning** — Simple или Staggered
- Конфликты → `.sync-conflict-*` файлы — resolve manually
- **Ignore Delete** — защита от mass delete на одном device

---

## Relay vs direct connection

Syncthing предпочитает direct P2P. VPS помогает когда:

- Devices за NAT без port forward
- Need always-online copy
- [Tailscale](/blog/tailscale-vpn-vps/) mesh — direct without public relay

```yaml
# Syncthing через Tailscale — disable public discovery
<connectionPriorityTcpLan>10</connectionPriorityTcpLan>
```

---

## Безопасность

| Пункт | Действие |
| --- | --- |
| GUI auth | User/password, не public без auth |
| Device IDs | Approve only known devices |
| TLS GUI | [Let's Encrypt](/blog/ssl-letsencrypt-vps/) |
| Firewall | [nftables](/blog/nftables-firewall-vps/) — 22000 only if needed |
| Introducer | Off unless trust all devices |

---

## Backup конфигурации

```bash
tar czf syncthing-config-$(date +%F).tar.gz ./st-config/
```

Папка `sync/` — backup через [Restic](/blog/restic-backup-vps/) если VPS = replica hub.

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| Out of sync | Check folder errors, rescan, restart |
| Slow sync | Direct connection? Relay overhead |
| High CPU | Many small files, scan interval |
| Device disconnected | Firewall UDP 21027, NAT |
| Conflict storm | Send Only on one side, versioning |

---

## Use cases

- **Dev configs** — dotfiles, scripts между machines
- **Photo backup** — phone Send Only → VPS (или [Immich](/blog/immich-foto-bekap-vps/) для gallery UX)
- **Offsite replica** — VPS EU + NAS home
- **Team shared folder** — Receive Only VPS + Send from team laptops

---

## Итог

Syncthing — лучший P2P sync без vendor lock-in. VPS как always-on node решает «ноутбук был offline».

VPS 1 GB — [StormNet Cloud](https://stormnetcloud.com/). Для облака с sharing — [Nextcloud](/blog/nextcloud-oblako-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/).
