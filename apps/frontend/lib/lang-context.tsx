"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import type { Lang } from "@/types/auth"

const STORAGE_KEY = "yuni.lang"
const DEFAULT_LANG: Lang = "ru"

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggle: () => void
}

const LangContext = createContext<LangContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  toggle: () => {},
})

/**
 * Task 052: выбранный язык хранится вне React.
 *
 * Провайдер монтируется один раз в корневом layout, поэтому состояние
 * переживает переходы между `(auth)` и `(app)` — раньше это были два
 * независимых инстанса, и язык сбрасывался на `ru` после логина.
 *
 * Чтение идёт через useSyncExternalStore, а не через useState + useEffect:
 * серверный снапшот всегда отдаёт значение по умолчанию, клиентский —
 * сохранённое, и React сам делает повторный рендер после гидратации. Это
 * избавляет и от расхождения разметки, и от setState внутри эффекта.
 */
const listeners = new Set<() => void>()
let cachedLang: Lang | null = null

function isLang(value: unknown): value is Lang {
  return value === "ru" || value === "en"
}

function readStoredLang(): Lang {
  if (cachedLang !== null) {
    return cachedLang
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    cachedLang = isLang(stored) ? stored : DEFAULT_LANG
  } catch {
    // Приватный режим и заблокированное хранилище не должны ронять интерфейс.
    cachedLang = DEFAULT_LANG
  }

  return cachedLang
}

function getServerSnapshot(): Lang {
  return DEFAULT_LANG
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)

  // Синхронизация между вкладками: `storage` приходит только в другие
  // вкладки, поэтому свой кеш там нужно сбросить перед перечитыванием.
  function onStorage(event: StorageEvent) {
    if (event.key !== null && event.key !== STORAGE_KEY) {
      return
    }

    cachedLang = null
    onStoreChange()
  }

  window.addEventListener("storage", onStorage)

  return () => {
    listeners.delete(onStoreChange)
    window.removeEventListener("storage", onStorage)
  }
}

function writeLang(next: Lang): void {
  if (cachedLang === next) {
    return
  }

  cachedLang = next

  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Значение всё равно останется в памяти до перезагрузки страницы.
  }

  for (const listener of listeners) {
    listener()
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readStoredLang, getServerSnapshot)

  const setLang = useCallback((next: Lang) => {
    writeLang(next)
  }, [])

  const toggle = useCallback(() => {
    writeLang(readStoredLang() === "ru" ? "en" : "ru")
  }, [])

  // `<html lang>` задаётся статически в корневом layout и без этого остаётся
  // `ru` навсегда — скринридеры и автоперевод читали бы английский интерфейс
  // как русский текст.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(
    () => ({ lang, setLang, toggle }),
    [lang, setLang, toggle],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}
