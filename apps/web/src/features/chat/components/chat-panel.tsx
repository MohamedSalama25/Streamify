"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { MessageSquare, SendHorizontal } from "lucide-react";
import type { ChatMessage } from "@streamify/shared";

import { useChatScroll } from "@/features/chat/hooks/use-chat-scroll";
import { Button } from "@/features/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/card";
import { Input } from "@/features/ui/components/input";
import { ScrollArea } from "@/features/ui/components/scroll-area";
import { Separator } from "@/features/ui/components/separator";
import { ChatMessageItem } from "./chat-message-item";

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => Promise<void>;
  className?: string;
}

export function ChatPanel({
  messages,
  currentUserId,
  onSendMessage,
  className,
}: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useChatScroll(messages.length);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextMessage = message.trim();
    if (!nextMessage) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSendMessage(nextMessage);
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg">Chat</CardTitle>
          <p className="text-sm text-slate-400">Messages stay scoped to this room.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300">
          <MessageSquare className="h-4 w-4" />
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex min-h-[320px] flex-col gap-4 p-4">
        <ScrollArea className="flex-1 rounded-2xl border border-white/5 bg-slate-950/30">
          <div ref={scrollRef} className="flex max-h-[360px] flex-col gap-3 p-3">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] text-center text-sm text-slate-500">
                No messages yet. Start the conversation.
              </div>
            ) : (
              messages.map((entry) => (
                <ChatMessageItem
                  key={entry.id}
                  message={entry}
                  isCurrentUser={entry.sender.userId === currentUserId}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <form className="flex items-center gap-2" onSubmit={handleSubmit}>
          <Input
            aria-label="Type a message"
            placeholder="Send a message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={1000}
          />
          <Button type="submit" size="icon" disabled={isSubmitting || message.trim().length === 0}>
            <SendHorizontal className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
