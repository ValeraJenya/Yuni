"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth-context"

type AuthenticatedRequest = <T>(
  path: string,
  options?: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown },
) => Promise<T>

interface UseSettingsResourceOptions<TSettings> {
  /** Должна быть стабильной ссылкой — объявляй вне компонента. */
  load: (request: AuthenticatedRequest) => Promise<TSettings>
  /** Должна быть стабильной ссылкой — объявляй вне компонента. */
  save: (
    request: AuthenticatedRequest,
    payload: Partial<TSettings>,
  ) => Promise<TSettings>
}

interface UseSettingsResourceResult<TSettings> {
  settings: TSettings | null
  isLoading: boolean
  isSaving: boolean
  loadError: boolean
  saveError: boolean
  update: (payload: Partial<TSettings>) => void
}

/**
 * Общая механика обоих экранов настроек: загрузка, оптимистичное применение
 * переключателя и откат при ошибке.
 *
 * Откат обязателен: без него тумблер показывал бы состояние, которого нет на
 * сервере, — ровно то, в чём и заключалась исходная проблема неработающих
 * кнопок. Лучше вернуть переключатель назад и сказать об ошибке.
 */
export function useSettingsResource<TSettings extends object>({
  load,
  save,
}: UseSettingsResourceOptions<TSettings>): UseSettingsResourceResult<TSettings> {
  const { authenticatedRequest, isLoading: authLoading } = useAuth()
  const [settings, setSettings] = useState<TSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [saveError, setSaveError] = useState(false)

  // Актуальное значение нужно синхронно в обработчике: запрос нельзя посылать
  // из функции-обновителя useState — в StrictMode она вызывается дважды, и
  // сохранение ушло бы на сервер два раза.
  const settingsRef = useRef<TSettings | null>(null)

  const applySettings = useCallback((next: TSettings) => {
    settingsRef.current = next
    setSettings(next)
  }, [])

  useEffect(() => {
    if (authLoading) {
      return
    }

    let active = true

    load(authenticatedRequest)
      .then((loaded) => {
        if (!active) return
        applySettings(loaded)
        setLoadError(false)
      })
      .catch(() => {
        if (!active) return
        setLoadError(true)
      })
      .finally(() => {
        if (!active) return
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [applySettings, authLoading, authenticatedRequest, load])

  const update = useCallback(
    (payload: Partial<TSettings>) => {
      const previous = settingsRef.current

      if (!previous) {
        return
      }

      applySettings({ ...previous, ...payload })
      setIsSaving(true)
      setSaveError(false)

      save(authenticatedRequest, payload)
        .then((saved) => {
          applySettings(saved)
        })
        .catch(() => {
          applySettings(previous)
          setSaveError(true)
        })
        .finally(() => {
          setIsSaving(false)
        })
    },
    [applySettings, authenticatedRequest, save],
  )

  return { settings, isLoading, isSaving, loadError, saveError, update }
}
