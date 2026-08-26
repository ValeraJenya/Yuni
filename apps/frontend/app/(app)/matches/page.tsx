"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Ban, Clock, Flag, Flame, Heart } from "lucide-react"
import { ApiError } from "@/lib/auth-api"
import { blocksApi } from "@/lib/blocks-api"
import { useAuth } from "@/lib/auth-context"
import { useLang } from "@/lib/lang-context"
import { matchesApi, type MatchSummary } from "@/lib/matches-api"
import { resolveProfilePhotoUrl } from "@/lib/profile-api"
import { reportsApi } from "@/lib/reports-api"

const copy = {
  ru: {
    eyebrow: "Взаимная симпатия",
    title: "Матчи",
    empty: "Пока нет матчей.",
    emptySub: "Зайди в поиск и поставь несколько лайков.",
    discoverCta: "Перейти в поиск",
    loading: "Загружаем матчи...",
    loadError: "Не удалось загрузить матчи.",
    blockLabel: "Заблокировать",
    reportLabel: "Пожаловаться",
    blockConfirm: (name: string) => `Заблокировать ${name}? Матч исчезнет.`,
    blockSuccess: "Пользователь заблокирован.",
    blockError: "Не удалось заблокировать пользователя.",
    reportSuccess: "Жалоба отправлена.",
    reportError: "Не удалось отправить жалобу.",
    conversationError: "Не удалось открыть чат.",
    online: "В сети",
    expiresIn: (days: number, hours: number) =>
      days > 0 ? `Истекает через ${days} д` : `Истекает через ${hours} ч`,
    justMatched: "Только что",
    minutesAgo: (m: number) => `${m} мин назад`,
    hoursAgo: (h: number) => `${h} ч назад`,
    daysAgo: (d: number) => `${d} д назад`,
    inMessages: "Продолжается в чате",
    activeNote: (n: number) =>
      n === 1 ? "1 активный матч" : `${n} активных матча`,
  },
  en: {
    eyebrow: "Mutual interest",
    title: "Matches",
    empty: "No matches yet.",
    emptySub: "Head to Discover and start liking profiles.",
    discoverCta: "Go to Discover",
    loading: "Loading matches...",
    loadError: "Could not load matches.",
    blockLabel: "Block",
    reportLabel: "Report",
    blockConfirm: (name: string) => `Block ${name}? This match will disappear.`,
    blockSuccess: "User blocked.",
    blockError: "Could not block this user.",
    reportSuccess: "Report sent.",
    reportError: "Could not send report.",
    conversationError: "Could not open chat.",
    online: "Online",
    expiresIn: (days: number, hours: number) =>
      days > 0 ? `Expires in ${days}d` : `Expires in ${hours}h`,
    justMatched: "Just now",
    minutesAgo: (m: number) => `${m}m ago`,
    hoursAgo: (h: number) => `${h}h ago`,
    daysAgo: (d: number) => `${d}d ago`,
    inMessages: "Ongoing in Messages",
    activeNote: (n: number) =>
      n === 1 ? "1 active match" : `${n} active matches`,
  },
}

function relativeTime(isoDate: string, nowMs: number, t: typeof copy["ru"]) {
  const diff = (nowMs - new Date(isoDate).getTime()) / 1000
  if (diff < 120) return t.justMatched
  if (diff < 3600) return t.minutesAgo(Math.floor(diff / 60))
  if (diff < 86400) return t.hoursAgo(Math.floor(diff / 3600))
  return t.daysAgo(Math.floor(diff / 86400))
}

function timeUntilExpiry(expiresAt: string, nowMs: number, t: typeof copy["ru"]) {
  const remaining = new Date(expiresAt).getTime() - nowMs
  if (remaining <= 0) return null
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return t.expiresIn(days, hours)
}

