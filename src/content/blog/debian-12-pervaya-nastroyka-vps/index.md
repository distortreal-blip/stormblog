---
title: "Debian 12 на VPS: первая настройка сервера"
description: "Чек-лист настройки Debian 12 Bookworm на VPS: SSH, UFW, обновления, sudo-пользователь. Альтернатива Ubuntu для production."
pubDate: 2026-07-12
category: Linux
keywords:
  - "Debian 12 VPS"
  - "Bookworm сервер"
  - "настройка Debian"
  - "Debian vs Ubuntu"
  - "hardening"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Debian 12 — стабильнее и легче Ubuntu. Те же шаги: sudo-пользователь, SSH keys, UFW, `apt update`. Отличия — пакеты без snap, иногда старее версии софта.

Многие провайдеры дают Ubuntu по умолчанию. Debian — для тех, кто хочет минимализм и предсказуемость. Сравните с [Ubuntu 24.04](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).

---

## Debian vs Ubuntu на VPS

| | Debian 12 | Ubuntu 24.04 |
| --- | --- | --- |
| Стабильность | Максимальная | LTS хорошая |
| Свежесть пакетов | Консервативнее | Новее |
| Документация | Меньше туториалов | Больше |
| Docker/K8s | Отлично | Отлично |

---

## Первые команды

```bash
su -
apt update && apt upgrade -y
apt install sudo ufw curl git vim -y
```

Создание пользователя — как в [Ubuntu гайде](/blog/ubuntu-24-04-pervaya-nastroyka-vps/):

```bash
adduser deploy
usermod -aG sudo deploy
```

---

## SSH hardening

```ini
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
```

```bash
systemctl restart ssh
```

---

## UFW

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## non-free firmware (WiFi/диски)

Debian иногда требует non-free для драйверов — на VPS обычно не нужно. Для bare metal — `contrib non-free` в sources.

---

## cloud-init на Debian

[cloud-init](/blog/cloud-init-avtomatizaciya-vps/) работает на Debian cloud images — автоматизируйте bootstrap.

---

## Итог

Debian 12 — отличный выбор для production VPS. Чек-лист идентичен Ubuntu, пакеты чуть старее — проверяйте версии PHP/Node перед деплоем.

VPS с Debian — [StormNet Cloud](https://stormnetcloud.com/). Автоматизация — [Ansible](/blog/ansible-avtomatizaciya-servera/).
