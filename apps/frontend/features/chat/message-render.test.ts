import {
  getMessageBubbleKind,
  shouldGroupWithPrevious,
} from "@/features/chat/message-render"

const CURRENT_USER_ID = "user-1"
const OTHER_USER_ID = "user-2"

function msg(overrides: {
  senderUserId: string | null
  isSystemMessage?: boolean
}) {
  return {
    senderUserId: overrides.senderUserId,
    isSystemMessage: overrides.isSystemMessage ?? false,
  }
}

describe("getMessageBubbleKind", () => {
  it("returns 'mine' when the sender is the current user", () => {
    expect(
      getMessageBubbleKind(msg({ senderUserId: CURRENT_USER_ID }), CURRENT_USER_ID),
    ).toBe("mine")
  })

  it("returns 'other' when the sender is someone else", () => {
    expect(
      getMessageBubbleKind(msg({ senderUserId: OTHER_USER_ID }), CURRENT_USER_ID),
    ).toBe("other")
  })

  it("returns 'system' for a system message, regardless of senderUserId", () => {
    expect(
      getMessageBubbleKind(
        msg({ senderUserId: null, isSystemMessage: true }),
        CURRENT_USER_ID,
      ),
    ).toBe("system")
  })

  it("does not treat a null sender as 'system' by itself", () => {
    // The branch is isSystemMessage, not senderUserId === null (Task 048) —
    // a hypothetical non-system message with a null sender must not render
    // as a service bubble just because the id happens to be null.
    expect(
      getMessageBubbleKind(
        msg({ senderUserId: null, isSystemMessage: false }),
        CURRENT_USER_ID,
      ),
    ).toBe("other")
  })

  it("treats an unknown current user as 'other', not a crash", () => {
    expect(
      getMessageBubbleKind(msg({ senderUserId: OTHER_USER_ID }), undefined),
    ).toBe("other")
  })
})

describe("shouldGroupWithPrevious", () => {
  it("is false when there is no previous message", () => {
    expect(shouldGroupWithPrevious(msg({ senderUserId: CURRENT_USER_ID }), undefined)).toBe(
      false,
    )
  })

  it("is true for consecutive messages from the same sender", () => {
    const previous = msg({ senderUserId: OTHER_USER_ID })
    const current = msg({ senderUserId: OTHER_USER_ID })
    expect(shouldGroupWithPrevious(current, previous)).toBe(true)
  })

  it("is false when the sender changes", () => {
    const previous = msg({ senderUserId: OTHER_USER_ID })
    const current = msg({ senderUserId: CURRENT_USER_ID })
    expect(shouldGroupWithPrevious(current, previous)).toBe(false)
  })

  it("is false when the current message is a system message", () => {
    const previous = msg({ senderUserId: OTHER_USER_ID })
    const current = msg({ senderUserId: null, isSystemMessage: true })
    expect(shouldGroupWithPrevious(current, previous)).toBe(false)
  })

  it("is false when the previous message is a system message", () => {
    // Covers the "next message after a system one" side too — checked from
    // that next message's own call, since grouping only looks backward.
    const previous = msg({ senderUserId: null, isSystemMessage: true })
    const current = msg({ senderUserId: OTHER_USER_ID })
    expect(shouldGroupWithPrevious(current, previous)).toBe(false)
  })

  it("is false between two consecutive system messages", () => {
    const previous = msg({ senderUserId: null, isSystemMessage: true })
    const current = msg({ senderUserId: null, isSystemMessage: true })
    expect(shouldGroupWithPrevious(current, previous)).toBe(false)
  })
})
