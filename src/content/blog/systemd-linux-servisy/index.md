---
title: "Systemd на Linux: автозапуск и управление сервисами на VPS"
description: "Гайд по systemd: unit-файлы, systemctl, journalctl. Как настроить автозапуск приложения, Nginx и бота на VPS."
pubDate: 2026-07-07
category: Linux
keywords:
  - "systemd"
  - "systemctl"
  - "Linux VPS"
  - "автозапуск"
  - "journalctl"
  - "сервисы"
heroImage: ./cover.webp
---

На современном Linux всё крутится вокруг systemd. Понимание unit-файлов — must-have для VPS.

---

## Основные команды

```bash
sudo systemctl start myapp
sudo systemctl stop myapp
sudo systemctl restart myapp
sudo systemctl enable myapp    # автозапуск
sudo systemctl status myapp
```

Логи:

```bash
journalctl -u myapp -f
journalctl -u myapp --since "1 hour ago"
```

---

## Структура unit-файла

```ini
[Unit]
Description=My Application
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/myapp
ExecStart=/var/www/myapp/start.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Файл: `/etc/systemd/system/myapp.service`

```bash
sudo systemctl daemon-reload
sudo systemctl enable myapp
```

---

## Типичные ошибки

**Restart loop** — приложение падает сразу. Смотрите `journalctl -u myapp -n 50`.

**Permission denied** — неверный User или права на файлы.

**Забыли daemon-reload** — после изменения unit-файла обязательно.

---

## Systemd vs cron

| | systemd timer | cron |
| --- | --- | --- |
| Логи | journalctl | mail/файлы |
| Зависимости | Да | Нет |
| Точность | Секунды | Минуты |

---

## Итог

Systemd — стандарт для сервисов на VPS. Каждое приложение = unit-файл + enable. Деплой бота — [Telegram-бот на VPS](/blog/telegram-bot-vps/).
