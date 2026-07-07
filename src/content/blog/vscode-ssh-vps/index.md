---
title: "VS Code SSH Remote: разработка прямо на VPS"
description: "Как настроить Remote SSH в VS Code и Cursor для разработки на VPS: ключи, конфиг, расширения, port forwarding и отличия от локальной машины. Практический гайд без лишней теории."
pubDate: 2026-07-06
category: Разработка
keywords:
  - "vscode remote ssh"
  - "разработка на vps"
  - "remote development"
  - "cursor remote ssh"
  - "ssh config"
  - "dev environment vps"
heroImage: ./cover.webp
---

Локальная машина с Windows и проект, который должен жить на Linux в production — классический разрыв: «у меня работает» превращается в отладку на сервере через nano и tail -f. Remote SSH в VS Code (и Cursor на той же базе) переносит IDE на VPS: файлы, терминал, отладчик и расширения работают удалённо, а вы видите привычный интерфейс.

Один раз настроили SSH — и pet-проект, и staging окружение редактируются так же удобно, как локальная папка.

---

## Как работает Remote SSH

Расширение `Remote - SSH` поднимает на VPS лёгкий VS Code Server. Ваш клиент на Windows/Mac:

- отображает UI и отправляет команды;
- синхронизирует открытые файлы и настройки workspace;
- пробрасывает порты (dev-сервер на localhost:3000 доступен локально).

Код не копируется туда-сюда — вы редактируете файлы прямо на диске VPS. Git, npm, python, docker — всё нативное Linux-окружение.

---

## Подготовка VPS

Минимальные требования к cloud/VPS:

- Ubuntu 22.04/24.04 или Debian 12;
- 2 GB RAM (комфортнее 4 GB при тяжёлых расширениях);
- пользователь с sudo, вход по SSH-ключу.

На сервере:

```bash
sudo apt update && sudo apt install -y git curl build-essential
```

Отключите password auth в `/etc/ssh/sshd_config`:

```
PasswordAuthentication no
PubkeyAuthentication yes
```

Перезапуск: `sudo systemctl restart sshd`. Firewall: открыт только порт 22 (или кастомный) с вашего IP.

---

## SSH-ключ и config на локальной машине

Сгенерируйте ключ, если нет:

```bash
ssh-keygen -t ed25519 -C "dev-vps"
ssh-copy-id deploy@YOUR_VPS_IP
```

Файл `~/.ssh/config` (Windows: `C:\Users\User\.ssh\config`):

```
Host my-vps
    HostName 203.0.113.10
    User deploy
    IdentityFile ~/.ssh/id_ed25519
    ForwardAgent yes
```

Проверка: `ssh my-vps` — вход без пароля.

---

## Подключение из VS Code / Cursor

1. Установите расширение **Remote - SSH** (Microsoft).
2. `F1` → **Remote-SSH: Connect to Host** → `my-vps`.
3. Выберите платформу Linux, дождитесь установки VS Code Server.
4. **File → Open Folder** → `/home/deploy/projects/myapp`.

Cursor использует тот же механизм: Remote SSH из marketplace, те же config-хосты. Workspace settings хранятся в `.vscode/` на сервере — коммитьте их в репо для единообразия.

Полезные команды палитры:

- **Remote-SSH: Kill VS Code Server on Host** — при глюках после обновления;
- **Forward a Port** — доступ к API на VPS с локального браузера;
- **Remote-SSH: Add New SSH Host** — wizard для config.

---

## Расширения и производительность

Расширения делятся на local и remote. Language servers (Python, ESLint, Rust-analyzer) ставьте **на remote** — они видят правильные пути и интерпретаторы.

Рекомендации для VPS:

- **GitLens**, **Docker**, **REST Client** — на remote;
- тяжёлые темы и AI-плагины — local, если возможно;
- `remote.SSH.remotePlatform` в settings при нестандardных дистрибутивах.

Если VPS слабый — отключите minimap, уменьшите частоту file watcher (`files.watcherExclude`). На NVMe-диске cloud-провайдера индексация заметно быстрее HDD.

Для нескольких проектов — отдельные хосты или разные папки на одном VPS; не смешивайте prod и dev без изоляции (лучше два инстанса или Docker).

---

## Безопасность и workflow

- **Agent forwarding** — осторожно на недоверенных хостах; для GitHub используйте deploy keys на VPS.
- **Не работайте под root** — отдельный user, проекты в home.
- **Бэкапы** — код в Git; данные БД — отдельно. VPS — расходник, репозиторий — источник истины.
- **VPN** — если VPS без белого IP для SSH, подключайтесь через WireGuard/Tailscale.

Типичный день: подключились к `my-vps`, подняли `docker compose up`, отладили в Remote, закоммитили с сервера или через локальный git с mount — оба варианта работают.

---

## Итог

VS Code Remote SSH превращает VPS в полноценную dev-машину: тот же стек, что в production, без синхронизации файлов и суррогатного WSL для деплоя. Настройка — SSH-ключ, строка в config, одно расширение. Для pet-проекта на дешёвом cloud-инстансе это самый быстрый путь к честному «работает везде одинаково». Cursor наследует тот же flow — переносите привычки без переобучения.
