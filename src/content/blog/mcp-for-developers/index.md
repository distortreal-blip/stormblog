---
title: "MCP для разработчиков: что это и зачем подключать к Cursor"
description: "Model Context Protocol — стандарт подключения AI к вашим инструментам. Разбираем архитектуру MCP, настройку серверов в Cursor и реальные сценарии для разработки на VPS и в облаке."
pubDate: 2026-07-06
category: Разработка
keywords:
  - "mcp protocol"
  - "model context protocol"
  - "cursor mcp"
  - "claude mcp"
  - "mcp server"
  - "ai инструменты разработчика"
  - "context protocol"
heroImage: ./cover.webp
---

AI-ассистент в редакторе умеет писать код, но без доступа к вашей базе, API и логам он работает вслепую. Model Context Protocol (MCP) — открытый протокол от Anthropic, который стандартизирует связь между LLM и внешними инструментами. Cursor, Claude Desktop и другие клиенты уже поддерживают MCP: подключили сервер — модель читает файлы, дергает API, выполняет команды по правилам.

Для разработчика это означает меньше копипаста из терминала и более точные ответы с актуальным контекстом проекта.

---

## Что такое MCP простыми словами

MCP разделяет роли:

- **Host** — приложение с LLM (Cursor, Claude Desktop);
- **Client** — прослойка внутри host, управляет соединениями;
- **Server** — ваш сервис с tools, resources и prompts.

Сервер объявляет capabilities: например, tool `query_database`, resource `schema.sql`, prompt `code_review`. Host запрашивает список, LLM решает, что вызвать, client отправляет JSON-RPC, server возвращает результат.

Протокол транспортно-агnostic: stdio (локальный процесс), SSE или HTTP — удобно и для ноутбука, и для MCP на VPS в Docker.

---

## Зачем подключать MCP к Cursor

Cursor из коробки индексирует репозиторий, но MCP расширяет горизонт:

- **Живые данные** — PostgreSQL, Redis, Elasticsearch без ручного экспорта;
- **Внутренние API** — Swagger/OpenAPI как tool;
- **DevOps** — статус CI, логи с staging на вашем VPS;
- **Документация** — Confluence, Notion, локальный MkDocs;
- **Специализированные tools** — линтеры, генераторы миграций, скрипты деплоя.

Модель не «выдумывает» схему таблицы — она запрашивает её через MCP. Меньше галлюцинаций, быстрее отладка.

---

## Как настроить MCP в Cursor

Конфигурация лежит в `~/.cursor/mcp.json` (или через Settings → MCP):

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:pass@localhost/db"]
    }
  }
}
```

После сохранения перезапустите Cursor. В чате появятся доступные tools — агент сможет их вызывать по необходимости.

Популярные готовые серверы:

- `@modelcontextprotocol/server-github` — issues, PR, файлы репо;
- `@modelcontextprotocol/server-git` — локальный git;
- `@modelcontextprotocol/server-puppeteer` — браузерная автоматизация;
- community: Sentry, Linear, Slack, Docker.

---

## Свой MCP-сервер за час

Если готового сервера нет, напишите минимальный на TypeScript (официальный SDK `@modelcontextprotocol/sdk`):

1. Определите tools с Zod-схемами аргументов.
2. Реализуйте handlers — вызов вашего REST API, SSH на VPS, чтение конфигов.
3. Запустите через stdio: `node dist/index.js`.
4. Добавьте в `mcp.json`.

Пример use case: tool `deploy_staging` дергает webhook GitHub Actions или скрипт на VPS. Агент в Cursor после фикса бага сам предложит деплой — с вашим approval.

Для команды можно поднять MCP server в Docker на internal VPS, transport SSE — один endpoint для всех разработчиков.

---

## Безопасность и лучшие практики

MCP даёт модели реальные полномочия — относитесь к серверам как к CI-секретам:

- не передавайте production credentials в dev-конфиг;
- ограничивайте filesystem server корневой папкой проекта;
- read-only доступ к БД для аналитики, отдельный user без DROP;
- логируйте вызовы tools на server side;
- для production MCP используйте OAuth и network policies в облаке.

Начните с read-only tools, расширяйте по мере доверия к сценариям.

---

## Итог

MCP — это USB для AI-инструментов: один протокол, любые серверы, единая интegrация в Cursor. Подключите GitHub, базу и пару внутренних API — и ассистент перестанет быть изолированным чатом. Для pet-проекта хватит готовых npm-пакетов; для команды на VPS или в облаке имеет смысл свой MCP server с tools под ваш pipeline. Настройка занимает минуты, отдача — в каждом диалоге с актуальным контекстом.
