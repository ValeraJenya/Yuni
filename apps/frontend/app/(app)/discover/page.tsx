"use client"

import { useState } from "react"
import { SlidersHorizontal, RefreshCw, Sparkles, MapPin, ChevronDown, Lock, X, Check, Wifi, ShieldCheck } from "lucide-react"
import { ProfileCard } from "@/features/discover/components/profile-card"
import { RevealProfileCard } from "@/features/discover/components/reveal-profile-card"
import { SwipeActions } from "@/features/discover/components/swipe-actions"
import { useProfileReveal } from "@/features/discover/hooks/use-profile-reveal"
import { DISCOVER_PROFILES } from "@/mock-data/profiles"
import type { SwipeAction } from "@/types/app"
import { ApiError } from "@/lib/auth-api"
import { likesApi } from "@/lib/likes-api"
import { useAuth } from "@/lib/auth-context"
import { useLang } from "@/lib/lang-context"

const distances = [3, 12, 7, 4, 9, 5]

const copy = {
  ru: {
    eyebrow: "Для тебя",
    filters: "Фильтры",
    empty: "Пока все закончились.",
    emptySub: "Скоро появятся новые анкеты. Возвращайся позже.",
    resetBtn: "Начать снова",
    likeToast: "Лайк",
    superToast: "Суперлайк",
    passToast: "Пропустить",
    matchBanner: "Это взаимно",
    matchSub: "Вы с",
    matchSub2: "понравились друг другу",
    matchCta: "Написать первой",
    matchSkip: "Продолжить",
    rangeLabel: "Возраст",
    distanceLabel: "Расстояние",
    km: "км",
    nearby: "Рядом",
    online: "В сети",
    verified: "Верифицированы",
    actionError: "Не удалось сохранить действие. Попробуйте ещё раз.",
  },
  en: {
    eyebrow: "For you",
    filters: "Filters",
    empty: "You've seen everyone for now.",
    emptySub: "New profiles will appear soon. Check back later.",
    resetBtn: "Start over",
    likeToast: "Liked",
    superToast: "Super like",
    passToast: "Passed",
    matchBanner: "It's a match",
    matchSub: "You and",
    matchSub2: "liked each other",
    matchCta: "Say hi",
    matchSkip: "Keep swiping",
    rangeLabel: "Age",
    distanceLabel: "Distance",
    km: "km",
    nearby: "Nearby",
    online: "Online",
    verified: "Verified",
    actionError: "Could not save this action. Try again.",
  },
}

// ─── FilterSheet ─────────────────────────────────────────────────────────────

interface FilterState {
  ageMin: number
  ageMax: number
  distanceKm: number
  onlyNearby: boolean
  onlyOnline: boolean
  onlyVerified: boolean
}

const defaultFilters: FilterState = {
  ageMin: 22,
  ageMax: 34,
  distanceKm: 50,
  onlyNearby: false,
  onlyOnline: false,
  onlyVerified: false,
}

function FilterToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl transition-all"
      style={{
        background: active ? "oklch(0.65 0.26 12 / 0.10)" : "oklch(0.12 0.010 15 / 0.60)",
        border: active ? "1px solid oklch(0.65 0.26 12 / 0.25)" : "1px solid oklch(0.20 0.010 15 / 0.55)",
        boxShadow: active ? "0 0 14px oklch(0.65 0.26 12 / 0.08)" : "none",
      }}
    >
      <span style={{ color: active ? "oklch(0.65 0.26 12 / 0.80)" : "oklch(0.36 0.008 15)" }}>
        {icon}
      </span>
      <span
        className="flex-1 text-left font-sans"
        style={{ fontSize: "13px", color: active ? "oklch(0.88 0.005 60)" : "oklch(0.50 0.008 15)" }}
      >
        {label}
      </span>
      <span
        className="flex items-center justify-center rounded-full transition-all flex-shrink-0"
        style={{
          width: "20px",
          height: "20px",
          background: active ? "oklch(0.65 0.26 12)" : "oklch(0.18 0.010 15)",
          border: active ? "none" : "1px solid oklch(0.26 0.010 15)",
          boxShadow: active ? "0 0 10px oklch(0.65 0.26 12 / 0.40)" : "none",
        }}
      >
        {active && <Check size={11} color="white" strokeWidth={2.5} />}
      </span>
    </button>
  )
}

