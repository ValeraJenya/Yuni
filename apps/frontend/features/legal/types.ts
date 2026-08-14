export type Lang = "ru" | "en"

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  /** Нейтральная выноска: важное уточнение, не требующее действий. */
  | { kind: "note"; text: string }
  /**
   * Незакрытый вопрос: юридические реквизиты, которые обязан заполнить
   * оператор, либо честное признание, что функция ещё не реализована.
   * Рендерится подчёркнуто заметно, чтобы такой блок нельзя было
   * случайно опубликовать незамеченным.
   */
  | { kind: "todo"; text: string }

export interface LegalSection {
  /** Якорь для оглавления и прямых ссылок вида /privacy#data-we-collect. */
  id: string
  title: string
  blocks: LegalBlock[]
}

export interface LegalDocument {
  /** Надзаголовок в стиле лендинга, например «Правовая информация». */
  eyebrow: string
  title: string
  /** Человекочитаемая дата последней редакции. */
  updated: string
  updatedLabel: string
  intro: string[]
  sections: LegalSection[]
  tocLabel: string
}

export type LegalContent = Record<Lang, LegalDocument>
