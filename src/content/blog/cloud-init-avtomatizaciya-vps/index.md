---
title: "cloud-init на VPS: автоматизация первого запуска сервера"
description: "cloud-init на VPS: user-data, SSH-ключи, пакеты, скрипты при создании. Воспроизводимая настройка без ручных шагов."
pubDate: 2026-07-11
updatedDate: 2026-07-13
category: Linux
keywords:
  - "cloud-init VPS"
  - "автоматизация сервера"
  - "user-data"
  - "cloud-init Ubuntu"
  - "IaC"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** cloud-init выполняет скрипты и конфиги при первом boot VPS. Передайте user-data при создании сервера — получите готовый сервер с пользователем, SSH-ключами и пакетами без ручной [первой настройки](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).

Создаёте 5 одинаковых VPS? cloud-init экономит часы повторяющихся команд.

---

## Что делает cloud-init

1. Создаёт пользователей и SSH-ключи
2. Устанавливает пакеты
3. Запускает runcmd (shell-скрипты)
4. Настраивает hostname, timezone
5. Пишет лог в /var/log/cloud-init.log

---

## Пример user-data (YAML)

```yaml
#cloud-config
users:
  - name: deploy
    groups: sudo
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - ssh-ed25519 AAAA... your-key

package_update: true
packages:
  - nginx
  - ufw
  - fail2ban

runcmd:
  - ufw allow OpenSSH
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw --force enable
  - systemctl enable nginx
```

Провайдер передаёт user-data при создании VPS (metadata service или панель).

---

## Проверка

```bash
cloud-init status
sudo cat /var/log/cloud-init-output.log
```

Ошибки — в [journalctl](/blog/journalctl-logi-linux-vps/).

---

## cloud-init + Ansible

cloud-init — bootstrap при создании. [Ansible](/blog/ansible-avtomatizaciya-servera/) — полная конфигурация после boot. Связка:

1. cloud-init: user, SSH, базовые пакеты
2. Ansible: приложение, Nginx, SSL

[Terraform](/blog/terraform-vps-infrastruktura/) создаёт VPS + передаёт user-data.

---

## Секреты в user-data

**Не кладите пароли** в открытый user-data. Используйте:
- SSH-ключи только
- Секреты через vault после boot — [Restic](/blog/restic-backup-vps/) / env из CI
- [WireGuard](/blog/wireguard-vpn-na-vps/) keys — генерируйте на сервере

---

## Типичные runcmd

```yaml
runcmd:
  - curl -fsSL https://get.docker.com | sh
  - usermod -aG docker deploy
  - timedatectl set-timezone Europe/Moscow
```

Для [Docker Compose](/blog/docker-compose-vps/) стеков — отдельный скрипт в runcmd.

---

## Итог

cloud-init превращает «голый VPS» в «готовый к деплою» за минуты. Обязателен при масштабировании и IaC.

VPS с cloud-init — [StormNet Cloud](https://stormnetcloud.com/). Ручной чек-лист — [Ubuntu 24.04](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).
