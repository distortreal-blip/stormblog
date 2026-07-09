---
title: "RustDesk на VPS: self-hosted удалённый рабочий стол вместо TeamViewer"
description: "RustDesk server (hbbs/hbbr) на VPS: Docker, ключи, клиенты Windows/Linux/macOS, Nginx, безопасность и troubleshooting. Приватная альтернатива TeamViewer и AnyDesk."
pubDate: 2026-07-03
category: DevOps
keywords:
  - "RustDesk VPS"
  - "remote desktop"
  - "TeamViewer alternative"
  - "self-hosted RDP"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** RustDesk — open-source remote desktop. Self-hosted relay на VPS 1 GB+: `hbbs` (ID/signaling) + `hbbr` (relay) в [Docker](/blog/docker-compose-vps/), свой ключ шифрования, клиенты указывают на ваш сервер. Без облака RustDesk и без лимитов TeamViewer.

TeamViewer дорогой и блокирует «личное использование», AnyDesk — чужие серверы. RustDesk на [вашем VPS](/blog/choose-vps/) — E2E encryption, полный контроль relay, бесплатно для команды и семьи.

---

## RustDesk vs TeamViewer vs AnyDesk vs RDP

| Критерий | RustDesk self-host | TeamViewer | AnyDesk | Raw RDP/SSH |
| --- | --- | --- | --- | --- |
| Self-hosted relay | Да | Нет | Нет | N/A |
| E2E encryption | Да | Да | Да | Varies |
| NAT traversal | Relay + hole punch | Cloud | Cloud | Port forward |
| Стоимость | VPS only | $50+/мес business | Freemium | Free |
| RAM server | 512 MB–1 GB | N/A | N/A | N/A |
| File transfer | Да | Да | Да | SCP/SFTP |
| Mobile client | Да | Да | Да | Limited |

RustDesk — optimal для IT support своей команды и личных машин.

---

## Архитектура

```
Client A (support)          Client B (remote PC)
        ↓                            ↓
        └──────────┬─────────────────┘
                   ↓
            hbbs (21115-21116-21118)
            ID registry + hole punching
                   ↓
            hbbr (21117)
            Relay when P2P fails
                   ↓
            Optional: Web UI / API
```

**hbbs** — rendezvous server. **hbbr** — relay для трафика когда прямое соединение невозможно (symmetric NAT, corporate firewall).

---

## Требования к VPS

| Сценарий | RAM | CPU | Bandwidth |
| --- | --- | --- | --- |
| Семья 2–5 устройств | 512 MB | 1 vCPU | 100 Mbps |
| IT support 20 устройств | 1 GB | 1 vCPU | 500 Mbps |
| Relay-heavy (no P2P) | 2 GB | 2 vCPU | 1 Gbps |

Порты на firewall ([nftables](/blog/nftables-firewall-vps/)):
- TCP 21115–21117, 21119
- UDP 21116

---

## Docker Compose

```yaml
services:
  hbbs:
    image: rustdesk/rustdesk-server:latest
    container_name: hbbs
    command: hbbs -r rustdesk.example.com:21117
    volumes:
      - ./data:/root
    ports:
      - "21115:21115"
      - "21116:21116/udp"
      - "21118:21118"
    restart: unless-stopped
    depends_on:
      - hbbr

  hbbr:
    image: rustdesk/rustdesk-server:latest
    container_name: hbbr
    command: hbbr
    volumes:
      - ./data:/root
    ports:
      - "21117:21117"
    restart: unless-stopped
```

После старта: ключ в `./data/id_ed25519.pub` — **критично для клиентов**.

---

## Получение и распространение ключа

```bash
cat ./data/id_ed25519.pub
# Пример: xxxxx=  — одна строка base64
```

Этот ключ вставляется в **все клиенты** — гарантирует что они подключаются только к вашему серверу, не к публичному RustDesk infra.

Распространение:
- GPO / MDM для корпоративных ПК
- [BookStack](/blog/bookstack-wiki-vps/) wiki page
- QR code для мобильных

---

## Настройка клиентов

**Windows / Linux / macOS:**
1. Settings → Network → ID/Relay server
2. ID server: `rustdesk.example.com`
3. Relay server: `rustdesk.example.com`
4. Key: вставить `id_ed25519.pub` content
5. Apply → перезапуск клиента

**Android / iOS:** Settings → ID/Relay server → те же значения.

Проверка: статус «Ready» с вашим custom server, не «Ready» на public.

---

## Nginx (optional web console)

RustDesk Pro имеет web admin. Open-source — API limited. Для мониторинга портов:

