"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { AlertTriangle, Camera } from "lucide-react"
import { ApiError } from "@/lib/auth-api"
import { useAuth } from "@/lib/auth-context"
import { useLang } from "@/lib/lang-context"
import { defaultAvatarUrl } from "@/lib/default-avatar"
import {
  profileApi,
  resolveProfilePhotoUrl,
  type SelfProfile,
} from "@/lib/profile-api"
import { profileFormCopy } from "../copy"
import {
  createProfileForm,
  missingRequiredFields,
  toUpdateProfileRequest,
  type ProfileFormState,
} from "../form-state"
import {
  ProfileFormFields,
  type ProfileFieldFocusRequest,
} from "./profile-form-fields"

const copy = {
  ru: {
    eyebrow: "Анкета",
    title: "Расскажите о себе",
    intro:
      "Пока анкета не заполнена, вас не показывают в поиске и вы никого не увидите. Это занимает пару минут.",
    photoLabel: "Фотография",
    photoRequired: "Фотография *",
    photoHint:
      "Без хотя бы одной фотографии анкета не попадёт в выдачу. Позже можно добавить ещё.",
    addPhoto: "Загрузить фото",
    replacePhoto: "Заменить фото",
    uploading: "Загружаем...",
    uploadError: "Не удалось загрузить фото",
    finish: "Готово",
    saving: "Сохраняем...",
    skip: "Заполнить позже",
    skipConsequence:
      "Введённое сохранится, но анкета не будет показываться в поиске, пока не заполнена целиком. Дозаполнить можно в профиле.",
    gapsTitle: "Чтобы попасть в поиск, не хватает:",
    photoWord: "фотографии",
    loading: "Загружаем анкету...",
    loadError: "Не удалось загрузить анкету",
    saveError: "Не удалось сохранить анкету",
  },
  en: {
    eyebrow: "Your profile",
    title: "Tell us about yourself",
    intro:
      "Until your profile is filled in you stay out of discover and see no one. It takes a couple of minutes.",
    photoLabel: "Photo",
    photoRequired: "Photo *",
    photoHint:
      "Without at least one photo your profile stays out of discover. You can add more later.",
    addPhoto: "Upload a photo",
    replacePhoto: "Replace photo",
    uploading: "Uploading...",
    uploadError: "Could not upload the photo",
    finish: "Done",
    saving: "Saving...",
    skip: "Finish later",
    skipConsequence:
      "What you typed is saved, but your profile stays out of discover until it is complete. You can finish it in your profile.",
    gapsTitle: "Still missing before you appear in discover:",
    photoWord: "a photo",
    loading: "Loading your profile...",
    loadError: "Could not load your profile",
    saveError: "Could not save your profile",
  },
}

function publishedPhotoUrl(profile: SelfProfile): string | null {
  const photos = profile.photos
    .filter((photo) => photo.publicUrl)
    .sort((left, right) => left.position - right.position)
  const chosen = photos.find((photo) => photo.isPrimary) ?? photos[0]

  return chosen ? resolveProfilePhotoUrl(chosen.publicUrl) : null
}

