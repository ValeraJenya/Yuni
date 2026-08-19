"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ElementType } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ShieldCheck,
  Star,
  Pencil,
  MapPin,
  Briefcase,
  GraduationCap,
  Languages,
  ChevronRight,
  LogOut,
  Lock,
  Bell,
  User,
  Camera,
  Plus,
  Trash2,
  Heart,
  TrendingUp,
} from "lucide-react"
import { ApiError } from "@/lib/auth-api"
import { defaultAvatarUrl } from "@/lib/default-avatar"
import { useAuth } from "@/lib/auth-context"
import { useLang } from "@/lib/lang-context"
import { matchesApi } from "@/lib/matches-api"
import {
  profileApi,
  resolveProfilePhotoUrl,
  type ProfileCompletionField,
  type SelfProfile,
  type UpdateProfileRequest,
} from "@/lib/profile-api"

type ProfileInfoRow = { icon: ElementType; label: string; value: string }

function isProfileInfoRow(row: ProfileInfoRow | undefined | null | false): row is ProfileInfoRow {
  return Boolean(row)
}

const copy = {
  ru: {
    edit: "Редактировать",
    verified: "Верифицирован",
    completion: "Заполнен на",
    completionCta: "Улучшить",
    completionMissing: "Не хватает",
    completionFields: {
      displayName: "имя",
      birthDate: "дата рождения",
      bio: "рассказ о себе",
      gender: "гендер",
      lookingFor: "кого ищете",
      city: "город",
      country: "страна",
      photo: "фото",
    },
    bioLabel: "О себе",
    profileFieldsLabel: "Профиль",
    displayNameLabel: "Имя",
    cityLabel: "Город",
    countryLabel: "Страна",
    genderLabel: "Гендер",
    discoverableLabel: "Показывать в поиске",
    saveLabel: "Сохранить",
    savingLabel: "Сохраняем...",
    savedLabel: "Сохранено",
    loadingLabel: "Загружаем профиль...",
    loadErrorLabel: "Не удалось загрузить профиль",
    saveErrorLabel: "Не удалось сохранить профиль",
    emptyBio: "Расскажите немного о себе.",
    emptyValue: "Не указано",
    interestsLabel: "Интересы",
    detailsLabel: "Детали",
    photosLabel: "Фотографии",
    statsLabel: "Статистика",
    height: "Рост",
    occupation: "Работа",
    education: "Образование",
    languages: "Языки",
    accountLabel: "Аккаунт",
    privacyLabel: "Конфиденциальность",
    notificationsLabel: "Уведомления",
    logoutLabel: "Выйти",
    lookingFor: "Ищу",
    cm: "см",
    likesReceived: "Лайков",
    matchesCount: "Матчей",
    profileViews: "Просмотров",
    addPhoto: "Добавить фото",
    setPrimaryPhoto: "Сделать основным",
    deletePhoto: "Удалить фото",
    uploadErrorLabel: "Не удалось загрузить фото",
    photoActionErrorLabel: "Не удалось обновить фото",
  },
  en: {
    edit: "Edit",
    verified: "Verified",
    completion: "Profile",
    completionCta: "Improve",
    completionMissing: "Missing",
    completionFields: {
      displayName: "name",
      birthDate: "date of birth",
      bio: "about me",
      gender: "gender",
      lookingFor: "looking for",
      city: "city",
      country: "country",
      photo: "photo",
    },
    bioLabel: "About me",
    profileFieldsLabel: "Profile",
    displayNameLabel: "Name",
    cityLabel: "City",
    countryLabel: "Country",
    genderLabel: "Gender",
    discoverableLabel: "Show in discover",
    saveLabel: "Save",
    savingLabel: "Saving...",
    savedLabel: "Saved",
    loadingLabel: "Loading profile...",
    loadErrorLabel: "Could not load profile",
    saveErrorLabel: "Could not save profile",
    emptyBio: "Tell people a little about yourself.",
    emptyValue: "Not set",
    interestsLabel: "Interests",
    detailsLabel: "Details",
    photosLabel: "Photos",
    statsLabel: "Stats",
    height: "Height",
    occupation: "Work",
    education: "Education",
    languages: "Languages",
    accountLabel: "Account",
    privacyLabel: "Privacy",
    notificationsLabel: "Notifications",
    logoutLabel: "Sign out",
    lookingFor: "Looking for",
    cm: "cm",
    likesReceived: "Likes",
    matchesCount: "Matches",
    profileViews: "Views",
    addPhoto: "Add photo",
    setPrimaryPhoto: "Set primary",
    deletePhoto: "Delete photo",
    uploadErrorLabel: "Could not upload photo",
    photoActionErrorLabel: "Could not update photo",
  },
}

