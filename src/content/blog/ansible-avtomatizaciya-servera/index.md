---
title: "Ansible для автоматизации VPS: с нуля до playbook"
description: "Как автоматизировать настройку VPS через Ansible: inventory, playbook, роли. Один раз описали — разворачиваете серверы за минуты."
pubDate: 2026-07-07
updatedDate: 2026-07-13
category: DevOps
keywords:
  - "Ansible"
  - "автоматизация сервера"
  - "playbook"
  - "DevOps"
  - "VPS"
  - "Storm Cloud"
heroImage: ./cover.webp
---

Ручная настройка каждого VPS отнимает часы. Ansible решает это через декларативные playbook.

---

## Что такое Ansible

Agentless-инструмент: подключается по SSH, выполняет задачи, не требует установки агента на сервер.

**Нужно:** Python на control-машине, SSH-доступ к VPS.

---

## Минимальный playbook

```yaml
# playbook.yml
- hosts: webservers
  become: yes
  tasks:
    - name: Update apt cache
      apt: update_cache=yes

    - name: Install nginx
      apt: name=nginx state=present

    - name: Start nginx
      service: name=nginx state=started enabled=yes
```

```ini
# inventory.ini
[webservers]
192.168.1.10 ansible_user=deploy
```

Запуск:

```bash
ansible-playbook -i inventory.ini playbook.yml
```

---

## Типичные задачи для VPS

- Установка пакетов и обновлений
- Настройка UFW и fail2ban
- Деплой конфигов Nginx
- Создание пользователей и SSH-ключей
- Установка Docker

---

## Ansible vs bash-скрипты

| | Bash | Ansible |
| --- | --- | --- |
| Идемпотентность | Нет | Да |
| Масштаб | 1 сервер | 100+ серверов |
| Читаемость | Средняя | Высокая |
| Кривая обучения | Низкая | Средняя |

---

## Итог

Ansible окупается после второго-третьего сервера. Опишите [первичную настройку VPS](/blog/vps-first-steps/) как playbook — и каждый новый сервер будет готов за 5 минут.

VPS для тестов playbook — [аренда на StormNet Cloud](https://stormnetcloud.com/).
