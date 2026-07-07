---
title: "Fail2ban на VPS: защита от брутфорса SSH и веб-атак"
description: "Настройка Fail2ban на Ubuntu VPS: jail для SSH, Nginx, защита от брутфорса, whitelist IP, уведомления. Пошаговый гайд с конфигами."
pubDate: 2026-07-05
category: Безопасность
keywords:
  - "Fail2ban VPS"
  - "защита SSH"
  - "брутфорс"
  - "безопасность сервера"
  - "Nginx fail2ban"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Fail2ban анализирует логи и временно банит IP после серии неудачных попыток входа. На VPS установите пакет, включите jail для SSH и Nginx, задайте bantime и whitelist для своего IP.

Если VPS в интернете — брутфорс SSH начинается в первые минуты. Fail2ban — первый рубеж обороны после [базовой настройки Ubuntu](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).

---

## Как работает Fail2ban

1. Сервис (sshd, nginx) пишет неудачные попытки в лог
2. Fail2ban парсит лог по filter
3. При превышении maxretry — IP блокируется через iptables/nftables
4. После bantime бан снимается автоматически

Современная альтернатива с crowd intelligence — [CrowdSec](/blog/crowdsec-zashchita-vps/).

---

## Установка

```bash
sudo apt update
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

Не редактируйте `jail.conf` напрямую — создайте локальный override:

```bash
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

---

## Базовый jail.local

```ini
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
banaction = ufw
ignoreip = 127.0.0.1/8 ВАШ_СТАТИЧЕСКИЙ_IP

[sshd]
enabled = true
port    = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 24h
```

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status sshd
```

---

## Fail2ban для Nginx

Защита от сканирования и флуда:

```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

Перед этим настройте [Nginx rate limiting](/blog/nginx-logi-i-oshibki/) и [SSL](/blog/ssl-letsencrypt-vps/).

---

## Мониторинг банов

```bash
sudo fail2ban-client status
sudo fail2ban-client status sshd
sudo fail2ban-client set sshd unbanip 1.2.3.4
```

Логи:

```bash
sudo tail -f /var/log/fail2ban.log
```

Интегрируйте алерты с [Grafana](/blog/grafana-prometheus-vps/) или Telegram-ботом.

---

## Fail2ban vs CrowdSec vs только UFW

| Решение | Плюсы | Минусы |
| --- | --- | --- |
| UFW | Просто, быстро | Не реагирует на атаки |
| Fail2ban | Проверен годами, лёгкий | Только локальные логи |
| CrowdSec | Общая база угроз | Сложнее в настройке |

Для большинства VPS достаточно **UFW + Fail2ban**. CrowdSec — следующий уровень.

---

## Частые проблемы

**Заблокировали себя:** добавьте IP в `ignoreip`, разбаньте через `fail2ban-client set sshd unbanip`.

**Не банит:** проверьте logpath, права на логи, что sshd пишет в /var/log/auth.log.

**Конфликт с Cloudflare:** баньте реальный IP из заголовка CF-Connecting-IP — см. [Cloudflare + VPS](/blog/cloudflare-i-vps/).

---

## Итог

Fail2ban — обязательный слой для любого VPS с SSH. 15 минут настройки закрывают 90% автоматических атак.

VPS с защитой — [StormNet Cloud](https://stormnetcloud.com/). Полный hardening — [защита VPS](/blog/zashchita-vps-ot-vzloma/) + [WireGuard](/blog/wireguard-vpn-na-vps/) для админ-доступа.
