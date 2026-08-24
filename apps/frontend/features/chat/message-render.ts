import type { ChatMessage } from "@/lib/chat-api"

/**
 * Task 048: three render cases, not two. Branches on `isSystemMessage` —
 * the backend already tells us, guessing from `senderUserId === null` would
 * silently break if a future non-system message ever has a null sender.
 */
export type MessageBubbleKind = "mine" | "other" | "system"

type MessageKindInput = Pick<ChatMessage, "senderUserId" | "isSystemMessage">

export function getMessageBubbleKind(
  message: MessageKindInput,
  currentUserId: string | null | undefined,
): MessageBubbleKind {
  if (message.isSystemMessage) {
    return "system"
  }

  return message.senderUserId === currentUserId ? "mine" : "other"
}

/**
 * A system message never joins a group, in either direction: the message
 * after it re-checks `previous.isSystemMessage` and gets `false` too.
 */
export function shouldGroupWithPrevious(
  current: MessageKindInput,
  previous: MessageKindInput | undefined,
): boolean {
  if (!previous) {
    return false
  }

  if (current.isSystemMessage || previous.isSystemMessage) {
    return false
  }

  return current.senderUserId === previous.senderUserId
}
