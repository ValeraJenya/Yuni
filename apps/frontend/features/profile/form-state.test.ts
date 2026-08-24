import type { SelfProfile } from "@/lib/profile-api"

import {
  createProfileForm,
  isProfileFormDirty,
  missingRequiredFields,
  toUpdateProfileRequest,
  type ProfileFormState,
} from "@/features/profile/form-state"

const baseProfile: SelfProfile = {
  userId: "user-1",
  handle: "user1",
  displayName: "Alex",
  bio: "Hello there",
  gender: "female",
  lookingFor: "friendship",
  city: "Berlin",
  country: "Germany",
  isDiscoverable: true,
  completion: { isComplete: true, missingFields: [], percentage: 100 },
  photos: [],
}

function makeForm(overrides: Partial<ProfileFormState> = {}): ProfileFormState {
  return {
    displayName: "Alex",
    bio: "Hello there",
    gender: "female",
    lookingFor: "friendship",
    city: "Berlin",
    country: "Germany",
    isDiscoverable: true,
    ...overrides,
  }
}

describe("createProfileForm", () => {
  it("copies the editable fields from the profile", () => {
    expect(createProfileForm(baseProfile)).toEqual(makeForm())
  })

  it("defaults isDiscoverable to true when the profile omits it", () => {
    const profileWithoutIsDiscoverable: SelfProfile = {
      ...baseProfile,
      isDiscoverable: undefined,
    }
    expect(
      createProfileForm(profileWithoutIsDiscoverable).isDiscoverable,
    ).toBe(true)
  })

  it("preserves isDiscoverable: false rather than defaulting it", () => {
    expect(
      createProfileForm({ ...baseProfile, isDiscoverable: false }).isDiscoverable,
    ).toBe(false)
  })
})

describe("isProfileFormDirty", () => {
  it("is false for an identical draft", () => {
    expect(isProfileFormDirty(makeForm(), makeForm())).toBe(false)
  })

  it("treats null and empty string as the same value", () => {
    const saved = makeForm({ bio: null })
    const draft = makeForm({ bio: "" })
    expect(isProfileFormDirty(draft, saved)).toBe(false)
  })

  it("treats whitespace-only edits as not dirty", () => {
    const saved = makeForm({ city: "Berlin" })
    const draft = makeForm({ city: "  Berlin  " })
    expect(isProfileFormDirty(draft, saved)).toBe(false)
  })

  it("is true when a text field actually changes", () => {
    const saved = makeForm()
    const draft = makeForm({ city: "Munich" })
    expect(isProfileFormDirty(draft, saved)).toBe(true)
  })

  it("is true when isDiscoverable changes, even if every field matches", () => {
    const saved = makeForm({ isDiscoverable: true })
    const draft = makeForm({ isDiscoverable: false })
    expect(isProfileFormDirty(draft, saved)).toBe(true)
  })
})

describe("toUpdateProfileRequest", () => {
  it("trims and forwards non-empty fields", () => {
    const request = toUpdateProfileRequest(makeForm({ city: "  Berlin  " }))
    expect(request.city).toBe("Berlin")
  })

  it("sends an empty optional field as null, not as an empty string", () => {
    // Regression guard: the backend treats "" as a filled value and would
    // count the profile as complete even though the user cleared the field.
    const request = toUpdateProfileRequest(makeForm({ bio: "" }))
    expect(request.bio).toBeNull()
  })

  it("sends a whitespace-only optional field as null", () => {
    const request = toUpdateProfileRequest(makeForm({ country: "   " }))
    expect(request.country).toBeNull()
  })

  it("sends a null optional field through as null", () => {
    const request = toUpdateProfileRequest(makeForm({ lookingFor: null }))
    expect(request.lookingFor).toBeNull()
  })

  it("normalizes displayName but does not turn it into null when empty", () => {
    // displayName has no backend null state (see PROFILE_FORM_FIELDS) — an
    // empty draft is sent as "", left for required-field validation to catch.
    const request = toUpdateProfileRequest(makeForm({ displayName: "  " }))
    expect(request.displayName).toBe("")
  })

  it("forwards isDiscoverable unchanged", () => {
    expect(
      toUpdateProfileRequest(makeForm({ isDiscoverable: false })).isDiscoverable,
    ).toBe(false)
  })
})

describe("missingRequiredFields", () => {
  it("returns an empty list when every required field is filled", () => {
    expect(missingRequiredFields(makeForm())).toEqual([])
  })

  it("lists blank required fields by key", () => {
    const draft = makeForm({ bio: "", city: "   " })
    expect(missingRequiredFields(draft)).toEqual(
      expect.arrayContaining(["bio", "city"]),
    )
    expect(missingRequiredFields(draft)).toHaveLength(2)
  })

  it("does not flag isDiscoverable, which is not a required text field", () => {
    const draft = makeForm({ isDiscoverable: false })
    expect(missingRequiredFields(draft)).toEqual([])
  })
})
