# Yuni design rules

Этот файл — источник истины по design tokens, anti-AI-slop checklist и visual QA.
Общий workflow, scope rules, security и Git-правила описаны в `AGENTS.md`; здесь они не дублируются.

## Git workflow

- Никогда не коммитить и не пушить напрямую в `main`. Всегда работать в отдельной ветке.
- Push в origin и открытие Pull Request выполняет владелец репозитория вручную; агент останавливается на коммите в ветку.
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
