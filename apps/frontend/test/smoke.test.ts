import { cn } from "@/lib/utils"

describe("jest runner smoke test", () => {
  it("resolves the @ alias and executes TypeScript", () => {
    expect(cn("a", false && "b", "c")).toBe("a c")
  })
})
