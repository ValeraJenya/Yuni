# Task 066 — Landing font, hero and design rules

## Статус

done

## Приоритет

P2

## Owner

Valer

## Executor

Codex

## Reviewer

Independent blind AI reviewer

## Создана

2026-07-28

## Последнее обновление

2026-07-30

## Проблема

Добавленный ранее `--font-display` не устранил неоднозначную цепочку font-token, а мобильная hero-секция использует чрезмерный минимальный размер заголовка, жёсткие цвета, accent-градиенты и неточный текст.

## Цель

Зафиксировать дизайн-правила, обеспечить явное разделение heading/body fonts и получить читаемую hero-секцию в viewport 390×844 с подтверждённой визуальной проверкой.

## Затрагиваемые модули

- `CLAUDE.md`;
- `AGENTS.md`;
- `apps/frontend/app/globals.css`;
- `apps/frontend/app/layout.tsx`;
- `apps/frontend/components/landing/hero.tsx`.

## Разрешённый scope

- design tokens и anti-slop правила;
- обязательный visual QA workflow;
- font variable wiring;
- текст и responsive layout hero-секции.

## Явно запрещённый scope

- auth, profiles, discovery, API, database, Docker, CI/CD, PII и product claims;
- редизайн остальных секций лендинга.

## Scope-check

Изменение изолировано на корневых design instructions и presentation-слое публичного лендинга. Оно не меняет данные, API, security/privacy behavior или пользовательские права. Owner подтвердил точный scope исходной постановкой 2026-07-28.

## План проверки

- `corepack pnpm --dir apps/frontend lint`;
- `corepack pnpm --dir apps/frontend typecheck`;
- `corepack pnpm --dir apps/frontend build`;
- `git diff --check`;
- `chrome-devtools-mcp`: viewport 390×844, `take_snapshot`, `take_screenshot`, `list_console_messages`;
- independent blind review по `docs/AI_REVIEW_PROTOCOL.md`.

## Definition of Done

- корневой `CLAUDE.md` содержит оба требуемых раздела;
- heading/body fonts связаны с `next/font` без неоднозначного промежуточного token;
- hero не переполняет мобильный viewport, использует semantic tokens и один solid accent;
- visual evidence и console result зафиксированы;
- применимые quality gates и blind review завершены.

## Документация для обновления

- `CLAUDE.md`;
- `AGENTS.md` — только ссылка на обязательные design/visual QA правила; общие workflow, security и Git rules не меняются;
- `PROJECT_STATE.md` и `ROADMAP.md` не обновляются: задача оформлена по полному процессу, но не меняет project capability/state, roadmap status, priority или dependencies.

## Evidence после выполнения

- `corepack pnpm --dir apps/frontend lint` — exit 0, 18 pre-existing warnings, 0 errors.
- `corepack pnpm --dir apps/frontend typecheck` — exit 0.
- `corepack pnpm --dir apps/frontend build` — exit 0.
- `git diff --check` — exit 0.
- Independent blind review: T066-02 исправлен; T066-01 остаётся verified до visual QA.

### Visual QA (2026-07-30, chrome-devtools-mcp)

Окружение: `corepack pnpm dev` на `http://localhost:3000`, эмуляция мобильного устройства `390x844x3, mobile, touch`
(оконный `resize_page` на Windows не даёт ширину меньше ~500px, поэтому viewport задан через device emulation).

- `take_snapshot` — a11y-дерево лендинга получено. В hero ровно один `heading level=1` «Замечать. Слышать. Сближаться.»,
  далее tagline, sub-текст и два link-а: `Познакомиться` → `/join`, `Войти` → `/signin`. Скрытых или дублирующих узлов нет.
- `take_screenshot` — что видно на экране: тёмный obsidian-фон без градиентов; сверху навбар `YUNI / BY PINK RABBIT`,
  переключатель `RU / EN` и иконка меню. Ниже — розовая линия-акцент и eyebrow `ЗНАКОМСТВА БЕЗ СПЕШКИ` капсом с широким трекингом.
  Заголовок Cormorant Garamond в три строки, левое выравнивание: «Замечать.» (foreground), «Слышать.» курсивом (muted-foreground),
  «Сближаться.» solid-акцентом primary. Строка «Сближаться.» — самая широкая, помещается в ширину экрана с полем справа, без переносов и обрезки.
  Ниже курсивный tagline в две строки, sub-текст Inter в три строки и строка CTA: solid-розовая кнопка «Познакомиться» со стрелкой
  и текстовая ссылка «Войти». Вся hero-секция помещается в один экран 390×844: низ кнопки на y≈674 из 844, вертикального обрезания нет.
- Измерено в рантайме: `document.scrollWidth = 390`, горизонтального overflow нет; `heroHeight = 844`;
  `h1` — `Cormorant Garamond`, `62.4px` (clamp сработал), тело страницы — `Inter`; `document.fonts.status = loaded`.
- Соответствие Design tokens: CTA `background-color: oklch(0.65 0.26 12)` (`--primary`), `background-image: none` (градиента нет),
  `border-radius: 12px` = `--shape-radius-md`, `box-shadow: 0 1px 2px oklch(0 0 0 / 0.18)` = `--elevation-sm`.
  Внутри hero не найдено ни одного элемента с `background-image: gradient`. `grep` по `hero.tsx` не находит
  `text-gray*`, hex-цветов, `gradient`, `shadow-lg`, `rounded-2xl/3xl`. Эмодзи не используются, иконка — `ArrowRight` из lucide.
- `list_console_messages` — ровно одно сообщение: `[error] Failed to load resource: net::ERR_CONNECTION_REFUSED`.
  По `list_network_requests` это `POST http://localhost:4000/auth/refresh` из `AuthProvider`: backend в этой сессии не поднимался.
  Ошибка окружения, не связана с изменениями задачи; новых ошибок из-за font/hero изменений в консоли нет.

Вывод: visual QA пройден, отклонений от Design tokens и Anti-AI-slop checklist не выявлено, правок по итогам проверки не потребовалось.

### Согласование AGENTS.md и CLAUDE.md (2026-07-30)

- Git-правило «всегда работать в отдельной ветке, никогда не коммитить в `main`» теперь есть в обоих файлах:
  в `AGENTS.md` — полный раздел «Git workflow» (источник истины, правило усилено с «не пушить» до «не коммитить и не пушить»),
  в `CLAUDE.md` — короткий раздел с тем же правилом и ссылкой на `AGENTS.md`.
- Design tokens и anti-AI-slop checklist остаются только в `CLAUDE.md`; в `AGENTS.md` это зафиксировано явно как ссылка без дублирования.
  Взаимоисключающих формулировок между файлами не найдено, содержание не потеряно.

## История статуса

- 2026-07-28: created, scope-check confirmed by owner request, implementation started.
- 2026-07-28: blocked on browser visual QA; static checks passed; blind review T066-01 remains verified.
- 2026-07-30: visual QA выполнен через chrome-devtools-mcp (snapshot + screenshot + console), отклонений нет;
  AGENTS.md и CLAUDE.md приведены к согласованному источнику правды; статус переведён в done.
