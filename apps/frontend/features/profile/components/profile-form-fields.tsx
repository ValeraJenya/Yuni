"use client"

import { useEffect, useId, useRef } from "react"
import type { Lang } from "@/types/auth"
import { profileFormCopy } from "../copy"
import {
  PROFILE_FORM_FIELDS,
  type ProfileFormFieldKey,
  type ProfileFormState,
} from "../form-state"

export interface ProfileFieldFocusRequest {
  field: ProfileFormFieldKey
  /**
   * Растёт с каждым запросом фокуса. Без него повторный переход к тому же
   * полю не сработал бы: значение `field` не изменилось, и эффект не
   * перезапустился бы.
   */
  nonce: number
}

interface ProfileFormFieldsProps {
  lang: Lang
  value: ProfileFormState
  onChange: <K extends keyof ProfileFormState>(
    key: K,
    next: ProfileFormState[K],
  ) => void
  disabled?: boolean
  /** Поля, которые нужно подсветить как незаполненные (по требованию экрана). */
  highlight?: readonly ProfileFormFieldKey[]
  focusRequest?: ProfileFieldFocusRequest | null
}

const LABEL_STYLE = {
  fontSize: "11px",
  letterSpacing: "0.14em",
  color: "var(--muted-foreground)",
} as const

const CONTROL_STYLE = {
  fontSize: "14px",
  color: "var(--foreground)",
  background: "var(--input)",
  border: "1px solid var(--border)",
  borderRadius: "var(--shape-radius-md)",
  caretColor: "var(--primary)",
} as const

/**
 * Общая анкета профиля: подписи над полями, звёздочка у обязательных,
 * никакого автосохранения. Экран сам решает, что делать с черновиком —
 * профиль (Task 069) сохраняет по кнопке, онбординг (Task 070) отправляет
 * форму целиком.
 */
export function ProfileFormFields({
  lang,
  value,
  onChange,
  disabled = false,
  highlight,
  focusRequest = null,
}: ProfileFormFieldsProps) {
  const t = profileFormCopy[lang]
  const idPrefix = useId()
  const controlsRef = useRef<
    Partial<Record<ProfileFormFieldKey, HTMLElement | null>>
  >({})

  useEffect(() => {
    if (!focusRequest) {
      return
    }

    const control = controlsRef.current[focusRequest.field]

    control?.scrollIntoView({ behavior: "smooth", block: "center" })
    control?.focus({ preventScroll: true })
  }, [focusRequest])

  return (
    <div className="flex flex-col gap-5">
      <p
        className="font-sans"
        style={{ fontSize: "11.5px", lineHeight: 1.55, color: "var(--muted-foreground)" }}
      >
        {t.requiredLegend}
      </p>

      {PROFILE_FORM_FIELDS.map((field) => {
        const controlId = `${idPrefix}-${field.key}`
        const copy = t.fields[field.key]
        const isHighlighted = highlight?.includes(field.key) ?? false
        const controlStyle = {
          ...CONTROL_STYLE,
          borderColor: isHighlighted ? "var(--destructive)" : "var(--border)",
        }

        return (
          <div key={field.key} className="flex flex-col gap-2">
            <label
              htmlFor={controlId}
              className="font-sans font-medium uppercase"
              style={LABEL_STYLE}
            >
              {copy.label}
              {field.required ? (
                <span style={{ color: "var(--primary)" }} aria-hidden="true">
                  {" *"}
                </span>
              ) : (
                <span
                  className="normal-case"
                  style={{ marginLeft: "6px", letterSpacing: "0.02em", opacity: 0.7 }}
                >
                  · {t.optionalMark}
                </span>
              )}
            </label>

            {field.kind === "textarea" ? (
              <textarea
                id={controlId}
                ref={(element) => {
                  controlsRef.current[field.key] = element
                }}
                value={value[field.key] ?? ""}
                onChange={(event) => onChange(field.key, event.target.value)}
                disabled={disabled}
                rows={5}
                maxLength={field.maxLength}
                placeholder={copy.placeholder}
                aria-required={field.required}
                className="w-full resize-none font-sans outline-none px-4 py-3 transition-colors disabled:opacity-60 focus:border-[var(--ring)]"
                style={{ ...controlStyle, lineHeight: 1.6 }}
              />
            ) : (
              <input
                id={controlId}
                ref={(element) => {
                  controlsRef.current[field.key] = element
                }}
                type="text"
                value={value[field.key] ?? ""}
                onChange={(event) => onChange(field.key, event.target.value)}
                disabled={disabled}
                maxLength={field.maxLength}
                autoComplete={field.autoComplete}
                placeholder={copy.placeholder}
                aria-required={field.required}
                className="w-full font-sans outline-none px-4 py-3 transition-colors disabled:opacity-60 focus:border-[var(--ring)]"
                style={controlStyle}
              />
            )}
          </div>
        )
      })}

      <label
        className="flex items-start gap-3 px-4 py-3.5"
        style={{
          background: "var(--input)",
          border: "1px solid var(--border)",
          borderRadius: "var(--shape-radius-md)",
        }}
      >
        <input
          type="checkbox"
          checked={value.isDiscoverable}
          onChange={(event) => onChange("isDiscoverable", event.target.checked)}
          disabled={disabled}
          className="mt-0.5 h-4 w-4 flex-shrink-0"
          style={{ accentColor: "var(--primary)" }}
        />
        <span className="flex flex-col gap-1">
          <span
            className="font-sans"
            style={{ fontSize: "13px", color: "var(--foreground)" }}
          >
            {t.discoverableLabel}
          </span>
          <span
            className="font-sans"
            style={{ fontSize: "11.5px", lineHeight: 1.5, color: "var(--muted-foreground)" }}
          >
            {t.discoverableHint}
          </span>
        </span>
      </label>
    </div>
  )
}
