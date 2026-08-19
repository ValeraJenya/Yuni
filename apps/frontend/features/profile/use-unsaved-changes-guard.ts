"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface UnsavedChangesGuard {
  /** Куда пользователь пытался уйти. `null` — попытки не было. */
  pendingHref: string | null
  /** Уйти всё-таки, потеряв черновик. */
  discardAndLeave: () => void
  /** Остаться на странице. */
  stay: () => void
}

/**
 * Task 069: не даёт молча потерять незаполненный черновик анкеты.
 *
 * Две разные защиты:
 *
 * 1. `beforeunload` — перезагрузка, закрытие вкладки, уход на внешний адрес.
 *    Диалог рисует браузер, текст задать нельзя.
 * 2. Перехват кликов по внутренним ссылкам на фазе capture — переходы внутри
 *    приложения. App Router не даёт официального router guard, поэтому клик
 *    гасится до того, как `next/link` его увидит, а решение принимает экран.
 *
 * Чего он не ловит: кнопку «Назад» в браузере. Отменить `popstate` можно
 * только повторным `pushState`, и тогда история пользователя оказывается
 * переписанной — цена выше пользы. Кнопки «Сохранить»/«Отмена» видны всё
 * время, пока панель открыта, так что этот путь остаётся сознательным.
 */
export function useUnsavedChangesGuard(isBlocking: boolean): UnsavedChangesGuard {
  const router = useRouter()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    if (!isBlocking) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Legacy-путь: часть браузеров всё ещё требует непустой returnValue,
      // чтобы показать диалог.
      event.returnValue = ""
    }

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return
      }

      // Ctrl/Cmd/Shift-клик открывает ссылку в новой вкладке или окне —
      // текущая страница с черновиком никуда не девается.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target
      const anchor =
        target instanceof Element ? target.closest("a[href]") : null

      if (!(anchor instanceof HTMLAnchorElement)) {
        return
      }

      if (anchor.hasAttribute("download")) {
        return
      }

      if (anchor.target && anchor.target !== "_self") {
        return
      }

      const destination = new URL(anchor.href, window.location.href)

      if (destination.origin !== window.location.origin) {
        return
      }

      const nextHref = `${destination.pathname}${destination.search}${destination.hash}`
      const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`

      if (nextHref === currentHref) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      setPendingHref(nextHref)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("click", handleClick, true)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("click", handleClick, true)
    }
  }, [isBlocking])

  const discardAndLeave = useCallback(() => {
    const href = pendingHref

    setPendingHref(null)

    if (href) {
      router.push(href)
    }
  }, [pendingHref, router])

  const stay = useCallback(() => {
    setPendingHref(null)
  }, [])

  return { pendingHref, discardAndLeave, stay }
}
