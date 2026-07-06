---
title: "CrowdSec на VPS: коллективная защита от атак"
description: "Установка CrowdSec на VPS: парсинг логов, community blocklist, bouncer для Nginx/UFW. Современная альтернатива Fail2ban с общей базой угроз."
pubDate: 2026-07-09
category: Безопасность
keywords:
  - "CrowdSec VPS"
  - "защита сервера"
  - "WAF self-hosted"
  - "блокировка IP"
  - "безопасность VPS"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** CrowdSec анализирует логи (SSH, Nginx, etc.) и блокирует IP через bouncers. Главное преимущество перед [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) — общая база атакующих IP от сообщества.

Один забаненный IP на тысячах серверов — блокируется у всех. CrowdSec — эволюция идеи Fail2ban для 2026 года.

---

## CrowdSec vs Fail2ban

| | CrowdSec | Fail2ban |
| --- | --- | --- |
| Community blocklist | Да | Нет |
| Сценарии (scenarios) | Гибкие YAML | jails + filters |
| Bouncers | Nginx, UFW, Cloudflare | iptables/ufw |
| Сложность | Выше | Ниже |
| RAM | ~100–200 MB | ~50 MB |

Можно использовать **оба**: Fail2ban для SSH, CrowdSec для веб и community list.

---

## Установка

```bash
curl -s https://install.crowdsec.net | sudo sh
sudo apt install crowdsec -y
sudo systemctl enable crowdsec
```

Установите коллекции:

```bash
sudo cscli collections install crowdsecurity/linux
sudo cscli collections install crowdsecurity/nginx
sudo cscli collections install crowdsecurity/sshd
```

---

## Bouncer для UFW

```bash
sudo apt install crowdsec-firewall-bouncer-iptables
sudo systemctl enable crowdsec-firewall-bouncer-iptables
```

Или Nginx bouncer для challenge/captcha при подозрительных запросах.

---

## Проверка работы

```bash
sudo cscli metrics
sudo cscli decisions list
sudo cscli alerts list
```

Симуляция атаки (с другого IP):

```bash
# Несколько неудачных SSH — должен появиться ban
```

---

## Интеграция с Nginx

```bash
sudo cscli collections install crowdsecurity/nginx
```

Убедитесь, что Nginx пишет access/error log в стандартные пути. См. [логи Nginx](/blog/nginx-logi-i-oshibki/).

С [Cloudflare](/blog/cloudflare-i-vps/) — используйте bouncer для Cloudflare или парсите реальный IP.

---

## CrowdSec Console (опционально)

Бесплатная cloud-консоль на app.crowdsec.net — централизованный дашборд для нескольких VPS. Удобно при 3+ серверах.

---

## Whitelist

```bash
sudo cscli parsers install crowdsecurity/whitelists
# Добавьте свой IP в /etc/crowdsec/parsers/s02-enrich/whitelists.yaml
```

Обязательно whitelist офисный IP и CI/CD runners — [GitLab Runner](/blog/gitlab-runner-cicd-vps/).

---

## Производительность

CrowdSec легче SIEM вроде ELK. На VPS 1 GB RAM работает, но комфортнее 2 GB при Nginx + app + CrowdSec.

Мониторинг — [Grafana](/blog/grafana-prometheus-vps/) или [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).

---

## Полный стек безопасности VPS

1. [Первая настройка Ubuntu](/blog/ubuntu-24-04-pervaya-nastroyka-vps/) — SSH keys, UFW
2. [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) или CrowdSec для SSH
3. CrowdSec community blocklist
4. [SSL](/blog/ssl-letsencrypt-vps/) + [Cloudflare](/blog/cloudflare-i-vps/)
5. [WireGuard](/blog/wireguard-vpn-na-vps/) для админки
6. [Бэкапы 3-2-1](/blog/backup-vps-3-2-1/)

---

## Итог

CrowdSec — следующий уровень после Fail2ban: community intelligence, гибкие сценарии, bouncers под любой стек.

VPS для production — [StormNet Cloud](https://stormnetcloud.com/). Базовый hardening — [защита VPS от взлома](/blog/zashchita-vps-ot-vzloma/).
