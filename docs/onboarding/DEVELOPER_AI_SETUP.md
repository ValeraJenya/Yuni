# Developer AI Setup

Перед началом AI-разработки Yuni на новом компьютере:

* Выполнить `pnpm install`.
* Проверить работу Husky и commitlint.
* Установить CodeGraph:
  `npm install -g @astudioplus/codegraph-mcp`
* Скачать CodeGraph engine:
  `npx codegraph-mcp-fetch-engine --force`
* Проверить:
  `codegraph-mcp --help`
* Убедиться, что Codex видит `.codex/config.toml`.
* Проверить подключение MCP `codegraph` внутри Codex.
* Выполнить тестовое индексирование Yuni.
* Убедиться, что профиль CodeGraph — `core`.

После успешной проверки разработчик готов к AI-assisted работе с Yuni.