```nginx
# Health check endpoint via custom script
server {
    listen 443 ssl;
    server_name rustdesk.example.com;
    location /health {
        return 200 "ok";
    }
}
```

Основной трафик — **не HTTP**, а proprietary protocol на 21115–21117. Nginx не проксирует desktop stream.

---

## Безопасность

| Уровень | Мера |
| --- | --- |
| Обязательно | Custom key на всех клиентах |
| Рекомендуется | [Tailscale](/blog/tailscale-vpn-vps/) + RustDesk только в mesh |
| Пароли | Strong permanent password на каждом хосте |
| 2FA | RustDesk Pro feature; OSS — password only |
| Firewall | Только нужные порты, geo-block если возможно |
| Updates | `docker compose pull` monthly |

**Никогда** не оставляйте unattended access без strong password. Отключайте «allow unattended» на критичных серверах.

---

## Unattended access (headless servers)

Для Linux servers без GUI — установите RustDesk + задайте fixed password:

```bash
# Linux headless
rustdesk --password "STRONG_RANDOM"
rustdesk --option allow-auto-record-input 0
```

Для production servers предпочтительнее [SSH](/blog/vscode-ssh-vps/) + [WireGuard](/blog/wireguard-vpn-na-vps/). RustDesk — для desktop support.

---

## Интеграция с Tailscale

Best practice: RustDesk relay на VPS, клиенты **также** в [Tailscale mesh](/blog/tailscale-vpn-vps/):

```
Tailscale IP direct → fastest path (no relay bandwidth)
Public relay VPS → fallback for devices outside mesh
```

Split: корпоративные машины — Tailscale only; семья — public relay с key.

---

## Backup

Бэкапить только `./data/` volume:
- `id_ed25519` (private key!)
- `id_ed25519.pub`
- Database (if Pro)

```bash
tar czf rustdesk-data-$(date +%F).tar.gz ./data/
```

Потеря private key = все клиенты нужно перенастроить. Храните в [Vaultwarden](/blog/vaultwarden-paroli-vps/) или [HashiCorp Vault](/blog/vault-secrets-vps/). Offsite — [Restic](/blog/restic-backup-vps/).

---

## Мониторинг

| Метрика | Как |
| --- | --- |
| Ports open | [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) TCP check 21116 |
| Relay bandwidth | `vnstat`, `iftop` на VPS |
| Container health | `docker compose ps`, restart policy |
| Active sessions | hbbr logs |

Alert при bandwidth spike — возможен abuse если ключ утёк.

---

## Performance tuning

- VPS geographically central для users (EU VPS для EU team)
- UDP 21116 не блокировать на intermediate firewalls
- 1 Gbps port на VPS для screen sharing 4K
- Client: hardware encoding H264 если доступно
- Disable wallpaper/effects на remote для low bandwidth

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| «Failed to connect to rendezvous» | DNS, firewall ports 21115-21116/udp |
| Relay works, P2P not | Normal behind symmetric NAT |
| Wrong key error | Re-copy id_ed25519.pub, no extra spaces |
| Slow/laggy | Use relay closer, reduce resolution, check bandwidth |
| ID not found | hbbs down, client wrong ID server address |
| Connection drops | UDP timeout — check firewall state |
| Linux headless black screen | Install desktop env or use Xvfb |
| Mobile not connecting | Background restrictions — disable battery opt |
| Key mismatch after update | Re-distribute pub key after data volume reset |
| High VPS bandwidth bill | Force Tailscale direct, limit relay users |

---

## Use cases

| Сценарий | Setup |
| --- | --- |
| Family tech support | 1 VPS, shared key, passwords per PC |
| Small IT team | VPS + [Authentik](/blog/authentik-sso-vps/) docs + inventory |
| Dev remote workstation | Unattended + strong password + Tailscale |
| Server GUI (legacy app) | RustDesk on X11 server — last resort |

---

## Связка с экосистемой

- VPN mesh — [Tailscale](/blog/tailscale-vpn-vps/), [WireGuard](/blog/wireguard-vpn-na-vps/)
- Secrets — [Vaultwarden](/blog/vaultwarden-paroli-vps/)
- Monitoring — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)
- Firewall — [nftables](/blog/nftables-firewall-vps/)
- Docker — [Docker Compose](/blog/docker-compose-vps/)

---

## Итог

RustDesk self-hosted — must-have для приватного remote desktop без абонентской платы TeamViewer. Минимальные ресурсы VPS, максимальный контроль.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). VPN fallback — [Tailscale](/blog/tailscale-vpn-vps/). Backup ключей — [3-2-1](/blog/backup-vps-3-2-1/).
