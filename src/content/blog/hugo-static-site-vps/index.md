---
title: "Hugo на VPS: деплой статического сайта за 20 минут"
description: "Как задеплоить Hugo на VPS: build, Nginx, SSL, CI/CD. Быстрый статический блог без базы данных и PHP."
pubDate: 2026-07-11
updatedDate: 2026-07-13
category: Разработка
keywords:
  - "Hugo VPS"
  - "статический сайт"
  - "деплой Hugo"
  - "Nginx static"
  - "SSG блог"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Hugo генерирует статический HTML. На VPS нужен только Nginx + SSL — никакой БД и runtime. `hugo build` → rsync в /var/www → готово.

Статика — самый дешёвый и быстрый деплой на VPS. 512 MB RAM хватит с запасом. Идеален для блогов, документации, лендингов.

---

## Hugo vs WordPress vs Next.js

| | Hugo | WordPress | Next.js SSR |
| --- | --- | --- | --- |
| RAM на VPS | 128 MB | 1–2 GB | 1–2 GB |
| БД | Нет | MySQL | Опционально |
| Скорость | Максимум | Средняя | Высокая |
| Сложность | Низкая | Средняя | Высокая |

---

## Установка Hugo (dev/CI)

```bash
# На машине сборки или CI
sudo snap install hugo --channel=extended
hugo version
```

На VPS Hugo **не нужен** — только готовые HTML-файлы.

---

## Сборка

```bash
hugo new site myblog
cd myblog
git submodule add https://github.com/theNewDynamic/gohugo-theme-ananke themes/ananke
echo "theme = 'ananke'" >> hugo.toml
hugo new content posts/hello.md
hugo --minify
# Результат в public/
```

---

## Деплой на VPS

```bash
rsync -avz --delete public/ deploy@VPS:/var/www/mysite/
```

Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name blog.example.com;
    root /var/www/mysite;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

[SSL](/blog/ssl-letsencrypt-vps/) + [Cloudflare CDN](/blog/cloudflare-i-vps/) для глобальной скорости.

---

## CI/CD

```yaml
# GitHub Actions
- run: hugo --minify
- run: rsync -avz public/ deploy@${{ secrets.VPS_HOST }}:/var/www/mysite/
```

См. [GitHub Actions](/blog/github-actions-cicd/) и [GitLab Runner](/blog/gitlab-runner-cicd-vps/).

---

## VPS требования

| Трафик | RAM | Диск |
| --- | --- | --- |
| Блог | 512 MB | 10 GB |
| Документация | 512 MB–1 GB | 20 GB |

Мониторинг — [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/).

---

## Сравнение с Astro/этим блогом

Stormblog на Astro — тот же принцип: SSG + deploy. Hugo проще для pure content-сайтов без React.

---

## Итог

Hugo + Nginx — минимальный стек на VPS. Дешёво, быстро, безопасно (нет PHP/БД для атаки).

VPS от 512 MB — [StormNet Cloud](https://stormnetcloud.com/). Полный гайд — [развернуть сайт](/blog/razvernut-sayt-na-vps-2026/).
