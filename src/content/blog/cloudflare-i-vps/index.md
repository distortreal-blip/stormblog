---
title: "Cloudflare перед VPS: CDN, SSL и защита от DDoS"
description: "Как подключить Cloudflare к VPS: DNS, проксирование, Flexible/Full SSL, кэш статики. Плюсы и минусы для российских проектов."
pubDate: 2026-07-07
category: Облака
keywords:
  - "Cloudflare VPS"
  - "CDN"
  - "DDoS защита"
  - "SSL"
  - "DNS"
  - "облако"
heroImage: ./cover.webp
---

Cloudflare между пользователем и VPS даёт CDN, кэш, SSL и базовую DDoS-защиту — бесплатно.

---

## Как это работает

```
Пользователь → Cloudflare (CDN) → ваш VPS (Nginx)
```

Запросы к статике (CSS, JS, картинки) отдаются из edge-серверов Cloudflare. Динамика идёт на VPS.

---

## Подключение за 10 минут

1. Зарегистрируйтесь на cloudflare.com
2. Добавьте домен
3. Смените NS-записи у регистратора на Cloudflare
4. В DNS добавьте A-запись → IP VPS (оранжевое облако = прокси включён)
5. SSL/TLS → **Full (strict)** + Let's Encrypt на VPS

---

## Режимы SSL

| Режим | Описание |
| --- | --- |
| Flexible | CF→VPS без HTTPS (не рекомендуется) |
| Full | CF→VPS с HTTPS (самоподписанный OK) |
| Full (strict) | CF→VPS с валидным сертификатом |

---

## Что кэшировать

**Page Rules / Cache Rules:**
- `*.css`, `*.js`, `*.webp` — Cache Everything
- `/api/*` — Bypass cache

---

## Плюсы и минусы

**Плюсы:** бесплатный CDN, DDoS mitigation, аналитика, WAF (платно).

**Минусы:** задержка при чистке кэша, иногда блокировки в РФ, реальный IP VPS виден при ошибках настройки.

---

## Итог

Cloudflare + VPS — стандарт для production-сайтов. Настройте Full (strict) SSL и кэш статики — и сервер разгрузится на 60–80%.

VPS под origin — [StormNet Cloud](https://stormnetcloud.com/).
