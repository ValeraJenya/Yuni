import type {
  ProfileCompletionField,
  SelfProfile,
  UpdateProfileRequest,
} from "@/lib/profile-api"

/**
 * Черновик анкеты. Живёт только в памяти формы — на сервер уезжает целиком
 * по кнопке «Сохранить» (Task 069), а не по каждому нажатию клавиши.
 */
export type ProfileFormState = Required<
  Pick<UpdateProfileRequest, "displayName" | "isDiscoverable">
> &
  Pick<UpdateProfileRequest, "bio" | "gender" | "lookingFor" | "city" | "country">

export type ProfileFormFieldKey =
  | "displayName"
  | "bio"
  | "gender"
  | "lookingFor"
  | "city"
  | "country"

export interface ProfileFormFieldDescriptor {
  key: ProfileFormFieldKey
  kind: "text" | "textarea"
  /**
   * Поле входит в `PROFILE_COMPLETION_FIELDS`
   * (`apps/backend/src/modules/profiles/profile-completion.policy.ts`).
   * Пока оно пустое, анкета считается незаполненной и не попадает в выдачу
   * Discovery — поэтому в форме оно помечено звёздочкой.
   */
  required: boolean
  /** Имя, под которым бэкенд возвращает поле в `completion.missingFields`. */
  completionField: ProfileCompletionField
  autoComplete?: string
  maxLength?: number
}

/**
 * Порядок полей общий для экрана профиля (Task 069) и онбординга (Task 070),
 * чтобы пользователь видел одну и ту же анкету в обоих местах.
 *
 * `birthDate` и `photo` тоже входят в критерий заполненности, но редактируются
 * не здесь: дата рождения задаётся при регистрации и не меняется, фотография
 * грузится отдельным запросом и сохраняется сразу, без черновика.
 */
export const PROFILE_FORM_FIELDS: readonly ProfileFormFieldDescriptor[] = [
  {
    key: "displayName",
    kind: "text",
    required: true,
    completionField: "displayName",
    // Task 081: "nickname" is a valid WHATWG autofill token, but Chrome's
    // own validity list disagrees and flags it as non-standard (confirmed
    // in DevTools → Issues on both /profile and /onboarding, which render
    // this shared field list) — the same way Chrome rejects the spec-valid
    // "bday" token elsewhere in this app. No autofill behavior is lost by
    // dropping it: Chrome wasn't treating it as a valid target anyway.
    autoComplete: "off",
    maxLength: 60,
  },
  {
    key: "bio",
    kind: "textarea",
    required: true,
    completionField: "bio",
    maxLength: 600,
  },
  {
    key: "gender",
    kind: "text",
    required: true,
    completionField: "gender",
    maxLength: 40,
  },
  {
    key: "lookingFor",
    kind: "text",
    required: true,
    completionField: "lookingFor",
    maxLength: 40,
  },
  {
    key: "city",
    kind: "text",
    required: true,
    completionField: "city",
    autoComplete: "address-level2",
    maxLength: 80,
  },
  {
    key: "country",
    kind: "text",
    required: true,
    completionField: "country",
    autoComplete: "country-name",
    maxLength: 80,
  },
]

export function createProfileForm(profile: SelfProfile): ProfileFormState {
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

/**
 * `null` (поле никогда не заполняли) и `""` (всё стёрли в инпуте) для сравнения
 * одно и то же: иначе форма считается изменённой сразу после открытия, стоит
 * React-инпуту подставить пустую строку вместо `null`.
 */
function normalize(value: string | null | undefined): string {
  return (value ?? "").trim()
}

export function isProfileFormDirty(
  draft: ProfileFormState,
  saved: ProfileFormState,
): boolean {
  if (draft.isDiscoverable !== saved.isDiscoverable) {
    return true
  }

  return PROFILE_FORM_FIELDS.some(
    (field) => normalize(draft[field.key]) !== normalize(saved[field.key]),
  )
}

/**
 * Пустая строка уезжает как `null`: для бэкенда «поле очищено» и «поля нет» —
 * одно состояние, а `""` он бы записал как заполненное значение и посчитал
 * анкету полной.
 */
function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = normalize(value)

  return trimmed === "" ? null : trimmed
}

export function toUpdateProfileRequest(
  draft: ProfileFormState,
): UpdateProfileRequest {
  return {
    displayName: normalize(draft.displayName),
    bio: emptyToNull(draft.bio),
    gender: emptyToNull(draft.gender),
    lookingFor: emptyToNull(draft.lookingFor),
    city: emptyToNull(draft.city),
    country: emptyToNull(draft.country),
    isDiscoverable: draft.isDiscoverable,
  }
}

/** Поля, обязательные для выдачи, которые сейчас пустые. */
export function missingRequiredFields(
  draft: ProfileFormState,
): ProfileFormFieldKey[] {
  return PROFILE_FORM_FIELDS.filter(
    (field) => field.required && normalize(draft[field.key]) === "",
  ).map((field) => field.key)
}