/** Shown by a stat tile that has no data source yet — an em dash rather than
 *  a "0", which would be a claim about the user's actual counts. */
const NO_DATA = "—"

/** Missing fields the completion CTA can jump to, in the order they appear on
 *  this screen. birthDate is absent on purpose: it is required at registration
 *  and has no editor here, so there would be nothing to jump to. */
const COMPLETION_JUMP_ORDER: ProfileCompletionField[] = [
  "photo",
  "bio",
  "displayName",
  "city",
  "country",
  "gender",
  "lookingFor",
]

type ProfileFormState = Required<
  Pick<UpdateProfileRequest, "displayName" | "isDiscoverable">
> &
  Pick<
    UpdateProfileRequest,
    "bio" | "gender" | "lookingFor" | "city" | "country"
  >

function calculateAge(birthDate?: string): number | null {
  const calendarDate = birthDate?.slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(calendarDate ?? "")

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const today = new Date()
  const todayYear = today.getUTCFullYear()
  const todayMonth = today.getUTCMonth() + 1
  const todayDay = today.getUTCDate()
  let age = todayYear - year

  if (todayMonth < month || (todayMonth === month && todayDay < day)) {
    age -= 1
  }

  return age >= 0 ? age : null
}

function getProfilePhotos(profile: SelfProfile): string[] {
  return profile.photos
    .filter((photo) => photo.publicUrl)
    .sort((left, right) => left.position - right.position)
    .map((photo) => resolveProfilePhotoUrl(photo.publicUrl) as string)
}

function createProfileForm(profile: SelfProfile): ProfileFormState {
  return {
    displayName: profile.displayName,
    bio: profile.bio,
    gender: profile.gender,
    lookingFor: profile.lookingFor,
    city: profile.city,
    country: profile.country,
    isDiscoverable: profile.isDiscoverable ?? true,
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-sans font-medium uppercase tracking-[0.18em]"
      style={{ fontSize: "9px", color: "oklch(0.32 0.008 15)" }}
    >
      {children}
    </p>
  )
}

function SettingsRow({
  icon: Icon,
  label,
  danger = false,
  onClick,
  href,
}: {
  icon: React.ElementType
  label: string
  danger?: boolean
  onClick?: () => void
  /** Task 030: строки-переходы рендерятся ссылкой, а не кнопкой —
   *  так работают средний клик, «открыть в новой вкладке» и префетч. */
  href?: string
}) {
  const className =
    "flex items-center gap-4 w-full px-5 py-4 transition-all text-left"
  const style = { borderBottom: "1px solid oklch(0.14 0.010 15 / 0.60)" }
  const onMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = "oklch(0.13 0.010 15 / 0.60)"
  }
  const onMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = "transparent"
  }

  const content = (
    <>
      <Icon
        size={15}
        strokeWidth={1.5}
        style={{
          color: danger ? "oklch(0.55 0.20 25 / 0.65)" : "oklch(0.36 0.008 15)",
          flexShrink: 0,
        }}
      />
      <span
        className="flex-1 font-sans"
        style={{
          fontSize: "13.5px",
          color: danger ? "oklch(0.60 0.18 25 / 0.75)" : "oklch(0.60 0.006 60)",
        }}
      >
        {label}
      </span>
      {!danger && (
        <ChevronRight size={13} strokeWidth={1.5} style={{ color: "oklch(0.22 0.008 15)" }} />
      )}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        style={style}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      className={className}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content}
    </button>
  )
}

