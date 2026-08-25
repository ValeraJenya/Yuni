/**
 * @jest-environment jsdom
 */
import { createElement } from "react"
import { act, render, screen } from "@testing-library/react"
import { AuthProvider, useAuth } from "@/lib/auth-context"

jest.mock("@/lib/auth-api", () => {
  const actual = jest.requireActual("@/lib/auth-api")
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      refresh: jest.fn(),
    },
  }
})

import { authApi } from "@/lib/auth-api"

const refreshMock = authApi.refresh as jest.Mock

/**
 * Task 079: mounting AuthProvider alone must never call /auth/refresh —
 * that's what caused a 401 on every anonymous public page (landing,
 * /terms, /privacy, /help), since AuthProvider lives in the root layout.
 *
 * This is the negative control: if the useAuth()-triggers-bootstrap
 * mechanism (auth-context.tsx, ensureBootstrapped) is removed or a
 * consumer stops calling useAuth() in its effect, this test goes red on
 * both assertions — "did not call" flips, and "did call" stops being true.
 */
describe("AuthProvider bootstrap (Task 079)", () => {
  beforeEach(() => {
    refreshMock.mockReset()
    refreshMock.mockResolvedValue({
      user: { id: "u1" },
      accessToken: "token-123",
    })
  })

  it("does not call /auth/refresh when no consumer reads session state", () => {
    render(createElement(AuthProvider, null, createElement("div", null, "public page")))

    expect(refreshMock).not.toHaveBeenCalled()
  })

  it("calls /auth/refresh exactly once when a useAuth() consumer mounts", async () => {
    function Consumer() {
      useAuth()
      return null
    }

    await act(async () => {
      render(createElement(AuthProvider, null, createElement(Consumer, null)))
    })

    expect(refreshMock).toHaveBeenCalledTimes(1)
  })

  it("resolves isLoading to false once bootstrap completes", async () => {
    function Consumer() {
      const { isLoading } = useAuth()
      return createElement("span", null, isLoading ? "loading" : "ready")
    }

    await act(async () => {
      render(createElement(AuthProvider, null, createElement(Consumer, null)))
    })

    expect((await screen.findByText("ready")).textContent).toBe("ready")
  })

  it("only triggers one refresh when several consumers mount together", async () => {
    function ConsumerA() {
      useAuth()
      return null
    }

    function ConsumerB() {
      useAuth()
      return null
    }

    await act(async () => {
      render(
        createElement(AuthProvider, null, createElement(ConsumerA, null), createElement(ConsumerB, null)),
      )
    })

    expect(refreshMock).toHaveBeenCalledTimes(1)
  })
})
