---
title: "Rocky Linux 9 на VPS: первая настройка сервера"
description: "Rocky Linux 9 на VPS: обновления, SSH, firewall, swap, hardening. Enterprise-альтернатива CentOS для production и DevOps."
pubDate: 2026-07-02
category: Linux
keywords:
  - "Rocky Linux 9"
  - "VPS настройка"
  - "CentOS альтернатива"
  - "RHEL clone"
  - "Linux сервер"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Rocky Linux 9 — RHEL-совместимый дистрибутив для production. На VPS: `dnf update`, пользователь с sudo, SSH по ключам, [nftables/UFW](/blog/nftables-firewall-vps/), swap — как на [Debian 12](/blog/debian-12-pervaya-nastroyka-vps/) и [Ubuntu 24.04](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).

Rocky выбирают, когда нужна стабильность RHEL-экосистемы без подписки: `dnf`, SELinux, долгий lifecycle (2032).

---

## Rocky vs Alma vs Debian/Ubuntu

| | Rocky 9 | Debian 12 | Ubuntu 24.04 |
| --- | --- | --- | --- |
| Пакеты | RHEL, dnf | apt, стабильно | apt, свежее |
| SELinux | Да (enforcing) | AppArmor | AppArmor |
| Docker/k8s | Отлично | Отлично | Отлично |
| Документация | Много RHEL-туториалов | Огромная | Огромная |

---

## Первый вход

```bash
sudo dnf update -y
sudo dnf install vim curl git htop -y
```

Создайте пользователя (не работайте под root):

```bash
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG wheel deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## SSH hardening

```bash
# /etc/ssh/sshd_config.d/99-hardening.conf
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

```bash
sudo systemctl restart sshd
```

Полный чеклист — [защита VPS](/blog/zashchita-vps-ot-vzloma/), [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/).

---

## Firewall (firewalld)

```bash
sudo systemctl enable --now firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

На Rocky по умолчанию firewalld, не UFW. Логика та же: только нужные порты.

---

## Swap на VPS с 1 GB RAM

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Docker на Rocky 9

```bash
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
sudo systemctl enable --now docker
sudo usermod -aG docker deploy
```

Дальше — [Docker Compose](/blog/docker-compose-vps/), [Portainer](/blog/portainer-docker-vps/).

---

## SELinux и Docker volumes

При ошибках «Permission denied» на volume:

```bash
sudo chcon -Rt svirt_sandbox_file_t /path/to/volume
```

Или временно `setenforce 0` для диагностики (не в production).

---

## Итог

Rocky Linux 9 на VPS — solid choice для enterprise-стека: RHEL-совместимость, SELinux, долгая поддержка. Настройка = update + SSH + firewall + swap.

VPS — [StormNet Cloud](https://stormnetcloud.com/). Альтернативы — [Debian 12](/blog/debian-12-pervaya-nastroyka-vps/), [Ubuntu 24.04](/blog/ubuntu-24-04-pervaya-nastroyka-vps/). Автоматизация — [cloud-init](/blog/cloud-init-avtomatizaciya-vps/).