function FilterSheet({
  open,
  onClose,
  filters,
  onChange,
  lang,
}: {
  open: boolean
  onClose: () => void
  filters: FilterState
  onChange: (f: FilterState) => void
  lang: "ru" | "en"
}) {
  const [draft, setDraft] = useState<FilterState>(filters)

  function apply() {
    onChange(draft)
    onClose()
  }

  function reset() {
    setDraft(defaultFilters)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "oklch(0.04 0.005 15 / 0.75)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 md:right-auto md:top-0 md:bottom-0 z-50 flex flex-col"
        style={{
          background: "oklch(0.095 0.012 15)",
          border: "1px solid oklch(0.18 0.012 15 / 0.80)",
          borderRadius: "24px 24px 0 0",
          maxHeight: "88dvh",
          overflowY: "auto",
          boxShadow: "0 -24px 80px oklch(0.03 0.005 15 / 0.80)",
          // Desktop: side panel
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {/* Handle / header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid oklch(0.16 0.010 15 / 0.60)" }}
        >
          <div>
            <span
              className="font-sans uppercase tracking-[0.18em]"
              style={{ fontSize: "9px", color: "oklch(0.65 0.26 12 / 0.65)" }}
            >
              {lang === "ru" ? "Параметры поиска" : "Search filters"}
            </span>
            <h2
              className="font-display font-light mt-0.5"
              style={{ fontSize: "1.25rem", color: "oklch(0.90 0.005 60)", lineHeight: 1.1 }}
            >
              {lang === "ru" ? "Фильтры" : "Filters"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-all"
            style={{ color: "oklch(0.36 0.008 15)", background: "oklch(0.14 0.010 15 / 0.70)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.60 0.006 60)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.36 0.008 15)")}
            aria-label={lang === "ru" ? "Закрыть" : "Close"}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 px-6 py-6">

          {/* Age range */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-sans" style={{ fontSize: "12px", color: "oklch(0.48 0.008 15)" }}>
                {lang === "ru" ? "Возраст" : "Age"}
              </span>
              <span
                className="font-sans font-medium"
                style={{ fontSize: "12px", color: "oklch(0.72 0.005 60)" }}
              >
                {draft.ageMin} — {draft.ageMax}
              </span>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="sr-only">{lang === "ru" ? "Минимальный возраст" : "Min age"}</label>
                <input
                  type="range"
                  min={18}
                  max={draft.ageMax - 1}
                  value={draft.ageMin}
                  onChange={(e) => setDraft((d) => ({ ...d, ageMin: Number(e.target.value) }))}
                  className="w-full"
                  style={{ accentColor: "oklch(0.65 0.26 12)" }}
                />
              </div>
              <div className="flex-1">
                <label className="sr-only">{lang === "ru" ? "Максимальный возраст" : "Max age"}</label>
                <input
                  type="range"
                  min={draft.ageMin + 1}
                  max={60}
                  value={draft.ageMax}
                  onChange={(e) => setDraft((d) => ({ ...d, ageMax: Number(e.target.value) }))}
                  className="w-full"
                  style={{ accentColor: "oklch(0.65 0.26 12)" }}
                />
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-sans" style={{ fontSize: "12px", color: "oklch(0.48 0.008 15)" }}>
                {lang === "ru" ? "Расстояние" : "Distance"}
              </span>
              <span
                className="font-sans font-medium"
                style={{ fontSize: "12px", color: "oklch(0.72 0.005 60)" }}
              >
                {draft.distanceKm} {lang === "ru" ? "км" : "km"}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={200}
              value={draft.distanceKm}
              onChange={(e) => setDraft((d) => ({ ...d, distanceKm: Number(e.target.value) }))}
              className="w-full"
              style={{ accentColor: "oklch(0.65 0.26 12)" }}
              aria-label={lang === "ru" ? "Расстояние" : "Distance"}
            />
          </div>

          {/* Quick toggles */}
          <div className="flex flex-col gap-2">
            <FilterToggle
              active={draft.onlyNearby}
              onClick={() => setDraft((d) => ({ ...d, onlyNearby: !d.onlyNearby }))}
              icon={<MapPin size={15} strokeWidth={1.5} />}
              label={lang === "ru" ? "Рядом со мной" : "Nearby only"}
            />
            <FilterToggle
              active={draft.onlyOnline}
              onClick={() => setDraft((d) => ({ ...d, onlyOnline: !d.onlyOnline }))}
              icon={<Wifi size={15} strokeWidth={1.5} />}
              label={lang === "ru" ? "Только онлайн" : "Online now"}
            />
            <FilterToggle
              active={draft.onlyVerified}
              onClick={() => setDraft((d) => ({ ...d, onlyVerified: !d.onlyVerified }))}
              icon={<ShieldCheck size={15} strokeWidth={1.5} />}
              label={lang === "ru" ? "Верифицированные" : "Verified profiles"}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center gap-3 px-6 py-5 flex-shrink-0 mt-auto"
          style={{ borderTop: "1px solid oklch(0.16 0.010 15 / 0.60)" }}
        >
          <button
            onClick={reset}
            className="flex-1 rounded-full py-3 font-sans transition-all"
            style={{
              fontSize: "12.5px",
              color: "oklch(0.42 0.008 15)",
              background: "oklch(0.13 0.010 15 / 0.70)",
              border: "1px solid oklch(0.22 0.010 15 / 0.60)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.60 0.006 60)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.42 0.008 15)")}
          >
            {lang === "ru" ? "Сбросить" : "Reset"}
          </button>
          <button
            onClick={apply}
            className="flex-1 rounded-full py-3 font-sans font-medium transition-all hover:brightness-110"
            style={{
              fontSize: "12.5px",
              color: "white",
              background: "oklch(0.65 0.26 12)",
              boxShadow: "0 0 22px oklch(0.65 0.26 12 / 0.28)",
            }}
          >
            {lang === "ru" ? "Применить" : "Apply"}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── SideBlock — locked/revealed sidebar section ──────────────────────────────

function SideBlock({
  unlocked,
  onUnlock,
  lockHint,
  children,
}: {
  unlocked: boolean
  onUnlock: (() => void) | null
  lockHint: string
  children: React.ReactNode
}) {
  return (
    <div
      role={onUnlock && !unlocked ? "button" : undefined}
      tabIndex={onUnlock && !unlocked ? 0 : undefined}
      aria-label={!unlocked ? lockHint : undefined}
      onClick={() => { if (onUnlock && !unlocked) onUnlock() }}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && onUnlock && !unlocked) onUnlock() }}
      className="relative overflow-hidden rounded-2xl transition-all"
      style={{
        background: "oklch(0.10 0.012 15 / 0.85)",
        border: unlocked
          ? "1px solid oklch(0.20 0.014 15 / 0.55)"
          : "1px solid oklch(0.18 0.012 15 / 0.50)",
        boxShadow: unlocked
          ? "0 8px 32px oklch(0.04 0.005 15 / 0.40), inset 0 1px 0 oklch(0.28 0.010 15 / 0.10)"
          : "0 4px 20px oklch(0.04 0.005 15 / 0.25)",
        cursor: onUnlock && !unlocked ? "pointer" : "default",
      }}
    >
      {/* Locked state overlay */}
      {!unlocked && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 z-10"
          style={{
            backdropFilter: "blur(14px) brightness(0.55)",
            WebkitBackdropFilter: "blur(14px) brightness(0.55)",
            background: "oklch(0.08 0.010 15 / 0.60)",
          }}
        >
          <Lock
            size={14}
            style={{ color: "oklch(0.75 0.012 55 / 0.55)", strokeWidth: 1.5 }}
          />
          <span
            className="font-sans text-center px-4"
            style={{
              fontSize: "10.5px",
              color: "oklch(0.50 0.008 15)",
              letterSpacing: "0.02em",
              lineHeight: 1.5,
            }}
          >
            {lockHint}
          </span>
        </div>
      )}

      {/* Content — always rendered, just obscured when locked */}
      <div
        style={{
          opacity: unlocked ? 1 : 0,
          transform: unlocked ? "translateY(0)" : "translateY(4px)",
          transition: "opacity 0.50s cubic-bezier(0.22,1,0.36,1), transform 0.50s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  const { lang } = useLang()
  const { authenticatedRequest } = useAuth()
  const t = copy[lang]

  const [stack, setStack] = useState(DISCOVER_PROFILES)
  const [matchProfile, setMatchProfile] = useState<typeof DISCOVER_PROFILES[0] | null>(null)
  const [lastAction, setLastAction] = useState<SwipeAction | null>(null)
  const [toastKey, setToastKey] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [pendingAction, setPendingAction] = useState<SwipeAction | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const current = stack[0]
  const next = stack[1]
  const third = stack[2]

  // Derived filter state
  const activeFilterCount = [
    filters.ageMin !== defaultFilters.ageMin,
    filters.ageMax !== defaultFilters.ageMax,
    filters.distanceKm !== defaultFilters.distanceKm,
    filters.onlyNearby,
    filters.onlyOnline,
    filters.onlyVerified,
  ].filter(Boolean).length
  const filtersActive = activeFilterCount > 0

  // Reveal state — scoped to the current profile; resets automatically when profile id changes
  const reveal = useProfileReveal(current?.id ?? "")

  const externalReveal = current ? {
    unlockedZones: reveal.state.unlockedZones,
    visibleSegments: reveal.visibleSegments,
    totalSegments: reveal.TOTAL_SEGMENTS,
    unlockZone: reveal.unlockZone,
  } : undefined

  async function handleAction(action: SwipeAction) {
    if (!current || pendingAction || action === "superlike") return

    const targetProfileUserId = current.id
    setPendingAction(action)
    setActionError(null)

    try {
      if (action === "like") {
        await likesApi.likeProfile(authenticatedRequest, targetProfileUserId)
      } else {
        await likesApi.skipProfile(authenticatedRequest, targetProfileUserId)
      }

      setLastAction(action)
      setToastKey((key) => key + 1)
      setStack((profiles) =>
        profiles[0]?.id === targetProfileUserId
          ? profiles.slice(1)
          : profiles.filter((profile) => profile.id !== targetProfileUserId),
      )
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : t.actionError)
    } finally {
      setPendingAction(null)
    }
  }

  function reset() {
    setStack(DISCOVER_PROFILES)
    setMatchProfile(null)
    setLastAction(null)
  }

  return (
    <div className="relative min-h-screen flex flex-col md:pl-[220px]">

      {/* ── Header ───────────────────────────────────────── */}
      <header className="yuni-discover-header flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex flex-col gap-0.5">
          <span
            className="font-sans font-medium tracking-[0.22em] uppercase"
            style={{ fontSize: "9px", color: "oklch(0.65 0.26 12 / 0.70)", letterSpacing: "0.20em" }}
          >
            {t.eyebrow}
          </span>
          <span
            className="font-display font-light tracking-[-0.01em]"
            style={{ fontSize: "1.35rem", color: "oklch(0.88 0.005 60)", lineHeight: 1.1 }}
          >
            {lang === "ru" ? "Поиск" : "Discover"}
          </span>
        </div>
        <button
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-2 rounded-full px-4 py-2 font-sans transition-all relative"
          style={{
            fontSize: "11.5px",
            color: filtersActive ? "oklch(0.88 0.005 60)" : "oklch(0.50 0.008 15)",
            background: filtersActive ? "oklch(0.65 0.26 12 / 0.12)" : "oklch(0.12 0.012 15 / 0.85)",
            border: filtersActive ? "1px solid oklch(0.65 0.26 12 / 0.28)" : "1px solid oklch(0.22 0.012 15 / 0.70)",
            backdropFilter: "blur(10px)",
            boxShadow: filtersActive ? "0 0 16px oklch(0.65 0.26 12 / 0.10)" : "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "oklch(0.65 0.26 12 / 0.30)"
            e.currentTarget.style.color = "oklch(0.72 0.005 60)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = filtersActive ? "oklch(0.65 0.26 12 / 0.28)" : "oklch(0.22 0.012 15 / 0.70)"
            e.currentTarget.style.color = filtersActive ? "oklch(0.88 0.005 60)" : "oklch(0.50 0.008 15)"
          }}
          aria-label={t.filters}
        >
          <SlidersHorizontal size={13} />
          {t.filters}
          {filtersActive && (
            <span
              className="flex items-center justify-center rounded-full font-sans font-semibold text-white"
              style={{
                width: "14px",
                height: "14px",
                fontSize: "8px",
                background: "oklch(0.65 0.26 12)",
                boxShadow: "0 0 8px oklch(0.65 0.26 12 / 0.50)",
              }}
            >
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={11} style={{ opacity: 0.5 }} />
        </button>
      </header>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="yuni-discover-main flex-1 flex flex-col md:flex-row md:items-start gap-0 px-4 pb-8 md:justify-center">

        {stack.length === 0 ? (
          <div className="flex flex-col items-center gap-7 text-center max-w-sm py-20 mx-auto">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.65 0.26 12 / 0.07)",
                border: "1px solid oklch(0.65 0.26 12 / 0.16)",
                boxShadow: "0 0 40px oklch(0.65 0.26 12 / 0.08)",
              }}
            >
              <Sparkles size={28} style={{ color: "oklch(0.65 0.26 12 / 0.60)" }} strokeWidth={1.5} />
            </div>
            <div>
              <p
                className="font-display font-light mb-3"
                style={{ fontSize: "1.75rem", color: "oklch(0.78 0.005 60)", lineHeight: 1.05 }}
              >
                {t.empty}
              </p>
              <p
                className="font-sans leading-relaxed"
                style={{ fontSize: "13px", color: "oklch(0.36 0.008 15)" }}
              >
                {t.emptySub}
              </p>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-full px-8 py-3.5 font-sans font-medium transition-all hover:brightness-110"
              style={{
                fontSize: "13px",
                color: "white",
                background: "oklch(0.65 0.26 12)",
                boxShadow: "0 0 32px oklch(0.65 0.26 12 / 0.32)",
              }}
            >
              <RefreshCw size={13} />
              {t.resetBtn}
            </button>
          </div>
        ) : (
          <>
            {/* ── Card stage ── */}
            <div className="yuni-discover-stage flex flex-col items-center gap-6 md:sticky md:pt-2 md:self-start">
              {/* Card stack */}
              {/*
                Stack layout:
                - Outer wrapper sizes to the card width
                - Ghost wrappers are absolute, positioned offset behind the active card
                - RevealProfileCard renders in normal flow (card + controls below)
                - Ghost cards only visually overlap the card photo portion (not the controls)
              */}
              <div className="yuni-discover-cardwrap" style={{ position: "relative" }}>
                {/* Ghost card 3 — furthest back */}
                {third && (
                  <div
                    className="absolute inset-x-0"
                    style={{
                      top: "20px",
                      transform: "scale(0.90)",
                      transformOrigin: "bottom center",
                      zIndex: 1,
                      opacity: 0.22,
                      filter: "blur(1.5px)",
                      pointerEvents: "none",
                    }}
                    aria-hidden="true"
                  >
                    <ProfileCard profile={third} distance={distances[2]} />
                  </div>
                )}
                {/* Ghost card 2 */}
                {next && (
                  <div
                    className="absolute inset-x-0"
                    style={{
                      top: "11px",
                      transform: "scale(0.954)",
                      transformOrigin: "bottom center",
                      zIndex: 2,
                      opacity: 0.52,
                      pointerEvents: "none",
                    }}
                    aria-hidden="true"
                  >
                    <ProfileCard profile={next} distance={distances[1]} />
                  </div>
                )}
                {/* Active card with veil reveal */}
                <div style={{ position: "relative", zIndex: 3 }}>
                  <RevealProfileCard
                    profile={current}
                    distance={distances[0]}
                    lang={lang}
                    externalReveal={externalReveal}
                  />
                </div>
              </div>

              {/* Stack progress dots */}
              <div className="flex items-center gap-1.5">
                {stack.slice(0, Math.min(stack.length, 6)).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === 0 ? "22px" : "5px",
                      height: "3px",
                      borderRadius: "2px",
                      background:
                        i === 0
                          ? "oklch(0.65 0.26 12)"
                          : "oklch(0.65 0.26 12 / 0.20)",
                      transition: "all 0.25s",
                    }}
                  />
                ))}
              </div>

              {/* Action buttons */}
              <SwipeActions
                onAction={handleAction}
                disabled={Boolean(pendingAction)}
                showSuperlike={false}
              />
              {actionError && (
                <p
                  className="font-sans text-center max-w-xs"
                  role="status"
                  style={{
                    fontSize: "12px",
                    color: "oklch(0.70 0.16 28)",
                    lineHeight: 1.5,
                  }}
                >
                  {actionError}
                </p>
              )}
            </div>

            {/* ── Desktop sidebar panel ── */}
            <aside className="yuni-discover-aside hidden md:flex flex-col gap-3 pt-2" style={{ flexShrink: 0 }}>

              {/* Identity block — revealed by tapping the photo */}
              <SideBlock
                unlocked={reveal.state.unlockedZones.has("identity")}
                onUnlock={null}
                lockHint={lang === "ru" ? "Нажмите на фото, чтобы открыть" : "Tap the photo to unveil"}
              >
                <div className="px-5 py-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className="font-display font-light tracking-[-0.01em]"
                        style={{ fontSize: "1.50rem", color: "oklch(0.94 0.004 60)", lineHeight: 1.05 }}
                      >
                        {current.name}
                        <span
                          className="font-sans font-light ml-2"
                          style={{ fontSize: "1.05rem", color: "oklch(0.50 0.006 60)" }}
                        >
                          {current.age}
                        </span>
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <MapPin size={10} style={{ color: "oklch(0.65 0.26 12 / 0.75)" }} />
                        <span className="font-sans" style={{ fontSize: "11.5px", color: "oklch(0.44 0.008 15)" }}>
                          {current.city}
                          {distances[0] !== undefined && (
                            <span style={{ color: "oklch(0.32 0.008 15)" }}> · {distances[0]} {t.km}</span>
                          )}
                        </span>
                      </div>
                    </div>
                    {current.isOnline && (
                      <span
                        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans font-medium flex-shrink-0 mt-0.5"
                        style={{
                          fontSize: "9.5px",
                          color: "oklch(0.80 0.18 145)",
                          background: "oklch(0.78 0.20 145 / 0.09)",
                          border: "1px solid oklch(0.78 0.20 145 / 0.22)",
                        }}
                      >
                        <span
                          style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            background: "oklch(0.78 0.20 145)",
                            display: "inline-block",
                            boxShadow: "0 0 5px oklch(0.78 0.20 145 / 0.70)",
                          }}
                        />
                        {lang === "ru" ? "В сети" : "Online"}
                      </span>
                    )}
                  </div>
                </div>
              </SideBlock>

              {/* Bio block — click to unlock */}
              {current.bio && (
                <SideBlock
                  unlocked={reveal.state.unlockedZones.has("description")}
                  onUnlock={() => reveal.unlockZone("description")}
                  lockHint={lang === "ru" ? "Нажмите, чтобы прочитать историю" : "Tap to read her story"}
                >
                  <div className="px-5 py-5">
                    <p
                      className="font-sans leading-relaxed"
                      style={{ fontSize: "13px", color: "oklch(0.54 0.006 15)", lineHeight: "1.65" }}
                    >
                      {current.bio}
                    </p>
                  </div>
                </SideBlock>
              )}

              {/* Interests block — click to unlock */}
              {current.interests.length > 0 && (
                <SideBlock
                  unlocked={reveal.state.unlockedZones.has("tags")}
                  onUnlock={() => reveal.unlockZone("tags")}
                  lockHint={lang === "ru" ? "Нажмите, чтобы открыть интересы" : "Tap to reveal interests"}
                >
                  <div className="px-5 py-5 flex flex-wrap gap-2">
                    {current.interests.map((tag) => (
                      <span
                        key={tag}
                        className="font-sans rounded-full px-3 py-1.5"
                        style={{
                          fontSize: "11px",
                          color: "oklch(0.52 0.008 15)",
                          background: "oklch(0.12 0.012 15 / 0.80)",
                          border: "1px solid oklch(0.22 0.012 15 / 0.60)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </SideBlock>
              )}

              {/* Details block — click to unlock */}
              <SideBlock
                unlocked={reveal.state.unlockedZones.has("details")}
                onUnlock={() => reveal.unlockZone("details")}
                lockHint={lang === "ru" ? "Нажмите, чтобы узнать детали" : "Tap to see details"}
              >
                <div className="px-5 py-5">
                  <div className="flex flex-col gap-3.5">
                    {current.occupation && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-sans" style={{ fontSize: "11px", color: "oklch(0.30 0.008 15)" }}>
                          {lang === "ru" ? "Работа" : "Work"}
                        </span>
                        <span className="font-sans text-right" style={{ fontSize: "12.5px", color: "oklch(0.60 0.006 60)" }}>
                          {current.occupation}
                        </span>
                      </div>
                    )}
                    {current.education && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-sans" style={{ fontSize: "11px", color: "oklch(0.30 0.008 15)" }}>
                          {lang === "ru" ? "Образование" : "Education"}
                        </span>
                        <span className="font-sans text-right" style={{ fontSize: "12.5px", color: "oklch(0.60 0.006 60)" }}>
                          {current.education}
                        </span>
                      </div>
                    )}
                    {current.languages && current.languages.length > 0 && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-sans" style={{ fontSize: "11px", color: "oklch(0.30 0.008 15)" }}>
                          {lang === "ru" ? "Языки" : "Languages"}
                        </span>
                        <span className="font-sans text-right" style={{ fontSize: "12.5px", color: "oklch(0.60 0.006 60)" }}>
                          {current.languages.join(", ")}
                        </span>
                      </div>
                    )}
                    {current.height && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-sans" style={{ fontSize: "11px", color: "oklch(0.30 0.008 15)" }}>
                          {lang === "ru" ? "Рост" : "Height"}
                        </span>
                        <span className="font-sans" style={{ fontSize: "12.5px", color: "oklch(0.60 0.006 60)" }}>
                          {current.height} {t.km === "км" ? "см" : "cm"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </SideBlock>

            </aside>
          </>
        )}
      </div>

      {/* ── Action toast ─────────────────────────────────── */}
      {lastAction && (
        <div
          key={toastKey}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{ animation: "fadeUpOut 1.3s ease forwards" }}
        >
          <span
            className="font-sans font-semibold rounded-full px-5 py-2.5"
            style={{
              fontSize: "12px",
              letterSpacing: "0.06em",
              color:
                lastAction === "pass"
                  ? "oklch(0.50 0.008 15)"
                  : lastAction === "superlike"
                  ? "oklch(0.72 0.20 220)"
                  : "oklch(0.85 0.18 12)",
              background: "oklch(0.11 0.012 15 / 0.94)",
              border:
                lastAction === "pass"
                  ? "1px solid oklch(0.22 0.010 15)"
                  : lastAction === "superlike"
                  ? "1px solid oklch(0.65 0.20 220 / 0.28)"
                  : "1px solid oklch(0.65 0.26 12 / 0.30)",
              backdropFilter: "blur(14px)",
              boxShadow:
                lastAction === "like"
                  ? "0 0 24px oklch(0.65 0.26 12 / 0.18)"
                  : "none",
            }}
          >
            {lastAction === "like" ? t.likeToast : lastAction === "superlike" ? t.superToast : t.passToast}
          </span>
        </div>
      )}

      {/* ── Match overlay ────────────────────────────────── */}
      {matchProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{
            background: "oklch(0.04 0.010 15 / 0.92)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: [
                "radial-gradient(ellipse at 50% 38%, oklch(0.65 0.26 12 / 0.14) 0%, transparent 55%)",
                "radial-gradient(ellipse at 50% 82%, oklch(0.48 0.22 18 / 0.08) 0%, transparent 55%)",
              ].join(", "),
            }}
          />
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: "1px",
              background:
                "linear-gradient(to right, transparent, oklch(0.65 0.26 12 / 0.35) 35%, oklch(0.65 0.26 12 / 0.35) 65%, transparent)",
            }}
          />

          <div className="relative flex flex-col items-center gap-8 text-center max-w-xs w-full">
            <div className="flex items-center gap-3">
              <span className="h-px w-8" style={{ background: "oklch(0.65 0.26 12 / 0.40)" }} />
              <span
                className="font-sans font-medium tracking-[0.22em] uppercase"
                style={{ fontSize: "9px", color: "oklch(0.65 0.26 12 / 0.80)" }}
              >
                {lang === "ru" ? "Совпадение" : "Match"}
              </span>
              <span className="h-px w-8" style={{ background: "oklch(0.65 0.26 12 / 0.40)" }} />
            </div>

            <div className="flex items-center">
              <div
                className="overflow-hidden rounded-full"
                style={{
                  width: "76px",
                  height: "76px",
                  border: "2px solid oklch(0.65 0.26 12 / 0.45)",
                  boxShadow: "0 0 28px oklch(0.65 0.26 12 / 0.22)",
                  zIndex: 2,
                  position: "relative",
                }}
              >
                <img src="/hero-portrait.jpg" alt="Ты" className="w-full h-full object-cover" />
              </div>
              <div
                className="flex items-center justify-center rounded-full z-10 mx-[-10px]"
                style={{
                  width: "30px",
                  height: "30px",
                  background: "oklch(0.65 0.26 12)",
                  boxShadow: "0 0 22px oklch(0.65 0.26 12 / 0.55)",
                  fontSize: "13px",
                  position: "relative",
                  border: "2px solid oklch(0.05 0.010 15)",
                }}
              >
                <span style={{ color: "white", lineHeight: 1 }}>♥</span>
              </div>
              <div
                className="overflow-hidden rounded-full"
                style={{
                  width: "76px",
                  height: "76px",
                  border: "2px solid oklch(0.65 0.26 12)",
                  boxShadow: "0 0 32px oklch(0.65 0.26 12 / 0.38)",
                  zIndex: 2,
                  position: "relative",
                }}
              >
                <img
                  src={matchProfile.photos[0]}
                  alt={matchProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div>
              <p
                className="font-display font-light mb-2"
                style={{ fontSize: "2.5rem", color: "oklch(0.94 0.004 60)", lineHeight: 0.95 }}
              >
                {t.matchBanner}
              </p>
              <p
                className="font-sans leading-relaxed"
                style={{ fontSize: "13px", color: "oklch(0.42 0.008 15)" }}
              >
                {t.matchSub}{" "}
                <span style={{ color: "oklch(0.68 0.008 15)" }}>{matchProfile.name}</span>{" "}
                — {t.matchSub2}.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <a
                href="/messages"
                className="w-full flex items-center justify-center rounded-full py-4 font-sans font-semibold text-white transition-all hover:brightness-110"
                style={{
                  fontSize: "13px",
                  background: "oklch(0.65 0.26 12)",
                  boxShadow: "0 0 36px oklch(0.65 0.26 12 / 0.38), 0 4px 18px oklch(0.04 0.005 15 / 0.55)",
                  letterSpacing: "0.02em",
                }}
              >
                {t.matchCta}
              </a>
              <button
                onClick={() => setMatchProfile(null)}
                className="w-full rounded-full py-3 font-sans font-medium transition-all"
                style={{
                  fontSize: "13px",
                  color: "oklch(0.36 0.008 15)",
                  border: "1px solid oklch(0.18 0.010 15)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "oklch(0.55 0.006 60)"
                  e.currentTarget.style.borderColor = "oklch(0.28 0.010 15)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "oklch(0.36 0.008 15)"
                  e.currentTarget.style.borderColor = "oklch(0.18 0.010 15)"
                }}
              >
                {t.matchSkip}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUpOut {
          0%   { opacity: 0; transform: translateX(-50%) translateY(10px); }
          18%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          72%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
        .scrollbar-none { scrollbar-width: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }

        /* ──────────────────────────────────────────────────────────────
           Discover desktop-only composition scaling.
           Goal: make the whole Discover page feel "closer" on wide
           displays (especially 4K) — approximating the backup at ~175%
           browser zoom — via page-level fluid tokens. Card and sidebar
           proportions stay near backup values on typical monitors and
           only scale up together on very wide viewports, so their
           visual relationship and breathing room are preserved.
           Mobile is untouched.
           ────────────────────────────────────────────────────────────── */
        .yuni-discover-cardwrap {
          width: min(340px, calc(100vw - 32px));
        }

        @media (min-width: 768px) {
          .yuni-discover-header {
            padding-left: clamp(2.5rem, 2vw, 5rem);
            padding-right: clamp(2.5rem, 2vw, 5rem);
            padding-top: clamp(2rem, 1.6vw, 3.25rem);
            padding-bottom: clamp(1.25rem, 1.1vw, 2rem);
          }
          .yuni-discover-main {
            padding-left: clamp(2.5rem, 2vw, 5rem);
            padding-right: clamp(2.5rem, 2vw, 5rem);
            gap: clamp(3rem, 2.4vw, 5.25rem);
          }
          .yuni-discover-stage {
            top: clamp(1.5rem, 1.2vw, 2.75rem);
          }
          .yuni-discover-cardwrap {
            width: clamp(340px, 12.5vw, 460px);
          }
          .yuni-discover-aside {
            width: clamp(268px, 10.5vw, 380px);
          }
        }
      `}</style>

      {/* ── Filter sheet ── */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
        lang={lang}
      />
    </div>
  )
}
