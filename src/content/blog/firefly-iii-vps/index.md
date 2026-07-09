---
title: "Firefly III на VPS: self-hosted учёт личных финансов и бюджетов"
description: "Firefly III на VPS: Docker, PostgreSQL, импорт CSV, правила, бюджеты, multi-currency, SSL и бэкапы. Приватная альтернатива Mint и YNAB для учёта денег."
pubDate: 2026-07-08
category: DevOps
keywords:
  - "Firefly III VPS"
  - "personal finance"
  - "budget tracking"
  - "YNAB alternative"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Firefly III — open-source personal finance manager. На VPS 1 GB+: Docker + PostgreSQL + [Nginx SSL](/blog/ssl-letsencrypt-vps/) + импорт банковских CSV. Double-entry bookkeeping, budgets, rules, reports — без отправки данных в Mint/YNAB.

Банковские приложения не дают полной картины, Excel устаревает, YNAB — $100/год. Firefly III на [вашем VPS](/blog/choose-vps/) — все счета, транзакции, бюджеты и net worth в одном месте, полностью под вашим контролем.

---

## Firefly III vs YNAB vs Actual Budget vs GnuCash

| Критерий | Firefly III | YNAB | Actual Budget | GnuCash |
| --- | --- | --- | --- | --- |
| Self-hosted | Да | Нет | Local/sync | Desktop |
| Web UI | Modern | Web | Desktop | Desktop |
| RAM | 1 GB | N/A | 256 MB local | 512 MB |
| Bank sync | CSV/import API | Plaid | Manual | OFX |
| Mobile | Third-party apps | Official | No | No |
| Rules engine | Powerful | Good | Good | Basic |
| Cost | VPS only | $99/yr | $4/mo sync | Free |

Firefly III — best self-hosted для envelope budgeting enthusiasts.

---

## Архитектура

```
Browser / Mobile app (third-party)
        ↓ HTTPS
   Nginx reverse proxy
        ↓
   Firefly III (PHP/Laravel)
        ↓
   PostgreSQL (transactions, accounts)
        ↓
   /var/www/html/storage/upload (attachments)
        ↓
   Optional: CSV import cron, bank email parser
```

Нет bank API для РФ — manual CSV import или [n8n](/blog/n8n-self-hosted/) automation.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Личный учёт | 1 GB | 1 vCPU | 10 GB |
| Семья + 5 лет истории | 2 GB | 1 vCPU | 20 GB |
| Heavy reports | 2 GB | 2 vCPU | 30 GB SSD |

Firefly лёгкий — PostgreSQL основной consumer.

---

## Docker Compose

```yaml
services:
  firefly:
    image: fireflyiii/core:latest
    restart: unless-stopped
    depends_on:
      - db
    environment:
      APP_KEY: CHANGE_ME_32_CHARS
      APP_URL: https://finance.example.com
      TRUSTED_PROXIES: "**"
      DB_CONNECTION: pgsql
      DB_HOST: db
      DB_PORT: 5432
      DB_DATABASE: firefly
      DB_USERNAME: firefly
      DB_PASSWORD: CHANGE_ME
      DEFAULT_LANGUAGE: ru_RU
      TZ: Europe/Moscow
      AUTHENTICATION_GUARD: web
    volumes:
      - firefly_upload:/var/www/html/storage/upload
    ports:
      - "127.0.0.1:8080:8080"

  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: firefly
      POSTGRES_USER: firefly
      POSTGRES_PASSWORD: CHANGE_ME
    volumes:
      - pgdata:/var/lib/postgresql/data

  importer:
    image: fireflyiii/data-importer:latest
    restart: unless-stopped
    depends_on:
      - firefly
    environment:
      FIREFLY_III_URL: http://firefly:8080
      VANITY_URL: https://finance.example.com
    ports:
      - "127.0.0.1:8081:8080"

volumes:
  firefly_upload:
  pgdata:
```

Data Importer — отдельный UI для CSV/bank import на порту 8081.

---

## Nginx reverse proxy

