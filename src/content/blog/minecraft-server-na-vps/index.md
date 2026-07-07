---
title: "Minecraft-сервер на VPS: настройка для друзей"
description: "Как поднять Minecraft Java сервер на VPS: выбор RAM, Java, systemd, whitelist и оптимизация TPS."
pubDate: 2026-07-08
updatedDate: 2026-07-13
category: Облака
keywords:
  - "Minecraft сервер VPS"
  - "Minecraft VPS"
  - "игровой сервер"
  - "Java сервер"
  - "Storm Cloud"
heroImage: ./cover.webp
---

Свой Minecraft-сервер на VPS — полный контроль модов, whitelist и правил. Нужен только VPS с достаточной RAM.

---

## Требования VPS

| Игроков | RAM | vCPU |
| --- | --- | --- |
| 2–5 | 2 GB | 2 |
| 5–15 | 4 GB | 2–4 |
| 15+ с модами | 8 GB+ | 4 |

Без модов Vanilla Java edition — от **2 GB RAM**.

---

## Установка

```bash
sudo apt install openjdk-21-jre-headless -y
mkdir ~/minecraft && cd ~/minecraft
wget https://launcher.mojang.com/v1/objects/...server.jar -O server.jar
java -Xms2G -Xmx2G -jar server.jar nogui
```

Примите EULA в `eula.txt`: `eula=true`

---

## systemd автозапуск

```ini
[Service]
WorkingDirectory=/home/mc/minecraft
ExecStart=/usr/bin/java -Xms2G -Xmx2G -jar server.jar nogui
User=mc
Restart=on-failure
```

---

## Безопасность

- Whitelist: `white-list=true` в server.properties
- Не открывайте лишние порты
- Регулярные бэкапы мира — [бэкапы VPS](/blog/backup-vps-3-2-1/)

---

## Оптимизация

- Paper MC вместо Vanilla — лучше TPS
- view-distance: 8–10
- Не ставьте тяжёлые модпаки на слабый VPS

---

## Итог

Minecraft на VPS — fun-проект и отличный способ изучить Linux. Для вечерних игр с друзьями хватит VPS 4 GB.

Почасовая аренда для игровых вечеров — [StormNet Cloud](https://stormnetcloud.com/).