export default function ProfilePage() {
  const { lang } = useLang()
  const t = copy[lang]
  const { authenticatedRequest, isLoading: authLoading, logout } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  // Sections and inputs the completion CTA scrolls to, keyed by the field name
  // the API reports as missing.
  const completionTargetsRef = useRef<
    Partial<Record<ProfileCompletionField, HTMLElement | null>>
  >({})
  const [profileRecord, setProfileRecord] = useState<SelfProfile | null>(null)
  const [profileForm, setProfileForm] = useState<ProfileFormState | null>(null)
  const [editingBio, setEditingBio] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [activePhotoActionId, setActivePhotoActionId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  // null until /matches/me answers, and on failure — so the tile shows the
  // no-data dash instead of claiming zero matches.
  const [matchesCount, setMatchesCount] = useState<number | null>(null)

  const applyProfile = useCallback((nextProfile: SelfProfile) => {
    setProfileRecord(nextProfile)
    setProfileForm(createProfileForm(nextProfile))
  }, [])

  useEffect(() => {
    let active = true

    if (authLoading) {
      return () => {
        active = false
      }
    }

    setIsProfileLoading(true)
    setLoadError(null)

    profileApi
      .me(authenticatedRequest)
      .then(({ profile }) => {
        if (active) {
          applyProfile(profile)
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return
        }

        setLoadError(error instanceof ApiError ? error.message : t.loadErrorLabel)
      })
      .finally(() => {
        if (active) {
          setIsProfileLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [applyProfile, authLoading, authenticatedRequest, t.loadErrorLabel])

  // Match count is its own request: /profiles/me carries no counters, and a
  // failure here must not block the profile itself from rendering.
  useEffect(() => {
    let active = true

    if (authLoading) {
      return () => {
        active = false
      }
    }

    matchesApi
      .getMyMatches(authenticatedRequest)
      .then((response) => {
        if (!active) {
          return
        }

        // Same predicate as the /matches screen, so both show one number.
        const now = Date.now()
        setMatchesCount(
          response.matches.filter(
            (match) =>
              match.status === "active" &&
              new Date(match.expiresAt).getTime() > now,
          ).length,
        )
      })
      .catch(() => {
        if (active) {
          setMatchesCount(null)
        }
      })

    return () => {
      active = false
    }
  }, [authLoading, authenticatedRequest])

  const profile = useMemo(() => {
    if (!profileRecord) {
      return null
    }

    const photos = getProfilePhotos(profileRecord)
    const cityLine = [profileRecord.city, profileRecord.country].filter(Boolean).join(", ")

    return {
      name: profileRecord.displayName,
      age: calculateAge(profileRecord.birthDate),
      city: cityLine || t.emptyValue,
      country: profileRecord.country ?? null,
      bio: profileRecord.bio ?? t.emptyBio,
      photos,
      interests: [] as string[],
      gender: profileRecord.gender,
      lookingFor: profileRecord.lookingFor,
      isVerified: false,
      completionPct: profileRecord.completion.percentage,
      height: undefined as number | undefined,
      occupation: undefined as string | undefined,
      education: undefined as string | undefined,
      languages: [] as string[],
    }
  }, [profileRecord, t.emptyBio, t.emptyValue])

  // The CTA does not open a separate flow: every field the completion check
  // counts is edited on this screen, so it just takes the user to the first
  // missing one.
  const jumpToProfileGap = useCallback((field: ProfileCompletionField) => {
    if (field === "bio") {
      setEditingBio(true)
    }

    const target = completionTargetsRef.current[field]

    target?.scrollIntoView({ behavior: "smooth", block: "center" })

    if (target instanceof HTMLInputElement) {
      target.focus({ preventScroll: true })
    }
  }, [])

  const updateForm = useCallback(
    <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
      setProfileForm((current) => (current ? { ...current, [key]: value } : current))
      setSavedMessage(null)
      setSaveError(null)
    },
    [],
  )

  const saveProfile = useCallback(async () => {
    if (!profileForm) {
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setSavedMessage(null)

    try {
      const payload: UpdateProfileRequest = {
        displayName: profileForm.displayName,
        bio: profileForm.bio,
        gender: profileForm.gender,
        lookingFor: profileForm.lookingFor,
        city: profileForm.city,
        country: profileForm.country,
        isDiscoverable: profileForm.isDiscoverable,
      }
      const { profile: updatedProfile } = await profileApi.updateMe(
        authenticatedRequest,
        payload,
      )

      applyProfile(updatedProfile)
      setEditingBio(false)
      setSavedMessage(t.savedLabel)
    } catch (error) {
      setSaveError(error instanceof ApiError ? error.message : t.saveErrorLabel)
    } finally {
      setIsSaving(false)
    }
  }, [applyProfile, authenticatedRequest, profileForm, t.saveErrorLabel, t.savedLabel])

  const uploadProfilePhoto = useCallback(
    async (file: File) => {
      setIsUploadingPhoto(true)
      setPhotoError(null)

      try {
        const { profile: updatedProfile } = await profileApi.uploadPhoto(
          authenticatedRequest,
          file,
        )
        applyProfile(updatedProfile)
      } catch (error) {
        setPhotoError(error instanceof ApiError ? error.message : t.uploadErrorLabel)
      } finally {
        setIsUploadingPhoto(false)
      }
    },
    [applyProfile, authenticatedRequest, t.uploadErrorLabel],
  )

  const handlePhotoInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ""

      if (file) {
        void uploadProfilePhoto(file)
      }
    },
    [uploadProfilePhoto],
  )

  const setPrimaryPhoto = useCallback(
    async (photoId: string) => {
      setActivePhotoActionId(photoId)
      setPhotoError(null)

      try {
        const { profile: updatedProfile } = await profileApi.setPrimaryPhoto(
          authenticatedRequest,
          photoId,
        )
        applyProfile(updatedProfile)
      } catch (error) {
        setPhotoError(
          error instanceof ApiError ? error.message : t.photoActionErrorLabel,
        )
      } finally {
        setActivePhotoActionId(null)
      }
    },
    [applyProfile, authenticatedRequest, t.photoActionErrorLabel],
  )

  const deleteProfilePhoto = useCallback(
    async (photoId: string) => {
      setActivePhotoActionId(photoId)
      setPhotoError(null)

      try {
        const { profile: updatedProfile } = await profileApi.deletePhoto(
          authenticatedRequest,
          photoId,
        )
        applyProfile(updatedProfile)
      } catch (error) {
        setPhotoError(
          error instanceof ApiError ? error.message : t.photoActionErrorLabel,
        )
      } finally {
        setActivePhotoActionId(null)
      }
    },
    [applyProfile, authenticatedRequest, t.photoActionErrorLabel],
  )

  // Only the match count has a backing endpoint today (GET /matches/me).
  // Likes received exist in the DB (Like model, User.likesReceived) but no API
  // exposes a count, and profile views are not tracked anywhere — no model,
  // no field, no endpoint. Those two show NO_DATA instead of a literal "0",
  // which would assert the user has none.
  const stats = [
    { icon: Heart, value: NO_DATA, label: t.likesReceived },
    {
      icon: Star,
      value: matchesCount === null ? NO_DATA : String(matchesCount),
      label: t.matchesCount,
    },
    { icon: TrendingUp, value: NO_DATA, label: t.profileViews },
  ]

  if (authLoading || isProfileLoading) {
    return (
      <div className="min-h-screen md:pl-[220px] pb-28 md:pb-12 flex items-center justify-center">
        <p className="font-sans" style={{ color: "oklch(0.62 0.006 60)" }}>
          {t.loadingLabel}
        </p>
      </div>
    )
  }

  if (loadError || !profile || !profileForm || !profileRecord) {
    return (
      <div className="min-h-screen md:pl-[220px] pb-28 md:pb-12 flex items-center justify-center px-5">
        <p className="font-sans text-center" style={{ color: "oklch(0.60 0.18 25 / 0.85)" }}>
          {loadError ?? t.loadErrorLabel}
        </p>
      </div>
    )
  }

  const allPhotos = profileRecord.photos
    .filter((photo) => photo.publicUrl)
    .sort((left, right) => left.position - right.position)
    .map((photo) => ({
      ...photo,
      resolvedUrl: resolveProfilePhotoUrl(photo.publicUrl) as string,
    }))
  // Task 071: заглушка выбирается по собственному полу, а не показывает
  // фотографию модели с лендинга.
  const primaryPhoto =
    allPhotos.find((photo) => photo.isPrimary)?.resolvedUrl ??
    allPhotos[0]?.resolvedUrl ??
    defaultAvatarUrl(profileRecord.gender, "card")
  // Completion is computed by the API over eight equally weighted fields, so at
  // 100% there is nothing left to improve here and the CTA is not rendered.
  const missingFields = profileRecord.completion.missingFields
  const improveTarget =
    COMPLETION_JUMP_ORDER.find((field) => missingFields.includes(field)) ?? null
  // "Looking for" is not listed here: it has an editable row in the profile
  // fields card above, and repeating it made the same value show up twice under
  // the same label. Details only carries read-only fields with no editor yet.
  const detailRows = ([
    profile.height && {
      icon: User,
      label: t.height,
      value: `${profile.height} ${t.cm}`,
    },
    profile.occupation && {
      icon: Briefcase,
      label: t.occupation,
      value: profile.occupation,
    },
    profile.education && {
      icon: GraduationCap,
      label: t.education,
      value: profile.education,
    },
    profile.languages?.length && {
      icon: Languages,
      label: t.languages,
      value: profile.languages.join(", "),
    },
  ] as Array<ProfileInfoRow | undefined | null | false>).filter(isProfileInfoRow)

  return (
    <div className="min-h-screen md:pl-[220px] pb-28 md:pb-12">

      {/* ── Desktop two-column layout wrapper ── */}
      <div className="md:flex md:gap-0 md:min-h-screen">

        {/* ── Left column: hero + photos + stats ── */}
        <div className="md:sticky md:top-0 md:self-start md:w-[340px] md:flex-shrink-0 md:min-h-screen md:border-r" style={{ borderColor: "oklch(0.16 0.010 15 / 0.60)" }}>

          {/* ── Cinematic hero ── */}
          <div
            className="relative w-full overflow-hidden"
            style={{ height: "clamp(300px, 42vw, 420px)" }}
          >
            <Image
              src={primaryPhoto}
              alt={profile.name}
              fill
              className="object-cover object-top"
              priority
            />
            {/* Bottom fade */}
            <div
              className="absolute inset-0"
              style={{
                background: [
                  "linear-gradient(to top, oklch(0.075 0.010 15) 0%, oklch(0.075 0.010 15 / 0.72) 28%, transparent 56%)",
                  "linear-gradient(to bottom, oklch(0.075 0.010 15 / 0.40) 0%, transparent 30%)",
                ].join(", "),
              }}
            />
            {/* Rose rim glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 100%, oklch(0.65 0.26 12 / 0.12) 0%, transparent 52%)",
              }}
            />

            {/* Edit button */}
            <button
              className="absolute top-5 right-5 flex items-center gap-1.5 rounded-full px-3.5 py-2 font-sans font-medium transition-all"
              style={{
                fontSize: "11px",
                color: "oklch(0.75 0.005 60)",
                background: "oklch(0.07 0.012 15 / 0.80)",
                border: "1px solid oklch(0.28 0.012 15 / 0.50)",
                backdropFilter: "blur(14px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.65 0.26 12 / 0.38)"
                e.currentTarget.style.color = "oklch(0.92 0.005 60)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.28 0.012 15 / 0.50)"
                e.currentTarget.style.color = "oklch(0.75 0.005 60)"
              }}
              aria-label={t.edit}
            >
              <Pencil size={11} strokeWidth={2} />
              {t.edit}
            </button>

            {/* Name block */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
              <div className="flex items-end justify-between">
                <div>
                  <h1
                    className="font-display font-light tracking-[-0.01em] mb-1"
                    style={{
                      fontSize: "clamp(2rem, 6vw, 2.6rem)",
                      color: "oklch(0.96 0.004 60)",
                      lineHeight: 1.0,
                      textShadow: "0 2px 24px oklch(0.04 0.005 15 / 0.70)",
                    }}
                  >
                    {profile.name}
                    {profile.age !== null && (
                      <span
                        className="font-sans font-light ml-2"
                        style={{ fontSize: "clamp(1.2rem, 3vw, 1.5rem)", color: "oklch(0.50 0.006 60)" }}
                      >
                        {profile.age}
                      </span>
                    )}
                  </h1>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={10} style={{ color: "oklch(0.65 0.26 12 / 0.80)" }} />
                    <span
                      className="font-sans"
                      style={{ fontSize: "11.5px", color: "oklch(0.44 0.008 15)" }}
                    >
                      {profile.city}
                    </span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-col items-end gap-1.5">
                  {profile.isVerified && (
                    <span
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 font-sans font-medium"
                      style={{
                        fontSize: "9px",
                        color: "oklch(0.74 0.18 220)",
                        background: "oklch(0.08 0.012 15 / 0.78)",
                        border: "1px solid oklch(0.72 0.18 220 / 0.30)",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <ShieldCheck size={9} />
                      {t.verified}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div
            className="grid grid-cols-3"
            style={{ borderBottom: "1px solid oklch(0.15 0.010 15 / 0.60)" }}
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 py-5"
                style={{
                  borderRight:
                    i < stats.length - 1 ? "1px solid oklch(0.15 0.010 15 / 0.60)" : "none",
                }}
              >
                <stat.icon
                  size={14}
                  strokeWidth={1.5}
                  style={{ color: "oklch(0.65 0.26 12 / 0.65)" }}
                />
                <span
                  className="font-display font-light"
                  style={{ fontSize: "1.3rem", color: "oklch(0.82 0.005 60)", lineHeight: 1 }}
                >
                  {stat.value}
                </span>
                <span
                  className="font-sans"
                  style={{ fontSize: "9.5px", color: "oklch(0.30 0.008 15)" }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Completion bar ── */}
          <div
            className="px-5 py-5 relative overflow-hidden"
            style={{ borderBottom: "1px solid oklch(0.15 0.010 15 / 0.60)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="font-sans"
                style={{ fontSize: "12px", color: "oklch(0.42 0.008 15)" }}
              >
                {t.completion} {profile.completionPct}%
              </span>
              {improveTarget && (
                <button
                  type="button"
                  onClick={() => jumpToProfileGap(improveTarget)}
                  className="font-sans font-medium transition-colors"
                  style={{ fontSize: "11px", color: "oklch(0.65 0.26 12)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.78 0.22 12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.65 0.26 12)")}
                >
                  {t.completionCta}
                </button>
              )}
            </div>
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: "oklch(0.16 0.010 15)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${profile.completionPct}%`,
                  background: "linear-gradient(to right, oklch(0.55 0.24 14), oklch(0.68 0.26 12))",
                  boxShadow: "0 0 10px oklch(0.65 0.26 12 / 0.50)",
                }}
              />
            </div>
            {missingFields.length > 0 && (
              <p
                className="font-sans mt-3"
                style={{ fontSize: "11px", color: "oklch(0.36 0.008 15)" }}
              >
                {t.completionMissing}:{" "}
                {missingFields.map((field) => t.completionFields[field]).join(", ")}
              </p>
            )}
          </div>

          {/* ── Photos grid ── */}
          <div
            ref={(element) => {
              completionTargetsRef.current.photo = element
            }}
            className="px-5 py-5"
            style={{ borderBottom: "1px solid oklch(0.15 0.010 15 / 0.60)" }}
          >
            <div className="flex items-center justify-between mb-3.5">
              <SectionLabel>{t.photosLabel}</SectionLabel>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="flex items-center gap-1 font-sans font-medium"
                style={{ fontSize: "11px", color: "oklch(0.65 0.26 12)" }}
              >
                <Camera size={11} />
                {isUploadingPhoto
                  ? lang === "ru"
                    ? "Загрузка..."
                    : "Uploading..."
                  : t.addPhoto}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoInputChange}
            />
            <div className="grid grid-cols-4 gap-2">
              {allPhotos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="relative overflow-hidden rounded-xl"
                  style={{
                    aspectRatio: "1",
                    border: "1px solid oklch(0.20 0.012 15 / 0.55)",
                    background: "oklch(0.10 0.012 15)",
                  }}
                >
                  <Image
                    src={photo.resolvedUrl}
                    alt={`Photo ${i + 1}`}
                    fill
                    className="object-cover object-top"
                    sizes="80px"
                  />
                  {photo.isPrimary && (
                    <div
                      className="absolute top-1 left-1 rounded-full px-1.5 py-0.5 font-sans"
                      style={{
                        fontSize: "7px",
                        color: "oklch(0.90 0.004 60)",
                        background: "oklch(0.65 0.26 12)",
                      }}
                    >
                      {lang === "ru" ? "Главное" : "Main"}
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 flex gap-1">
                    {!photo.isPrimary && (
                      <button
                        type="button"
                        title={t.setPrimaryPhoto}
                        aria-label={t.setPrimaryPhoto}
                        disabled={activePhotoActionId === photo.id}
                        onClick={() => void setPrimaryPhoto(photo.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full transition-all disabled:opacity-50"
                        style={{
                          color: "oklch(0.92 0.005 60)",
                          background: "oklch(0.07 0.012 15 / 0.82)",
                          border: "1px solid oklch(0.65 0.26 12 / 0.30)",
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        <Star size={11} strokeWidth={1.7} />
                      </button>
                    )}
                    <button
                      type="button"
                      title={t.deletePhoto}
                      aria-label={t.deletePhoto}
                      disabled={activePhotoActionId === photo.id}
                      onClick={() => void deleteProfilePhoto(photo.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-full transition-all disabled:opacity-50"
                      style={{
                        color: "oklch(0.90 0.004 60)",
                        background: "oklch(0.07 0.012 15 / 0.82)",
                        border: "1px solid oklch(0.55 0.20 25 / 0.35)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Trash2 size={11} strokeWidth={1.7} />
                    </button>
                  </div>
                </div>
              ))}
              {/* Add photo button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="overflow-hidden rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
                style={{
                  aspectRatio: "1",
                  border: "1px dashed oklch(0.22 0.012 15 / 0.70)",
                  background: "oklch(0.10 0.010 15 / 0.50)",
                  color: "oklch(0.30 0.008 15)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.65 0.26 12 / 0.35)"
                  e.currentTarget.style.color = "oklch(0.65 0.26 12 / 0.65)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.22 0.012 15 / 0.70)"
                  e.currentTarget.style.color = "oklch(0.30 0.008 15)"
                }}
                aria-label={t.addPhoto}
              >
                <Plus size={16} strokeWidth={1.5} />
              </button>
            </div>
            {photoError && (
              <p
                className="font-sans mt-3"
                style={{ fontSize: "11.5px", color: "oklch(0.60 0.18 25 / 0.85)" }}
              >
                {photoError}
              </p>
            )}
          </div>
        </div>

        {/* ── Right column: bio, interests, details, settings ── */}
        <div className="flex-1 px-5 md:px-8 flex flex-col gap-7 pt-5 md:pt-6">

          {/* ── Bio ── */}
          <div
            ref={(element) => {
              completionTargetsRef.current.bio = element
            }}
          >
            <div className="flex items-center justify-between mb-3.5">
              <SectionLabel>{t.bioLabel}</SectionLabel>
              <button
                onClick={() => setEditingBio(true)}
                className="flex items-center gap-1 font-sans"
                style={{ fontSize: "11px", color: "oklch(0.32 0.008 15)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.50 0.006 60)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.32 0.008 15)")}
              >
                <Pencil size={10} strokeWidth={2} />
                {t.edit}
              </button>
            </div>
            {editingBio ? (
              <textarea
                value={profileForm.bio ?? ""}
                onChange={(e) => updateForm("bio", e.target.value)}
                autoFocus
                rows={4}
                className="w-full bg-transparent font-sans outline-none resize-none rounded-2xl px-5 py-4"
                style={{
                  fontSize: "13.5px",
                  lineHeight: "1.65",
                  color: "oklch(0.74 0.005 60)",
                  border: "1px solid oklch(0.65 0.26 12 / 0.32)",
                  caretColor: "oklch(0.65 0.26 12)",
                  boxShadow: "0 0 20px oklch(0.65 0.26 12 / 0.06)",
                }}
              />
            ) : (
              <button
                onClick={() => setEditingBio(true)}
                className="text-left w-full rounded-2xl px-5 py-4 transition-all"
                style={{
                  background: "oklch(0.11 0.012 15 / 0.80)",
                  border: "1px solid oklch(0.20 0.012 15 / 0.60)",
                  boxShadow: "inset 0 1px 0 oklch(0.22 0.010 15 / 0.10)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(0.28 0.012 15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(0.20 0.012 15 / 0.60)")
                }
              >
                <p
                  className="font-sans leading-relaxed"
                  style={{
                    fontSize: "13.5px",
                    color: "oklch(0.54 0.006 15)",
                    lineHeight: "1.65",
                  }}
                >
                  {profileForm.bio || t.emptyBio}
                </p>
              </button>
            )}
          </div>

          {/* ── Editable MVP fields ── */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <SectionLabel>{t.profileFieldsLabel}</SectionLabel>
              <button
                onClick={saveProfile}
                disabled={isSaving}
                className="rounded-full px-4 py-2 font-sans font-medium transition-all disabled:opacity-60"
                style={{
                  fontSize: "11.5px",
                  color: "oklch(0.90 0.005 60)",
                  background: "oklch(0.65 0.26 12 / 0.18)",
                  border: "1px solid oklch(0.65 0.26 12 / 0.30)",
                }}
              >
                {isSaving ? t.savingLabel : t.saveLabel}
              </button>
            </div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid oklch(0.20 0.012 15 / 0.60)",
                background: "oklch(0.11 0.012 15 / 0.80)",
                boxShadow: "inset 0 1px 0 oklch(0.22 0.010 15 / 0.10)",
              }}
            >
              {([
                {
                  completionField: "displayName",
                  label: t.displayNameLabel,
                  value: profileForm.displayName,
                  onChange: (value: string) => updateForm("displayName", value),
                },
                {
                  completionField: "city",
                  label: t.cityLabel,
                  value: profileForm.city ?? "",
                  onChange: (value: string) => updateForm("city", value),
                },
                {
                  completionField: "country",
                  label: t.countryLabel,
                  value: profileForm.country ?? "",
                  onChange: (value: string) => updateForm("country", value),
                },
                {
                  completionField: "gender",
                  label: t.genderLabel,
                  value: profileForm.gender ?? "",
                  onChange: (value: string) => updateForm("gender", value),
                },
                {
                  completionField: "lookingFor",
                  label: t.lookingFor,
                  value: profileForm.lookingFor ?? "",
                  onChange: (value: string) => updateForm("lookingFor", value),
                },
              ] as Array<{
                completionField: ProfileCompletionField
                label: string
                value: string
                onChange: (value: string) => void
              }>).map((field, i, arr) => (
                <label
                  key={field.label}
                  className="flex items-center gap-4 px-5 py-3.5"
                  style={{
                    borderBottom:
                      i < arr.length - 1
                        ? "1px solid oklch(0.15 0.010 15 / 0.60)"
                        : "none",
                  }}
                >
                  <span
                    className="font-sans flex-shrink-0"
                    style={{
                      fontSize: "11.5px",
                      color: "oklch(0.30 0.008 15)",
                      minWidth: "92px",
                    }}
                  >
                    {field.label}
                  </span>
                  <input
                    ref={(element) => {
                      completionTargetsRef.current[field.completionField] = element
                    }}
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-right font-sans outline-none"
                    style={{
                      fontSize: "13px",
                      color: "oklch(0.68 0.006 60)",
                      caretColor: "oklch(0.65 0.26 12)",
                    }}
                  />
                </label>
              ))}
              <label className="flex items-center gap-4 px-5 py-3.5">
                <span
                  className="font-sans flex-1"
                  style={{ fontSize: "12px", color: "oklch(0.52 0.006 60)" }}
                >
                  {t.discoverableLabel}
                </span>
                <input
                  type="checkbox"
                  checked={profileForm.isDiscoverable}
                  onChange={(event) => updateForm("isDiscoverable", event.target.checked)}
                  className="h-4 w-4 accent-rose-500"
                />
              </label>
            </div>
            {(saveError || savedMessage) && (
              <p
                className="font-sans mt-3"
                style={{
                  fontSize: "12px",
                  color: saveError
                    ? "oklch(0.60 0.18 25 / 0.85)"
                    : "oklch(0.62 0.15 145 / 0.85)",
                }}
              >
                {saveError ?? savedMessage}
              </p>
            )}
          </div>

          {/* ── Interests ── */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <SectionLabel>{t.interestsLabel}</SectionLabel>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((tag) => (
                <span
                  key={tag}
                  className="font-sans rounded-full px-4 py-2"
                  style={{
                    fontSize: "12px",
                    color: "oklch(0.56 0.008 15)",
                    background: "oklch(0.12 0.012 15 / 0.80)",
                    border: "1px solid oklch(0.22 0.012 15 / 0.60)",
                    boxShadow: "inset 0 1px 0 oklch(0.26 0.010 15 / 0.10)",
                  }}
                >
                  {tag}
                </span>
              ))}
              <button
                className="flex items-center gap-1.5 rounded-full px-4 py-2 font-sans transition-all"
                style={{
                  fontSize: "12px",
                  color: "oklch(0.32 0.008 15)",
                  background: "oklch(0.10 0.010 15 / 0.60)",
                  border: "1px dashed oklch(0.20 0.010 15 / 0.60)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.65 0.26 12 / 0.28)"
                  e.currentTarget.style.color = "oklch(0.50 0.006 60)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.20 0.010 15 / 0.60)"
                  e.currentTarget.style.color = "oklch(0.32 0.008 15)"
                }}
              >
                <Plus size={11} strokeWidth={2} />
                {lang === "ru" ? "Добавить" : "Add"}
              </button>
            </div>
          </div>

          {/* ── Details ── */}
          {detailRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <SectionLabel>{t.detailsLabel}</SectionLabel>
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid oklch(0.20 0.012 15 / 0.60)",
                  background: "oklch(0.11 0.012 15 / 0.80)",
                  boxShadow: "inset 0 1px 0 oklch(0.22 0.010 15 / 0.10)",
                }}
              >
                {detailRows.map((row, i, arr) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-4 px-5 py-3.5"
                    style={{
                      borderBottom:
                        i < arr.length - 1
                          ? "1px solid oklch(0.15 0.010 15 / 0.60)"
                          : "none",
                    }}
                  >
                    <row.icon
                      size={13}
                      strokeWidth={1.5}
                      style={{ color: "oklch(0.34 0.008 15)", flexShrink: 0 }}
                    />
                    <span
                      className="font-sans flex-shrink-0"
                      style={{
                        fontSize: "11.5px",
                        color: "oklch(0.30 0.008 15)",
                        minWidth: "76px",
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      className="font-sans flex-1 text-right"
                      style={{ fontSize: "13px", color: "oklch(0.62 0.006 60)" }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Account settings ── */}
          <div>
            <div className="mb-3.5">
              <SectionLabel>{t.accountLabel}</SectionLabel>
            </div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid oklch(0.20 0.012 15 / 0.60)",
                background: "oklch(0.11 0.012 15 / 0.80)",
                boxShadow: "inset 0 1px 0 oklch(0.22 0.010 15 / 0.10)",
              }}
            >
              <SettingsRow
                icon={Lock}
                label={t.privacyLabel}
                href="/settings/privacy"
              />
              <SettingsRow
                icon={Bell}
                label={t.notificationsLabel}
                href="/settings/notifications"
              />
              <div style={{ borderBottom: "none" }}>
                <SettingsRow icon={LogOut} label={t.logoutLabel} danger onClick={logout} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
