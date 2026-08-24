import { ApiError, apiRequest } from "@/lib/auth-api"

function jsonResponse(body: unknown, init: { status?: number; statusText?: string } = {}) {
  return {
    ok: true,
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    json: async () => body,
  } as Response
}

function errorResponse(
  body: unknown,
  init: { status?: number; statusText?: string } = {},
) {
  return {
    ok: false,
    status: init.status ?? 400,
    statusText: init.statusText ?? "Bad Request",
    json: async () => body,
  } as Response
}

describe("apiRequest", () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it("defaults to a GET request with no body", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))

    await apiRequest("/auth/me")

    const [, options] = fetchMock.mock.calls[0]
    expect(options.method).toBe("GET")
    expect(options.body).toBeUndefined()
    expect(options.headers).not.toHaveProperty("Content-Type")
  })

  it("JSON-serializes a plain object body and sets Content-Type", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))

    await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "user@example.com", password: "secret" },
    })

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers["Content-Type"]).toBe("application/json")
    expect(options.body).toBe(
      JSON.stringify({ email: "user@example.com", password: "secret" }),
    )
  })

  it("passes a FormData body through unserialized and without Content-Type", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))

    const formData = new FormData()
    formData.append("file", "fake-contents")

    await apiRequest("/media/profile-photos", {
      method: "POST",
      body: formData,
    })

    const [, options] = fetchMock.mock.calls[0]
    expect(options.body).toBe(formData)
    expect(options.headers).not.toHaveProperty("Content-Type")
  })

  it("adds an Authorization header when an access token is given", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))

    await apiRequest("/auth/me", { accessToken: "token-123" })

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers.Authorization).toBe("Bearer token-123")
  })

  it("resolves with the parsed JSON body on success", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ user: { id: "u1" } }))

    await expect(apiRequest("/auth/me")).resolves.toEqual({ user: { id: "u1" } })
  })

  it("throws an ApiError using the first message when the backend sends an array", async () => {
    fetchMock.mockResolvedValue(
      errorResponse(
        { message: ["email must be an email", "password is too short"] },
        { status: 422 },
      ),
    )

    const error = await apiRequest("/auth/register").catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(422)
    expect((error as ApiError).message).toBe("email must be an email")
    expect((error as ApiError).messages).toEqual([
      "email must be an email",
      "password is too short",
    ])
  })

  it("throws an ApiError using a single string message", async () => {
    fetchMock.mockResolvedValue(errorResponse({ message: "Invalid credentials" }))

    const error = await apiRequest("/auth/login").catch((e) => e)

    expect((error as ApiError).message).toBe("Invalid credentials")
  })

  it("falls back to statusText when the backend sends no message", async () => {
    fetchMock.mockResolvedValue(
      errorResponse({}, { status: 500, statusText: "Internal Server Error" }),
    )

    const error = await apiRequest("/auth/login").catch((e) => e)

    expect((error as ApiError).message).toBe("Internal Server Error")
  })

  it("falls back to statusText when the error body fails to parse as JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: async () => {
        throw new Error("not json")
      },
    } as unknown as Response)

    const error = await apiRequest("/auth/login").catch((e) => e)

    expect((error as ApiError).message).toBe("Bad Gateway")
  })
})
