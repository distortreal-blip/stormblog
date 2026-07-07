---
title: "SSL на VPS: Let's Encrypt, автообновление и типичные ошибки"
description: "Полный гайд по HTTPS на VPS: Certbot, Nginx, автообновление сертификатов, Mixed Content и HSTS."
pubDate: 2026-07-08
updatedDate: 2026-07-13
category: Linux
keywords:
  - "SSL VPS"
  - "Let's Encrypt"
  - "Certbot"
  - "HTTPS Nginx"
  - "сертификат"
heroImage: ./cover.webp
---

HTTPS — обязателен для SEO, безопасности и доверия. На VPS SSL бесплатен через Let's Encrypt.

---

## Certbot + Nginx

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d example.com -d www.example.com
```

Certbot автоматически настроит HTTPS и редирект HTTP → HTTPS.

---

## Автообновление

```bash
sudo certbot renew --dry-run
```

Cron уже настроен через systemd timer. Проверьте:

```bash
systemctl list-timers | grep certbot
```

---

## HSTS (опционально)

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Включайте только когда уверены, что HTTPS стабилен.

---

## Типичные ошибки

| Ошибка | Решение |
| --- | --- |
| DNS не указывает на VPS | Подождите propagation |
| Порт 80 закрыт | UFW allow 80 |
| Mixed Content | Замените http:// на https:// в коде |
| Слишком много запросов | Лимит LE: 5 cert/неделю на домен |

---

## Итог

SSL на VPS — 5 минут с Certbot. Обязательно для production. Полный деплой — [гайд по развёртыванию сайта](/blog/razvernut-sayt-na-vps-2026/).