```nginx
server {
    listen 443 ssl http2;
    server_name finance.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name import.finance.example.com;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Финансы — **обязательно** HTTPS + strong auth.

---

## Первоначальная настройка

1. Register first user (becomes admin)
2. **Profile → Options** — currency RUB, locale ru
3. Create **Asset accounts** — checking, savings, cash, investments
4. Create **Expense categories** — food, transport, utilities
5. Create **Budgets** — monthly envelopes
6. **Rules** — auto-categorize by description regex

---

## Счета и double-entry

Firefly использует double-entry:

| Тип | Пример |
| --- | --- |
| Asset | Банковская карта, наличные |
| Expense | Продукты, аренда |
| Revenue | Зарплата, фриланс |
| Liability | Кредит, ипотека |
| Transfer | Между своими счетами |

Transfer между asset accounts — не expense. Категория только для реальных трат.

---

## Импорт транзакций

| Источник | Метод |
| --- | --- |
| Bank CSV export | Data Importer UI |
| Email receipts | Forward rules (advanced) |
| Manual | Web UI quick entry |
| API | Personal access token + scripts |

```bash
# Bank CSV → Firefly via data importer
# Export from Tinkoff/Sber: date, amount, description, category
```

[n8n](/blog/n8n-self-hosted/) workflow: email attachment CSV → parse → Firefly API POST.

---

## Rules engine

```
IF description contains "PYATEROCHKA" → category "Groceries"
IF amount < 0 AND description contains "TAXI" → category "Transport"
IF description matches "/SALARY/i" → category "Income"
```

Rules run on import — экономят часы ручной категоризации.

---

## Budgets и reports

- **Budgets** — monthly limits per category, rollover optional
- **Piggy banks** — savings goals (отпуск, emergency fund)
- **Reports** — net worth over time, category breakdown, budget vs actual
- **Tags** — cross-cutting labels (#vacation, #tax-deductible)

Dashboard — financial health at a glance.

---

## Multi-currency

Firefly supports multiple currencies с exchange rates:
- Manual rate entry
- API auto-update (configure in settings)
- Foreign transactions → convert to default currency

Для crypto — custom asset account + manual price updates.

---

## Mobile access

Official mobile app нет. Options:
- Responsive web UI в браузере
- Third-party apps: Firefly III Mobile (community)
- [Tailscale](/blog/tailscale-vpn-vps/) + bookmark web UI

---

## Security (финансы = sensitive!)

| Пункт | Действие |
| --- | --- |
| HTTPS only | Mandatory |
| Strong password + 2FA | Firefly supports 2FA (TOTP) |
| [Tailscale](/blog/tailscale-vpn-vps/) only | Recommended — no public access |
| [Authentik](/blog/authentik-sso-vps/) | OAuth proxy for team/family |
| Firewall | [nftables](/blog/nftables-firewall-vps/) |
| No public registration | Disable after first user |
| API tokens | Separate per integration, revoke unused |

**Никогда** не expose Firefly публично без VPN/SSO.

---

## Backup

```bash
# PostgreSQL
docker compose exec -T db pg_dump -U firefly firefly > firefly-$(date +%F).sql

# Uploads
docker run --rm -v firefly_upload:/data -v $(pwd):/backup alpine \
  tar czf /backup/firefly-uploads.tar.gz /data
```

Стратегия [3-2-1](/blog/backup-vps-3-2-1/) + [Restic](/blog/restic-backup-vps/). Encrypt backups — financial data!

---

## Мониторинг

- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — ping (via Tailscale)
- Disk — transaction history grows slowly
- PostgreSQL health — [monitoring guide](/blog/vps-monitoring/)

Не нужны push alerts — [ntfy](/blog/ntfy-push-vps/) если backup script fails.

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| 500 error after update | `php artisan migrate` in container |
| Import duplicates | Use duplicate detection in importer |
| Wrong balance | Check transfers vs expenses classification |
| 2FA locked out | DB reset or backup restore |
| Slow reports | PostgreSQL indexes, reduce date range |
| OAuth redirect loop | TRUSTED_PROXIES, APP_URL correct |
| CSV encoding wrong | UTF-8 export from bank |
| Timezone off | TZ env + user profile timezone |
| API 401 | Regenerate personal access token |
| Importer connection fail | FIREFLY_III_URL internal docker network |

---

## Связка с экосистемой

- Automation — [n8n](/blog/n8n-self-hosted/)
- Alerts — [ntfy](/blog/ntfy-push-vps/)
- SSO — [Authentik](/blog/authentik-sso-vps/)
- VPN — [Tailscale](/blog/tailscale-vpn-vps/)
- Backup — [Restic](/blog/restic-backup-vps/)
- PostgreSQL — [tuning guide](/blog/postgresql-tuning-vps/)

---

## Итог

Firefly III — лучший self-hosted finance tracker. Полный контроль, мощные rules, красивые reports. Доступ только через VPN — и ваши финансы в безопасности.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Backup — [3-2-1](/blog/backup-vps-3-2-1/). VPN — [Tailscale](/blog/tailscale-vpn-vps/).
