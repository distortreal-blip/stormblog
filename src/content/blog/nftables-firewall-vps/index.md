---
title: "nftables на VPS: современный firewall вместо iptables"
description: "Настройка nftables на Linux VPS: базовые правила, SSH, HTTP/HTTPS, rate limit. Замена UFW и iptables в 2026."
pubDate: 2026-07-01
category: DevOps
keywords:
  - "nftables VPS"
  - "firewall Linux"
  - "iptables замена"
  - "защита VPS"
  - "rate limit SSH"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** nftables — наследник iptables в ядре Linux. Один синтаксис, таблицы inet, встроенный set для блокировок. На свежем [Ubuntu 24.04](/blog/ubuntu-24-04-pervaya-nastroyka-vps/) и [Debian 12](/blog/debian-12-pervaya-nastroyka-vps/) — default.

UFW — обёртка над iptables/nftables. Понимание nftables даёт контроль: rate limit SSH, geo-блок (опционально), интеграция с [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) и [CrowdSec](/blog/crowdsec-zashchita-vps/).

---

## UFW vs nftables

| | UFW | nftables |
| --- | --- | --- |
| Простота | Высокая | Средняя |
| Rate limit | Сложно | natively |
| Sets / блок-листы | Ограничено | Да |
| Debian 12 default | nft backend | Да |

Для новичка — UFW из [гайда по защите](/blog/zashchita-vps-ot-vzloma/). Для production — nftables ruleset в git.

---

## Базовый ruleset

```nft
#!/usr/sbin/nft -f
flush ruleset

table inet filter {
  set blocked_ips {
    type ipv4_addr
    flags timeout
    timeout 1h
  }

  chain input {
    type filter hook input priority filter; policy drop;

    iif "lo" accept
    ct state established,related accept
    ip protocol icmp accept
    ip6 nexthdr icmpv6 accept

    tcp dport 22 ct state new limit rate over 6/minute add @blocked_ips { ip saddr } drop
    tcp dport { 22, 80, 443 } accept
  }

  chain forward {
    type filter hook forward priority filter; policy drop;
  }

  chain output {
    type filter hook output priority filter; policy accept;
  }
}
```

```bash
sudo nft -f /etc/nftables.conf
sudo systemctl enable nftables
```

**Важно:** перед `policy drop` держите вторую SSH-сессию открытой.

---

## Разрешить Docker

Docker манипулирует iptables/nftables. При [Docker Compose](/blog/docker-compose-vps/) добавьте:

```nft
chain input {
  # ... existing rules ...
  iifname "docker0" accept
}
```

Или используйте `docker run --network host` только где нужно. [Traefik](/blog/traefik-reverse-proxy-vps/) слушает 80/443 на хосте.

---

## Fail2ban + nftables

```ini
# /etc/fail2ban/jail.local
[sshd]
banaction = nftables-multiport
```

CrowdSec bouncer тоже поддерживает nftables — см. [CrowdSec](/blog/crowdsec-zashchita-vps/).

---

## Логирование dropped

```nft
chain input {
  counter drop
}
```

```bash
journalctl -k | grep nft
```

Централизация — [journalctl](/blog/journalctl-logi-linux-vps/) и [Loki](/blog/loki-grafana-logi-vps/).

---

## IPv6

```nft
table inet filter {
  chain input {
    tcp dport { 22, 80, 443 } accept
  }
}
```

`inet` покрывает IPv4 и IPv6 одной таблицей — проще чем отдельные ip/ip6 tables в iptables.

---

## Чеклист безопасности VPS

1. nftables: drop by default, только 22/80/443
2. SSH: ключи, PermitRootLogin no
3. [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/)
4. [Автообновления](/blog/ubuntu-24-04-pervaya-nastroyka-vps/) security
5. [VPN admin](/blog/tailscale-vpn-vps/) вместо открытого SSH (опционально)

---

## Итог

nftables — стандарт firewall на Linux VPS в 2026. Один конфиг в git, rate limit SSH, интеграция с Fail2ban — база перед деплоем приложений.

VPS — [StormNet Cloud](https://stormnetcloud.com/). Полный чеклист — [защита VPS](/blog/zashchita-vps-ot-vzloma/). Мониторинг атак — [CrowdSec](/blog/crowdsec-zashchita-vps/).
