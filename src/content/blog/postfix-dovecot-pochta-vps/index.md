---
title: "Postfix + Dovecot на VPS: свой почтовый сервер"
description: "Настройка почты на VPS: Postfix SMTP, Dovecot IMAP, SPF, DKIM, DMARC. Когда нужен свой mail и как не попасть в spam."
pubDate: 2026-07-13
category: DevOps
keywords:
  - "Postfix VPS"
  - "Dovecot IMAP"
  - "свой mail сервер"
  - "SPF DKIM DMARC"
  - "почта на VPS"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Postfix принимает и отправляет SMTP, Dovecot отдаёт IMAP. На VPS нужны reverse DNS, SPF/DKIM/DMARC и репутация IP — иначе письма в spam.

Transactional mail (регистрация, сброс пароля) с приложения — частый кейс. SaaS (SendGrid, Mailgun) проще, но свой Postfix даёт контроль и нулевую абонплату за объём.

---

## Когда свой mail на VPS — плохая идея

- Массовые рассылки → используйте ESP
- Shared IP без rDNS → 90% в spam
- Нет времени на DMARC/DKIM → лучше SaaS

Когда OK: 10–500 писем/день, свой домен, чистый IP, [Debian/Ubuntu](/blog/debian-12-pervaya-nastroyka-vps/) с [базовой защитой](/blog/zashchita-vps-ot-vzloma/).

---

## Стек

```
Internet → Postfix :25/:587 → Dovecot :993 (IMAP)
                ↓
           Maildir /var/mail/vhosts/
```

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Firewall — [nftables](/blog/nftables-firewall-vps/) или UFW: 25, 587, 993.

---

## Установка (Debian/Ubuntu)

```bash
sudo apt install postfix dovecot-imapd dovecot-lmtpd opendkim opendkim-tools -y
# Postfix: Internet Site, mail.example.com
```

Virtual domains в `/etc/postfix/main.cf`:

```
myhostname = mail.example.com
mydomain = example.com
myorigin = $mydomain
inet_interfaces = all
mydestination = localhost
virtual_mailbox_domains = example.com
virtual_mailbox_base = /var/mail/vhosts
virtual_mailbox_maps = hash:/etc/postfix/vmailbox
```

---

## DKIM + SPF + DMARC

**SPF** — TXT у домена:

```
v=spf1 mx ip4:YOUR_VPS_IP -all
```

**DKIM** — opendkim генерирует ключ, TXT `default._domainkey`.

**DMARC** — TXT `_dmarc.example.com`:

```
v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com
```

Проверка: mail-tester.com после настройки.

---

## Reverse DNS (PTR)

У провайдера VPS PTR для IP → `mail.example.com`. Без rDNS Gmail часто отклоняет. У [StormNet Cloud](https://stormnetcloud.com/) настройте в панели.

---

## Dovecot IMAP

```
# /etc/dovecot/conf.d/10-mail.conf
mail_location = maildir:/var/mail/vhosts/%d/%n
```

Клиент: Thunderbird, Apple Mail. Webmail — Roundcube (опционально).

---

## Мониторинг очереди

```bash
mailq
postqueue -p
journalctl -u postfix -f
```

Алерты — [Prometheus](/blog/grafana-prometheus-vps/) или [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) на порт 25.

---

## Итог

Свой mail на VPS реален для transactional и малого объёма. PTR + DKIM + DMARC обязательны. Для marketing — ESP, не Postfix.

VPS с чистым IP — [StormNet Cloud](https://stormnetcloud.com/). DNS — [Cloudflare](/blog/cloudflare-i-vps/). Защита — [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/).
