---
title: "Ubuntu 24.04 на VPS: первая настройка с нуля"
description: "Полный чек-лист первой настройки Ubuntu 24.04 на VPS: пользователь, SSH, UFW, обновления, swap, часовой пояс и hardening. Команды для production."
pubDate: 2026-07-09
category: Linux
keywords:
  - "Ubuntu 24.04 VPS"
  - "настройка Ubuntu сервер"
  - "первый запуск VPS"
  - "UFW firewall"
  - "hardening Linux"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** после создания VPS на Ubuntu 24.04 создайте sudo-пользователя, отключите root-login по паролю, настройте SSH-ключи, включите UFW, обновите систему и задайте hostname. Это база перед любым деплоем — от [развёртывания сайта](/blog/razvernut-sayt-na-vps-2026/) до Docker.

Свежий VPS — как чистый лист. Ошибки на этапе первой настройки потом обходятся дорого: взломы, простои, потерянные данные. Этот гайд — системный чек-лист для Ubuntu 24.04 LTS.

---

## Что сделать в первые 30 минут

| Шаг | Зачем | Время |
| --- | --- | --- |
| Создать sudo-пользователя | Не работать под root | 5 мин |
| SSH только по ключу | Защита от брутфорса | 10 мин |
| UFW firewall | Закрыть лишние порты | 5 мин |
| apt update && upgrade | Патчи безопасности | 5–15 мин |
| Часовой пояс и NTP | Корректные логи | 2 мин |

Подробнее о безопасности — [защита VPS от взлома](/blog/zashchita-vps-ot-vzloma/) и [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/).

---

## Шаг 1. Подключение и обновление

```bash
ssh root@ВАШ_IP
apt update && apt upgrade -y
apt install -y curl wget git ufw fail2ban unattended-upgrades
```

Включите автоматические security-обновления:

```bash
dpkg-reconfigure -plow unattended-upgrades
```

---

## Шаг 2. Создание пользователя

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Проверьте вход в **новом терминале**, не закрывая root-сессию:

```bash
ssh deploy@ВАШ_IP
```

---

## Шаг 3. Hardening SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Рекомендуемые значения:

```ini
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers deploy
```

```bash
sudo systemctl restart ssh
```

Для работы из VS Code — [VS Code + SSH на VPS](/blog/vscode-ssh-vps/).

---

## Шаг 4. UFW firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Дополнительные порты (WireGuard, Minecraft) — только по необходимости. См. [WireGuard VPN](/blog/wireguard-vpn-na-vps/).

---

## Шаг 5. Hostname и часовой пояс

```bash
sudo hostnamectl set-hostname prod-web-01
sudo timedatectl set-timezone Europe/Moscow
timedatectl status
```

Правильный timezone критичен для [логов Nginx](/blog/nginx-logi-i-oshibki/) и мониторинга.

---

## Шаг 6. Swap (для VPS с 1–2 GB RAM)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

На 4+ GB RAM swap часто не нужен, но для Ollama или тяжёлых сборок — полезен.

---

## Шаг 7. Мониторинг ресурсов

Базовые утилиты:

```bash
sudo apt install -y htop iotop ncdu
```

Для production добавьте [Grafana + Prometheus](/blog/grafana-prometheus-vps/) или лёгкий [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).

---

## Чек-лист перед деплоем

- [ ] Вход только по SSH-ключу
- [ ] Root login отключён
- [ ] UFW включён
- [ ] Система обновлена
- [ ] Fail2ban или CrowdSec активен
- [ ] Бэкап-стратегия определена — [правило 3-2-1](/blog/backup-vps-3-2-1/)

---

## Типичные ошибки новичков

1. **Работа под root** — одна ошибка = компрометация всего сервера
2. **Парольный SSH** — брутфорс за часы
3. **Все порты открыты** — сканеры найдут Redis/MySQL за минуты
4. **Нет бэкапов** — диск умер — проект умер

Больше ошибок — в [типичных ошибках VPS](/blog/vps-mistakes/).

---

## Итог

Правильная первая настройка Ubuntu 24.04 занимает меньше часа и экономит дни при инцидентах. После чек-листа переходите к [полному гайду деплоя](/blog/razvernut-sayt-na-vps-2026/) или [Docker Compose](/blog/docker-compose-vps/).

VPS для старта — [StormNet Cloud](https://stormnetcloud.com/). Для тестов — [почасовая аренда](/blog/pochasovaya-arenda-vps/).
