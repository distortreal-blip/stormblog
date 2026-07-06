---
title: "WireGuard VPN на VPS: личный VPN за 15 минут"
description: "Пошаговая настройка WireGuard на Ubuntu VPS: ключи, конфиг клиента, маршрутизация. Быстрее и проще OpenVPN."
pubDate: 2026-07-08
category: Безопасность
keywords:
  - "WireGuard VPS"
  - "VPN на сервере"
  - "личный VPN"
  - "безопасность"
  - "Ubuntu"
heroImage: ./cover.webp
---

WireGuard — современный VPN: минимальный код, высокая скорость, простая настройка. Идеален для личного VPN на VPS.

---

## Почему WireGuard, а не OpenVPN

| | WireGuard | OpenVPN |
| --- | --- | --- |
| Скорость | Высокая | Средняя |
| Настройка | 15 мин | 1+ час |
| Код | ~4000 строк | ~100k строк |
| Мобильные клиенты | Отлично | Хорошо |

---

## Установка на Ubuntu

```bash
sudo apt install wireguard -y
wg genkey | tee privatekey | wg pubkey > publickey
```

```ini
# /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = SERVER_PRIVATE_KEY
PostUp = ufw allow 51820/udp

[Peer]
PublicKey = CLIENT_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32
```

```bash
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

---

## Безопасность

- Откройте только UDP 51820
- Не используйте VPN для всего трафика без необходимости
- Обновляйте VPS регулярно

---

## Итог

VPS + WireGuard = ваш личный VPN без подписок. Подойдёт для доступа к dev-средам и защищённого серфинга в публичных сетях.

VPS для VPN — [StormNet Cloud](https://stormnetcloud.com/). Безопасность сервера — [защита VPS](/blog/zashchita-vps-ot-vzloma/).
