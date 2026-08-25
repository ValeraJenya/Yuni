# Yuni design rules

Этот файл — источник истины по design tokens, anti-AI-slop checklist и visual QA.
Общий workflow, scope rules, security и Git-правила описаны в `AGENTS.md`; здесь они не дублируются.

## Git workflow

- Никогда не коммитить и не пушить напрямую в `main`. Всегда работать в отдельной ветке.
- Push своей ветки в origin — можно и нужно: review диффа идёт именно по запушенной ветке.
- Открытие Pull Request и merge выполняет владелец репозитория вручную.
- Полные Git-правила (push/PR, rebase, destructive-команды, `git add .`, проверка staged files) — в разделе «Git workflow» файла `AGENTS.md`.

## Design tokens

Новые и изменяемые экраны должны использовать семантические CSS-переменные из `apps/frontend/app/globals.css`, а не разрозненные literal-значения.

```css
:root {
  /* Warm neutral palette */
  --background: oklch(0.09 0.008 15);
  --card: oklch(0.12 0.01 15);
  --muted: oklch(0.16 0.008 15);
  --foreground: oklch(0.96 0.005 60);
  --muted-foreground: oklch(0.55 0.01 15);
  --border: oklch(0.2 0.01 15);

  /* The only accent; use it as a solid color, never as a gradient */
  --primary: oklch(0.65 0.26 12);
  --primary-foreground: oklch(0.98 0 0);

  /* Exactly three product radii */
  --shape-radius-sm: 0.5rem;
  --shape-radius-md: 0.75rem;
  --shape-radius-lg: 1.25rem;

  /* Exactly two product shadows */
  --elevation-sm: 0 1px 2px oklch(0 0 0 / 0.18);
  --elevation-md: 0 16px 40px oklch(0 0 0 / 0.28);

  /* next/font injects these variables on body */
  --font-heading: "Cormorant Garamond", serif;
  --font-body: "Inter", sans-serif;
}
```

- `--font-heading` используется для заголовков и коротких эмоциональных акцентов.
- `--font-body` используется для основного текста, навигации, форм и контролов.
- Дополнительные accent-цвета, accent-градиенты, radius и тени не добавляются без отдельного design review.
- Компоненты в `apps/frontend/components/ui` не используют `dark:`-варианты: приложение всегда тёмное и набор токенов один, поэтому `dark:`-класс не альтернатива, а мёртвое переопределение, побеждающее по специфичности над base. При добавлении нового компонента из shadcn `dark:`-классы убираются по тому же правилу: значение из `dark:` поднимается на место base-класса (если оба целятся в одно свойство/селектор), а если base-аналога нет — класс просто теряет префикс `dark:`.

### Anti-AI-slop checklist

- [ ] Нет фиолетово-розовых градиентов.
- [ ] `shadow-lg` не используется на всём подряд; применяются только `--elevation-sm` и `--elevation-md`.
- [ ] Один и тот же `rounded-2xl` не повторяется на всех элементах; radius выбирается из трёх `--shape-radius-*` токенов по иерархии.
- [ ] Эмодзи не подменяют иконки; используются иконки из принятого набора.
- [ ] Нет шаблонного ряда из трёх одинаковых SaaS-карточек.
- [ ] Нет прямого `text-gray-600`; цвет текста берётся из семантических токенов.
- [ ] На не-лендинговых страницах нет идеально центрированного hero с двумя одинаково заметными кнопками.

## Визуальная проверка

Любой PR с изменением вёрстки обязательно проверяется через `chrome-devtools-mcp` до перевода задачи в completed:

1. Открыть каждый изменённый экран в мобильном viewport `390×844`.
2. Выполнить `take_snapshot`.
3. Выполнить `take_screenshot` и визуально сверить экран с Design tokens и Anti-AI-slop checklist.
4. Выполнить `list_console_messages` и убедиться, что изменение не добавило новых ошибок.
5. Зафиксировать в task/PR evidence, что было видно на screenshot, и результат проверки консоли.

Без snapshot, screenshot, console check и явного визуального подтверждения задача с изменением вёрстки не считается выполненной.

### Панель Issues и клиентская навигация

Панель DevTools Issues не очищается при клиентской (SPA/pushState) навигации Next.js — только при полной перезагрузке страницы. Issue, найденный на одном экране, может «доехать» на следующий при переходе по внутренней ссылке и ошибочно приписаться не тому месту (см. Task 081). Поэтому каждый экран при проверке Issues открывается полной перезагрузкой (`navigate` по URL или `reload`, не клик по ссылке внутри приложения) — иначе находка может относиться к экрану, с которого пришли, а не к тому, что открыт сейчас.

Находки из Issues в `docs/audits/frontend-inventory-2026-08-20.md` собраны без этого правила и могут быть приписаны не тем экранам — сам отчёт не правится (он датирован), но при повторной проверке по нему это стоит иметь в виду.
