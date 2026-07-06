---
title: "Terraform и VPS: инфраструктура как код"
description: "Зачем Terraform при ручном VPS, как описать сервер в HCL, state-файл и воспроизводимые окружения dev/stage/prod."
pubDate: 2026-07-08
category: DevOps
keywords:
  - "Terraform VPS"
  - "Infrastructure as Code"
  - "IaC"
  - "DevOps"
  - "автоматизация"
heroImage: ./cover.webp
---

Terraform позволяет описать инфраструктуру в коде и воспроизводить окружения одной командой.

---

## Зачем Terraform для VPS

- **Воспроизводимость** — одинаковый dev/stage/prod
- **Версионирование** — инфраструктура в Git
- **Документация** — код = описание системы
- **Масштаб** — 1 или 100 серверов

Даже при одном VPS Terraform полезен для дисциплины и экспериментов.

---

## Пример (generic provider)

```hcl
terraform {
  required_providers {
    # provider вашего облака
  }
}

resource "vps_instance" "web" {
  name  = "production-web"
  image = "ubuntu-22.04"
  size  = "2gb"
  region = "eu-west"
}
```

```bash
terraform init
terraform plan
terraform apply
```

---

## State-файл

Храните `terraform.tfstate` в S3/remote backend — не в Git. Иначе риск потери и конфликтов.

---

## Terraform vs Ansible

| | Terraform | Ansible |
| --- | --- | --- |
| Задача | Создать ресурсы | Настроить ОС |
| Идемпотентность | Да | Да |
| Вместе | Да, часто в паре | Да |

Создали VPS в Terraform → настроили Ansible playbook.

---

## Итог

IaC — следующий шаг после ручной настройки. Начните с одного `.tf` файла для dev-сервера.

VPS для экспериментов — [StormNet Cloud](https://stormnetcloud.com/). Ansible — [гайд](/blog/ansible-avtomatizaciya-servera/).
