import type { ChatMessage } from "@streamify/shared";

import { Badge } from "@/features/ui/components/badge";
import { cn } from "@/shared/lib/cn";
import { formatTimestamp } from "@/shared/utils/format-time";

interface ChatMessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

export function ChatMessageItem({ message, isCurrentUser }: ChatMessageItemProps) {
  return (
    <div
      className={cn("flex", isCurrentUser ? "justify-end" : "justify-start")}
      aria-label={`${message.sender.displayName} at ${formatTimestamp(message.timestamp)}`}
    >
      <div
        className={cn(
          "max-w-[90%] space-y-2 rounded-2xl border px-4 py-3 text-sm shadow-sm",
          isCurrentUser
            ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-50"
            : "border-white/10 bg-white/5 text-slate-100",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium">{isCurrentUser ? "You" : message.sender.displayName}</p>
          <Badge variant="muted">{formatTimestamp(message.timestamp)}</Badge>
        </div>
        <p className="whitespace-pre-wrap break-words text-slate-200">{message.text}</p>
      </div>
    </div>
  );
}