export function OnboardingScreen() {
  const { lang } = useLang()
  const t = copy[lang]
  const fieldCopy = profileFormCopy[lang].fields
  const router = useRouter()
  const { authenticatedRequest, isLoading: authLoading } = useAuth()

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const photoSectionRef = useRef<HTMLDivElement | null>(null)

  const [profileRecord, setProfileRecord] = useState<SelfProfile | null>(null)
  const [form, setForm] = useState<ProfileFormState | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  // Список незаполненного показывается не сразу, а после первой попытки
  // завершить: подсвечивать пустые поля человеку, который ещё не начал
  // печатать, — это ругань на пустом месте.
  const [showGaps, setShowGaps] = useState(false)
  const [focusRequest, setFocusRequest] = useState<ProfileFieldFocusRequest | null>(
    null,
  )

  const applyProfile = useCallback((next: SelfProfile) => {
    setProfileRecord(next)
    setForm(createProfileForm(next))
  }, [])

  useEffect(() => {
    let active = true

    if (authLoading) {
      return () => {
        active = false
      }
    }

    profileApi
      .me(authenticatedRequest)
      .then(({ profile }) => {
        if (!active) {
          return
        }

        // Заполненную анкету онбордингу показывать нечего: экран доступен по
        // прямому адресу, и без этой проверки он стал бы вторым, худшим
        // редактором профиля.
        if (profile.completion.isComplete) {
          router.replace("/discover")

          return
        }

        applyProfile(profile)
        setIsProfileLoading(false)
      })
      .catch((error: unknown) => {
        if (!active) {
          return
        }

        setLoadError(error instanceof ApiError ? error.message : t.loadError)
        setIsProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [applyProfile, authLoading, authenticatedRequest, router, t.loadError])

  const uploadPhoto = useCallback(
    async (file: File) => {
      setIsUploadingPhoto(true)
      setPhotoError(null)

      try {
        const { profile } = await profileApi.uploadPhoto(authenticatedRequest, file)

        // Черновик текстовых полей не перезаписываем: загрузка фото — отдельный
        // запрос, и ответ на него не знает о том, что человек уже напечатал.
        setProfileRecord(profile)
      } catch (error) {
        setPhotoError(error instanceof ApiError ? error.message : t.uploadError)
      } finally {
        setIsUploadingPhoto(false)
      }
    },
    [authenticatedRequest, t.uploadError],
  )

  const handlePhotoInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ""

      if (file) {
        void uploadPhoto(file)
      }
    },
    [uploadPhoto],
  )

  const persist = useCallback(async (): Promise<boolean> => {
    if (!form) {
      return false
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const { profile } = await profileApi.updateMe(
        authenticatedRequest,
        toUpdateProfileRequest(form),
      )

      applyProfile(profile)

      return true
    } catch (error) {
      setSaveError(error instanceof ApiError ? error.message : t.saveError)

      return false
    } finally {
      setIsSaving(false)
    }
  }, [applyProfile, authenticatedRequest, form, t.saveError])

  const updateField = useCallback(
    <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
      setForm((current) => (current ? { ...current, [key]: value } : current))
      setSaveError(null)
    },
    [],
  )

  if (authLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <p className="font-sans" style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
          {t.loading}
        </p>
      </div>
    )
  }

  if (loadError || !form || !profileRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <p
          className="font-sans text-center"
          style={{ fontSize: "13px", color: "var(--destructive)" }}
        >
          {loadError ?? t.loadError}
        </p>
      </div>
    )
  }

  const photoUrl = publishedPhotoUrl(profileRecord)
  const missingKeys = missingRequiredFields(form)
  const missingLabels = [
    ...missingKeys.map((key) => fieldCopy[key].label.toLowerCase()),
    ...(photoUrl ? [] : [t.photoWord]),
  ]
  const isBusy = isSaving || isUploadingPhoto

  const handleFinish = async () => {
    if (missingLabels.length > 0) {
      setShowGaps(true)

      if (missingKeys.length > 0) {
        setFocusRequest((current) => ({
          field: missingKeys[0],
          nonce: (current?.nonce ?? 0) + 1,
        }))
      } else {
        photoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }

      return
    }

    if (await persist()) {
      router.replace("/discover")
    }
  }

  const handleSkip = async () => {
    // Пропуск всё равно сохраняет введённое: потерять напечатанное на шаге,
    // который сам предлагает уйти, — худший из возможных исходов.
    if (await persist()) {
      router.replace("/discover")
    }
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-10 md:py-14">
      <div className="flex items-center gap-3 mb-7">
        <span
          className="h-px w-5 flex-shrink-0"
          style={{ background: "var(--primary)", opacity: 0.65 }}
        />
        <span
          className="font-sans font-medium uppercase"
          style={{ fontSize: "9.5px", letterSpacing: "0.26em", color: "var(--primary)" }}
        >
          {t.eyebrow}
        </span>
      </div>

      <h1
        className="font-display font-light mb-3"
        style={{
          fontSize: "clamp(2.1rem, 5.5vw, 2.8rem)",
          lineHeight: 1.02,
          letterSpacing: "-0.02em",
          color: "var(--foreground)",
        }}
      >
        {t.title}
      </h1>
      <p
        className="font-sans mb-9"
        style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted-foreground)" }}
      >
        {t.intro}
      </p>

      {/* ── Фотография ── */}
      <div
        ref={photoSectionRef}
        className="mb-9 flex items-center gap-4 px-4 py-4"
        style={{
          background: "var(--card)",
          border: `1px solid ${
            showGaps && !photoUrl ? "var(--destructive)" : "var(--border)"
          }`,
          borderRadius: "var(--shape-radius-lg)",
        }}
      >
        <div
          className="relative flex-shrink-0 overflow-hidden"
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "var(--shape-radius-md)",
            border: "1px solid var(--border)",
            background: "var(--muted)",
          }}
        >
          <Image
            src={photoUrl ?? defaultAvatarUrl(form.gender, "square")}
            alt=""
            aria-hidden="true"
            fill
            sizes="72px"
            className="object-cover object-top"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span
            className="font-sans font-medium uppercase"
            style={{ fontSize: "11px", letterSpacing: "0.14em", color: "var(--muted-foreground)" }}
          >
            {t.photoLabel}
            <span style={{ color: "var(--primary)" }} aria-hidden="true">
              {" *"}
            </span>
          </span>
          <span
            className="font-sans"
            style={{ fontSize: "11.5px", lineHeight: 1.5, color: "var(--muted-foreground)" }}
          >
            {t.photoHint}
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className="mt-1 flex items-center gap-1.5 self-start font-sans font-medium disabled:opacity-60"
            style={{ fontSize: "12px", color: "var(--primary)" }}
          >
            <Camera size={12} strokeWidth={1.8} />
            {isUploadingPhoto ? t.uploading : photoUrl ? t.replacePhoto : t.addPhoto}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoInputChange}
        />
      </div>

      {photoError && (
        <p
          className="font-sans -mt-6 mb-8"
          style={{ fontSize: "12px", color: "var(--destructive)" }}
        >
          {photoError}
        </p>
      )}

      {/* ── Поля анкеты: тот же компонент, что и в редакторе профиля ── */}
      <ProfileFormFields
        lang={lang}
        value={form}
        onChange={updateField}
        disabled={isSaving}
        highlight={showGaps ? missingKeys : undefined}
        focusRequest={focusRequest}
      />

      {showGaps && missingLabels.length > 0 && (
        <p
          className="font-sans mt-6 flex items-start gap-2"
          style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted-foreground)" }}
        >
          <AlertTriangle
            size={13}
            strokeWidth={1.6}
            style={{ color: "var(--primary)", flexShrink: 0, marginTop: "1px" }}
          />
          <span>
            {t.gapsTitle} {missingLabels.join(", ")}
          </span>
        </p>
      )}

      {saveError && (
        <p
          className="font-sans mt-5"
          style={{ fontSize: "12px", color: "var(--destructive)" }}
        >
          {saveError}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleFinish()}
        disabled={isBusy}
        className="mt-8 w-full font-sans font-medium transition-opacity disabled:opacity-50"
        style={{
          fontSize: "13.5px",
          color: "var(--primary-foreground)",
          background: "var(--primary)",
          borderRadius: "var(--shape-radius-md)",
          padding: "14px 20px",
        }}
      >
        {isSaving ? t.saving : t.finish}
      </button>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => void handleSkip()}
          disabled={isBusy}
          className="self-start font-sans underline underline-offset-4 disabled:opacity-50"
          style={{ fontSize: "12.5px", color: "var(--muted-foreground)" }}
        >
          {t.skip}
        </button>
        <p
          className="font-sans"
          style={{ fontSize: "11.5px", lineHeight: 1.5, color: "var(--muted-foreground)", opacity: 0.8 }}
        >
          {t.skipConsequence}
        </p>
      </div>
    </div>
  )
}