export default function MatchesPage() {
  const { lang } = useLang()
  const { authenticatedRequest, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const t = copy[lang]
  const [matches, setMatches] = useState<MatchSummary[]>([])
  const [isMatchesLoading, setIsMatchesLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [moderationError, setModerationError] = useState<string | null>(null)
  const [moderationMessage, setModerationMessage] = useState<string | null>(null)
  const [conversationError, setConversationError] = useState<string | null>(null)
  const [pendingModerationUserId, setPendingModerationUserId] = useState<
    string | null
  >(null)
  const [pendingConversationMatchId, setPendingConversationMatchId] = useState<
    string | null
  >(null)
  const [nowMs, setNowMs] = useState(0)

  useEffect(() => {
    if (authLoading) {
      return
    }

    let active = true
    const requestStartedAt = Date.now()

    matchesApi
      .getMyMatches(authenticatedRequest)
      .then((response) => {
        if (active) {
          setNowMs(requestStartedAt)
          setLoadError(null)
          setConversationError(null)
          setMatches(response.matches)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof ApiError ? error.message : t.loadError)
        }
      })
      .finally(() => {
        if (active) {
          setIsMatchesLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [authLoading, authenticatedRequest, t.loadError])

  async function blockMatch(match: MatchSummary) {
    const targetUserId = match.matchedProfile.userId
    const profileName = match.matchedProfile.displayName ?? match.matchedProfile.handle

    if (
      pendingModerationUserId ||
      !window.confirm(t.blockConfirm(profileName))
    ) {
      return
    }

    setPendingModerationUserId(targetUserId)
    setModerationError(null)
    setModerationMessage(null)
    setConversationError(null)

    try {
      await blocksApi.blockUser(authenticatedRequest, targetUserId)
      setMatches((current) => current.filter((item) => item.id !== match.id))
      setModerationMessage(t.blockSuccess)
    } catch (error) {
      setModerationError(error instanceof ApiError ? error.message : t.blockError)
    } finally {
      setPendingModerationUserId(null)
    }
  }

  async function reportMatch(match: MatchSummary) {
    const targetUserId = match.matchedProfile.userId

    if (pendingModerationUserId) {
      return
    }

    setPendingModerationUserId(targetUserId)
    setModerationError(null)
    setModerationMessage(null)
    setConversationError(null)

    try {
      await reportsApi.reportUser(authenticatedRequest, {
        targetUserId,
        reason: "other",
      })
      setModerationMessage(t.reportSuccess)
    } catch (error) {
      setModerationError(error instanceof ApiError ? error.message : t.reportError)
    } finally {
      setPendingModerationUserId(null)
    }
  }

  async function openConversation(match: MatchSummary) {
    if (pendingConversationMatchId) {
      return
    }

    setModerationError(null)
    setModerationMessage(null)
    setConversationError(null)

    if (match.conversationId) {
      router.push(
        `/messages?conversation=${encodeURIComponent(match.conversationId)}`,
      )
      return
    }

    setPendingConversationMatchId(match.id)

    try {
      const response = await matchesApi.startConversation(
        authenticatedRequest,
        match.id,
      )
      setMatches((current) =>
        current.map((item) =>
          item.id === match.id
            ? {
                ...item,
                conversationId: response.conversation.conversationId,
                conversationStarted: true,
              }
            : item,
        ),
      )
      router.push(
        `/messages?conversation=${encodeURIComponent(
          response.conversation.conversationId,
        )}`,
      )
    } catch (error) {
      setConversationError(
        error instanceof ApiError ? error.message : t.conversationError,
      )
    } finally {
      setPendingConversationMatchId(null)
    }
  }

  const activeMatches = matches.filter(
    (match) =>
      match.status === "active" && new Date(match.expiresAt).getTime() > nowMs,
  )

  return (
    <div className="min-h-screen flex flex-col md:pl-[220px]">

      {/* ── Header ───────────────────────────────────────── */}
      <header className="px-5 pt-6 pb-6 md:px-10 md:pt-8 md:pb-7">
        <span
          className="font-sans font-medium tracking-[0.20em] uppercase block mb-1"
          style={{ fontSize: "9px", color: "color-mix(in oklab, var(--primary) 70%, transparent)" }}
        >
          {t.eyebrow}
        </span>
        <div className="flex items-center gap-3">
          <h1
            className="font-display font-light tracking-[-0.01em]"
            style={{ fontSize: "1.55rem", color: "var(--text-5)", lineHeight: 1.1 }}
          >
            {t.title}
          </h1>
          {activeMatches.length > 0 && (
            <span
              className="flex items-center justify-center rounded-full font-sans font-semibold text-white"
              style={{
                width: "22px",
                height: "22px",
                fontSize: "10px",
                background: "var(--primary)",
                boxShadow: "0 0 14px color-mix(in oklab, var(--primary) 45%, transparent)",
              }}
            >
              {activeMatches.length}
            </span>
          )}
        </div>
        {activeMatches.length > 0 && (
          <p
            className="font-sans mt-1.5"
            style={{ fontSize: "12px", color: "var(--surface-4)" }}
          >
            {t.activeNote(activeMatches.length)}
          </p>
        )}
      </header>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="flex-1 px-4 md:px-8 pb-24 md:pb-12">
        {(moderationError || conversationError || moderationMessage) && (
          <p
            className="font-sans mb-4 rounded-xl px-4 py-3"
            role="status"
            style={{
              fontSize: "12px",
              color: moderationError || conversationError
                // The hue-25 family has two visible levels but only one token.
                ? "oklch(0.60 0.18 25 / 0.85)"
                // The hue-145 family has two visible levels but only one token.
                : "oklch(0.62 0.15 145 / 0.85)",
              background: "color-mix(in oklab, var(--popover) 80%, transparent)",
              border: moderationError || conversationError
                ? "1px solid color-mix(in oklab, var(--destructive) 25%, transparent)"
                // The hue-145 family has two visible levels but only one token.
                : "1px solid oklch(0.62 0.15 145 / 0.22)",
            }}
          >
            {moderationError ?? conversationError ?? moderationMessage}
          </p>
        )}
        {isMatchesLoading ? (
          <div className="flex flex-col items-center gap-4 text-center py-20">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "color-mix(in oklab, var(--primary) 7%, transparent)",
                border: "1px solid color-mix(in oklab, var(--primary) 14%, transparent)",
              }}
            >
              <Heart size={20} style={{ color: "color-mix(in oklab, var(--primary) 55%, transparent)" }} strokeWidth={1.5} />
            </div>
            <p className="font-sans" style={{ fontSize: "13px", color: "var(--surface-6)" }}>
              {t.loading}
            </p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-4 text-center py-20">
            <p className="font-display font-light" style={{ fontSize: "1.4rem", color: "var(--text-3)" }}>
              {t.loadError}
            </p>
            <p className="font-sans max-w-xs" style={{ fontSize: "13px", color: "var(--surface-6)" }}>
              {loadError}
            </p>
          </div>
        ) : activeMatches.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-6 text-center py-20">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "color-mix(in oklab, var(--primary) 7%, transparent)",
                border: "1px solid color-mix(in oklab, var(--primary) 14%, transparent)",
                boxShadow: "0 0 36px color-mix(in oklab, var(--primary) 6%, transparent)",
              }}
            >
              <Heart size={22} style={{ color: "color-mix(in oklab, var(--primary) 55%, transparent)" }} strokeWidth={1.5} />
            </div>
            <div>
              <p
                className="font-display font-light mb-2"
                style={{ fontSize: "1.55rem", color: "var(--text-3)", lineHeight: 1.05 }}
              >
                {t.empty}
              </p>
              <p className="font-sans" style={{ fontSize: "13px", color: "var(--surface-5)" }}>
                {t.emptySub}
              </p>
            </div>
            <Link
              href="/discover"
              className="flex items-center gap-2 rounded-full px-7 py-3.5 font-sans font-medium transition-all hover:brightness-110"
              style={{
                fontSize: "13px",
                color: "white",
                background: "var(--primary)",
                boxShadow: "0 0 26px color-mix(in oklab, var(--primary) 30%, transparent)",
              }}
            >
              <Flame size={13} />
              {t.discoverCta}
            </Link>
          </div>
        ) : (
          /* Match grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {activeMatches.map((match) => {
              const profileName = match.matchedProfile.displayName ?? match.matchedProfile.handle
              const primaryPhotoUrl = resolveProfilePhotoUrl(
                match.matchedProfile.primaryPhotoUrl,
              )
              const expiry = timeUntilExpiry(match.expiresAt, nowMs, t)
              const isModerationPending =
                pendingModerationUserId === match.matchedProfile.userId
              const isConversationPending =
                pendingConversationMatchId === match.id
              const isExpiringSoon =
                new Date(match.expiresAt).getTime() - nowMs < 2 * 24 * 60 * 60 * 1000

              return (
                <div
                  key={match.id}
                  className="group relative rounded-2xl overflow-hidden transition-all"
                  style={{
                    aspectRatio: "3/4",
                    background: "var(--background)",
                    border: match.conversationStarted
                      ? "1px solid var(--rose-glow)"
                      : "1px solid color-mix(in oklab, var(--carbon) 65%, transparent)",
                    boxShadow: match.conversationStarted
                      ? "0 4px 24px color-mix(in oklab, var(--primary) 12%, transparent), 0 0 0 1px color-mix(in oklab, var(--primary) 6%, transparent)"
                      : "0 4px 16px color-mix(in oklab, var(--surface-1) 40%, transparent)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "color-mix(in oklab, var(--primary) 36%, transparent)"
                    e.currentTarget.style.boxShadow =
                      "0 8px 36px color-mix(in oklab, var(--primary) 16%, transparent), 0 0 0 1px color-mix(in oklab, var(--primary) 10%, transparent)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = match.conversationStarted
                      ? "var(--rose-glow)"
                      : "color-mix(in oklab, var(--carbon) 65%, transparent)"
                    e.currentTarget.style.boxShadow = match.conversationStarted
                      ? "0 4px 24px color-mix(in oklab, var(--primary) 12%, transparent), 0 0 0 1px color-mix(in oklab, var(--primary) 6%, transparent)"
                      : "0 4px 16px color-mix(in oklab, var(--surface-1) 40%, transparent)"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => void openConversation(match)}
                    disabled={Boolean(pendingConversationMatchId)}
                    aria-label={profileName}
                    className="absolute inset-0 z-10 disabled:cursor-wait"
                  />
                  {primaryPhotoUrl ? (
                    <Image
                      src={primaryPhotoUrl}
                      alt={profileName}
                      fill
                      draggable={false}
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: "var(--surface-2)",
                        color: "color-mix(in oklab, var(--primary) 70%, transparent)",
                      }}
                    >
                      <Heart size={28} strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Vignette */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: [
                        "linear-gradient(to top, color-mix(in oklab, var(--surface-1) 96%, transparent) 0%, color-mix(in oklab, var(--surface-1) 55%, transparent) 32%, transparent 58%)",
                        "linear-gradient(to bottom, color-mix(in oklab, var(--surface-1) 28%, transparent) 0%, transparent 20%)",
                      ].join(", "),
                    }}
                  />

                  {/* Unread badge */}
                  {match.conversationStarted && (
                    <div
                      className="absolute top-3 right-3"
                      style={{
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        background: "var(--primary)",
                        boxShadow: "0 0 10px color-mix(in oklab, var(--primary) 75%, transparent)",
                        border: "1.5px solid var(--surface-1)",
                      }}
                    />
                  )}

                  {isConversationPending && (
                    <div
                      className="absolute inset-0 z-10 flex items-center justify-center"
                      style={{ background: "color-mix(in oklab, var(--surface-1) 30%, transparent)" }}
                    >
                      <span
                        className="rounded-full px-3 py-1.5 font-sans"
                        style={{
                          fontSize: "11px",
                          color: "var(--text-5)",
                          background: "color-mix(in oklab, var(--background) 76%, transparent)",
                          border: "1px solid color-mix(in oklab, var(--surface-3) 70%, transparent)",
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        {lang === "ru" ? "Открываем..." : "Opening..."}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 z-20 flex gap-1.5">
                    <button
                      type="button"
                      title={t.reportLabel}
                      aria-label={t.reportLabel}
                      disabled={Boolean(pendingModerationUserId)}
                      onClick={() => void reportMatch(match)}
                      className="flex h-7 w-7 items-center justify-center rounded-full transition-all disabled:opacity-45"
                      style={{
                        color: "var(--text-5)",
                        background: "color-mix(in oklab, var(--surface-1) 78%, transparent)",
                        border: "1px solid color-mix(in oklab, var(--surface-4) 58%, transparent)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Flag size={12} strokeWidth={1.7} />
                    </button>
                    <button
                      type="button"
                      title={t.blockLabel}
                      aria-label={t.blockLabel}
                      disabled={Boolean(pendingModerationUserId)}
                      onClick={() => void blockMatch(match)}
                      className="flex h-7 w-7 items-center justify-center rounded-full transition-all disabled:opacity-45"
                      style={{
                        color: isModerationPending
                          // The hue-25 family has two visible levels but only one token.
                          ? "oklch(0.60 0.18 25 / 0.65)"
                          : "var(--text-5)",
                        background: "color-mix(in oklab, var(--surface-1) 78%, transparent)",
                        border: "1px solid color-mix(in oklab, var(--destructive) 34%, transparent)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Ban size={12} strokeWidth={1.7} />
                    </button>
                  </div>

                  {/* Online indicator */}
                  {/* Expiry indicator — only shows when close to expiring */}
                  {isExpiringSoon && expiry && (
                    <div
                      className="absolute bottom-0 left-0 right-0 px-3 pt-6 pb-3 flex items-end justify-between"
                    >
                      <div>
                        <p
                          className="font-display font-light"
                          style={{
                            fontSize: "1.05rem",
                            color: "var(--foreground)",
                            lineHeight: 1.15,
                            textShadow: "0 2px 12px color-mix(in oklab, var(--surface-1) 80%, transparent)",
                          }}
                        >
                          {profileName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock size={9} style={{ color: "color-mix(in oklab, var(--primary) 70%, transparent)" }} />
                          <span
                            className="font-sans"
                            style={{ fontSize: "9.5px", color: "color-mix(in oklab, var(--primary) 70%, transparent)" }}
                          >
                            {expiry}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Normal info — no expiry warning */}
                  {!isExpiringSoon && (
                    <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-4">
                      <p
                        className="font-display font-light"
                        style={{
                          fontSize: "1.05rem",
                          color: "var(--foreground)",
                          lineHeight: 1.1,
                          textShadow: "0 2px 12px color-mix(in oklab, var(--surface-1) 80%, transparent)",
                        }}
                      >
                        {profileName}
                      </p>
                      <p
                        className="font-sans mt-0.5"
                        style={{ fontSize: "10px", color: "var(--surface-5)" }}
                      >
                        {relativeTime(match.matchedAt, nowMs, t)}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
