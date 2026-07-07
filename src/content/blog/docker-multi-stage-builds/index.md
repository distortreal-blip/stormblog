---
title: "Docker multi-stage build: образы в 10 раз меньше"
description: "Как уменьшить Docker-образ с 1 GB до 50 MB через multi-stage build. Примеры для Node.js и Go на VPS."
pubDate: 2026-07-07
updatedDate: 2026-07-13
category: Docker
keywords:
  - "Docker multi-stage"
  - "уменьшить образ Docker"
  - "Dockerfile"
  - "VPS"
  - "production"
heroImage: ./cover.webp
---

Образ на 1.2 GB — долгий деплой, много RAM, медленный pull. Multi-stage build решает это.

---

## Проблема

Обычный Dockerfile:

```dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["node", "dist/index.js"]
```

В образ попадают: node_modules, исходники, devDependencies. Итог — **800 MB–1.5 GB**.

---

## Решение: multi-stage

```dockerfile
# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

Или для Go — финальный образ на `scratch` или `alpine` — **15–30 MB**.

---

## Сравнение

| Подход | Размер образа | Время pull |
| --- | --- | --- |
| Single-stage Node | ~900 MB | 2–5 мин |
| Multi-stage Node | ~150 MB | 30 сек |
| Multi-stage Go | ~20 MB | 5 сек |

---

## Советы для VPS

- Используйте `alpine` базовые образы
- Добавьте `.dockerignore`
- Не копируйте `node_modules` — ставьте в build stage
- Кэшируйте слои: сначала `package.json`, потом код

---

## Итог

Multi-stage — must-have для production на VPS. Меньше образ = быстрее деплой и меньше расход диска.

Деплой контейнеров — [Docker Compose на VPS](/blog/docker-compose-vps/). VPS для CI/CD — [StormNet Cloud](https://stormnetcloud.com/).
