import { avatarUrlOrDefault, defaultAvatarUrl } from "@/lib/default-avatar"

describe("defaultAvatarUrl", () => {
  it("returns the female card avatar for 'female'", () => {
    expect(defaultAvatarUrl("female")).toBe("/avatar-default-female.webp")
  })

  it("returns the male card avatar for 'male'", () => {
    expect(defaultAvatarUrl("male")).toBe("/avatar-default-male.webp")
  })

  it("returns the square variant when requested", () => {
    expect(defaultAvatarUrl("female", "square")).toBe(
      "/avatar-default-female-square.webp",
    )
    expect(defaultAvatarUrl("male", "square")).toBe(
      "/avatar-default-male-square.webp",
    )
  })

  it("normalizes casing", () => {
    expect(defaultAvatarUrl("Female")).toBe("/avatar-default-female.webp")
    expect(defaultAvatarUrl("MALE")).toBe("/avatar-default-male.webp")
  })

  it("normalizes surrounding whitespace", () => {
    expect(defaultAvatarUrl("  female  ")).toBe("/avatar-default-female.webp")
  })

  it("falls back to the neutral avatar for an unfilled value", () => {
    expect(defaultAvatarUrl(null)).toBe("/avatar-default-neutral.svg")
    expect(defaultAvatarUrl(undefined)).toBe("/avatar-default-neutral.svg")
    expect(defaultAvatarUrl("")).toBe("/avatar-default-neutral.svg")
    expect(defaultAvatarUrl("   ")).toBe("/avatar-default-neutral.svg")
  })

  it("falls back to the neutral avatar for an unrecognized value", () => {
    expect(defaultAvatarUrl("nonbinary")).toBe("/avatar-default-neutral.svg")
  })
})

describe("avatarUrlOrDefault", () => {
  it("returns the given photo URL when present, regardless of gender", () => {
    expect(avatarUrlOrDefault("https://cdn.example.com/photo.jpg", "male")).toBe(
      "https://cdn.example.com/photo.jpg",
    )
  })

  it("falls back to the gendered default when the photo URL is null", () => {
    expect(avatarUrlOrDefault(null, "female")).toBe(
      "/avatar-default-female.webp",
    )
  })

  it("falls back to the gendered default when the photo URL is an empty string", () => {
    expect(avatarUrlOrDefault("", "male")).toBe("/avatar-default-male.webp")
  })

  it("passes the variant through to the fallback", () => {
    expect(avatarUrlOrDefault(null, "female", "square")).toBe(
      "/avatar-default-female-square.webp",
    )
  })
})
