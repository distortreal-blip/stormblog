---
title: "AdGuard Home на VPS: DNS-фильтрация и блокировка рекламы в сети"
description: "AdGuard Home на VPS: Docker, DoH/DoT, blocklists, parental control и интеграция с домашним роутером. Ad blocking на уровне DNS."
pubDate: 2026-07-08
category: DevOps
keywords:
  - "AdGuard Home VPS"
  - "DNS filtering"
  - "блокировка рекламы"
  - "Pi-hole alternative"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** AdGuard Home — DNS-сервер с фильтрацией рекламы, trackers и malware domains. VPS 512 MB–1 GB: Docker + upstream DoH + [SSL admin UI](/blog/ssl-letsencrypt-vps/). Роутер → VPS DNS = ad-free на всех устройствах.

Pi-hole устаревает в UX? AdGuard Home — современный UI, DoH/DoT out of box, parental schedules. VPS как central DNS для home + [Tailscale](/blog/tailscale-vpn-vps/) devices.

---

## AdGuard Home vs Pi-hole vs NextDNS

| | AdGuard Home | Pi-hole | NextDNS |
| --- | --- | --- | --- |
| Self-hosted | Да | Да | SaaS |
| DoH/DoT server | Да | Plugins | Да |
| UI | Modern | Classic | Web |
| RAM | 512 MB | 512 MB | N/A |
| Cost | VPS | VPS | Free tier limited |

---

## Архитектура

```
Devices (phone, TV, laptop)
        ↓ DNS queries :53 or DoH
   AdGuard Home on VPS
        ↓ filtered upstream
   Cloudflare 1.1.1.1 / Quad9 DoH
```

VPS должен быть **stable IP** — домашний роутер указывает на него как DNS.

---

## Требования к VPS

| Сценарий | RAM | Трафик |
| --- | --- | --- |
| Семья 5–10 devices | 512 MB | ~1 GB/мес DNS |
| 50 queries/sec | 1 GB | Low bandwidth |
| Public resolver (не рекомендуется) | 2 GB+ | DDoS risk |

DNS lightweight — но latency matters. VPS ближе к пользователям geographically.

---

## Docker Compose

```yaml
services:
  adguard:
    image: adguard/adguardhome:latest
    restart: unless-stopped
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "853:853/tcp"   # DoT
      - "784:784/udp"   # DNS-over-QUIC optional
      - "127.0.0.1:3000:3000"  # initial setup
      - "127.0.0.1:8080:80"    # admin after setup
    volumes:
      - ./adguard/work:/opt/adguardhome/work
      - ./adguard/conf:/opt/adguardhome/conf
```

Port 53 на VPS — может конфликтовать с systemd-resolved. Disable stub:

```bash
sudo systemctl disable systemd-resolved
# or change AdGuard to 5353 and DNAT from router
```

---

## Первоначальная setup wizard

1. `http://VPS_IP:3000` — create admin
2. Port 53 DNS — confirm
3. Upstream: `https://dns.cloudflare.com/dns-query` (DoH)
4. Blocklists: AdGuard DNS filter + OISD + Steven Black
5. Admin UI move to port 80 behind [Nginx](/blog/nginx-ili-caddy/)

---

## Настройка домашнего роутера

| Router | Setting |
| --- | --- |
| DHCP DNS | Primary: VPS_IP, Secondary: 1.1.1.1 fallback |
| Custom DNS | Disable ISP DNS |
| DoH on router | Point to AdGuard DoH URL if supported |

Verify: `nslookup doubleclick.net` → 0.0.0.0 or NXDOMAIN.

---

## DoH / DoT для mobile

**AdGuard Home → Settings → Encryption settings**

- Enable HTTPS, upload [Let's Encrypt](/blog/ssl-letsencrypt-vps/) certs
- DoH: `https://dns.example.com/dns-query`
- Android Private DNS: `dns.example.com`
- iOS: AdGuard app or DNS profile

---

## Custom filtering rules

```
||tracker.example.com^
@@||allowlist.example.com^
|https://ads.example.com^$important
```

- **Block** social trackers on smart TV
- **Allow** bank domains (avoid false positives)
- **Schedule** — parental control evening block

---

## Query log и analytics

Dashboard показывает:

- Top blocked domains
- Top clients
- Query types (A, AAAA, HTTPS SVCB)

Privacy: disable query log retention if GDPR concern, or rotate logs.

---

## Tailscale integration

AdGuard слушает на Tailscale IP — DNS для mesh network без public exposure:

```
Listen on: 100.x.x.x (Tailscale)
```

[WireGuard](/blog/wireguard-vpn-na-vps/) alternative — same pattern.

---

## Безопасность

| Риск | Mitigation |
| --- | --- |
| Open resolver abuse | Allow only your IPs in Access settings |
| DNS amplification | Rate limit, [nftables](/blog/nftables-firewall-vps/) |
| Admin brute force | Strong password, VPN-only admin |
| VPS compromise | DNS MITM — monitor, 2FA admin |

**Never run open public DNS** without rate limits — abuse for DDoS.

---

## Failover

VPS down = no DNS = no internet at home.

| Strategy | Setup |
| --- | --- |
| Secondary DNS | Router: VPS + 1.1.1.1 (ads pass on fallback) |
| Local AdGuard | Raspberry Pi primary, VPS secondary |
| Health check | [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) ping VPS:53 |

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| Some ads pass | HTTPS ads need browser extension too |
| Broken sites | Query log → unblock, custom allow |
| Slow pages | Upstream DoH latency — switch upstream |
| Port 53 in use | systemd-resolved, stop or remap |
| IPv6 leaks | Enable IPv6 in AdGuard + block AAAA or filter v6 |

---

## Связка с экосистемой

- VPN mesh — [Tailscale](/blog/tailscale-vpn-vps/)
- Monitoring — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)
- Firewall — [nftables](/blog/nftables-firewall-vps/)
- Logs — [Loki](/blog/loki-grafana-logi-vps/) if shipping query logs

---

## Итог

AdGuard Home на VPS — один DNS для всей сети: реклама, trackers, malware domains off. Minimal RAM, maximum comfort.

VPS 1 GB EU — [StormNet Cloud](https://stormnetcloud.com/). Безопасный доступ — [Tailscale](/blog/tailscale-vpn-vps/). Мониторинг — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).
