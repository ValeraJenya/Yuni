import type { Lang } from "@/types/auth"
import type { ProfileFormFieldKey } from "./form-state"

interface FieldCopy {
  label: string
  placeholder: string
  hint?: string
}

interface ProfileFormCopy {
  fields: Record<ProfileFormFieldKey, FieldCopy>
  discoverableLabel: string
  discoverableHint: string
  requiredLegend: string
  optionalMark: string
}

/**
 * Тексты анкеты вынесены из экрана профиля, чтобы онбординг (Task 070)
 * показывал те же подписи, а не свою копию, которая разъедется при первой же
 * правке.
 */
export const profileFormCopy: Record<Lang, ProfileFormCopy> = {
  ru: {
    fields: {
      displayName: { label: "Имя", placeholder: "Как вас называть" },
      bio: {
        label: "О себе",
        placeholder: "Несколько фраз: чем занимаетесь, что любите, кого ищете",
      },
      gender: { label: "Гендер", placeholder: "Например: женщина" },
      lookingFor: { label: "Кого ищете", placeholder: "Например: мужчину" },
      city: { label: "Город", placeholder: "Москва" },
      country: { label: "Страна", placeholder: "Россия" },
    },
    discoverableLabel: "Показывать анкету в поиске",
    discoverableHint:
      "Выключите, если хотите взять паузу: анкета пропадёт из выдачи, переписки останутся.",
    requiredLegend:
      "Поля со звёздочкой нужны, чтобы анкета участвовала в поиске. Остальное — по желанию.",
    optionalMark: "необязательно",
  },
  en: {
    fields: {
      displayName: { label: "Name", placeholder: "What to call you" },
      bio: {
        label: "About me",
        placeholder: "A few lines: what you do, what you love, who you look for",
      },
      gender: { label: "Gender", placeholder: "For example: woman" },
      lookingFor: { label: "Looking for", placeholder: "For example: a man" },
      city: { label: "City", placeholder: "London" },
      country: { label: "Country", placeholder: "United Kingdom" },
    },
    discoverableLabel: "Show my profile in discover",
    discoverableHint:
      "Turn it off to take a break: your profile leaves discover, your chats stay.",
    requiredLegend:
      "Starred fields are required for your profile to appear in discover. The rest is optional.",
    optionalMark: "optional",
  },
}
