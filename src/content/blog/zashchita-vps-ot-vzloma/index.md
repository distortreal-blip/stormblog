---
title: "Как защитить VPS от взлома: чек-лист безопасности 2026"
description: "Пошаговая защита VPS: SSH-ключи, UFW, fail2ban, отключение root, автообновления. Что делают боты и как от них закрыться."
pubDate: 2026-07-07
category: Безопасность
keywords:
  - "безопасность VPS"
  - "защита сервера"
  - "fail2ban"
  - "SSH"
  - "брутфорс"
  - "Storm Cloud"
heroImage: ./cover.webp
---

Новый VPS в интернете получает первые сканирования в течение **минут**. Без базовой защиты — компрометация за часы.

---

## Что атакуют боты в первую очередь

1. SSH (порт 22) — brute-force паролей
2. Слабые пароли панелей
3. Открытые Redis/MongoDB без пароля
4. Устаревшие версии ПО с CVE

---

## Чек-лист за 30 минут

### 1. SSH только по ключу

```bash
# /etc/ssh/sshd_config
PasswordAuthentication no
PermitRootLogin prohibit-password
```

```bash
sudo systemctl restart sshd
```

### 2. Firewall

```bash
sudo ufw default deny incoming
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3. fail2ban

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

### 4. Автообновления

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 5. Отдельный пользователь

Не работайте под root. См. [первые шаги после запуска VPS](/blog/vps-first-steps/).

---

## Дополнительно

- Смените SSH-порт (спорно, но снижает шум)
- Настройте 2FA для панели провайдера
- Регулярные бэкапы
- Мониторинг failed login attempts

---

## Итог

Безопасность VPS — не разовая задача. Минимальный чек-лист выше закрывает 90% автоматических атак. Для тестов безопасности — [почасовой VPS](https://stormnetcloud.com/).
