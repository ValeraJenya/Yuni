import { cn } from "@/lib/utils"

describe("cn", () => {
  it("joins string class names with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c")
  })

  it("filters out falsy values", () => {
    expect(cn("a", false && "b", null, undefined, "", "c")).toBe("a c")
  })

  it("supports the clsx object syntax", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active")
  })

  it("resolves conflicting Tailwind utility classes by keeping the last one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("keeps non-conflicting classes from both arguments", () => {
    expect(cn("px-2 text-sm", "text-red-500")).toBe("px-2 text-sm text-red-500")
  })
})
