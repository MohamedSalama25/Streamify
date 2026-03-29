"use client";

import { Link2, MessageSquare, Users } from "lucide-react";

import { Badge } from "@/features/ui/components/badge";
import { Button } from "@/features/ui/components/button";
import { Card } from "@/features/ui/components/card";
import { BrandMark } from "@/shared/components/brand-mark";

interface RoomHeaderProps {
  roomId: string;
  participantCount: number;
  socketConnected: boolean;
  onCopyLink: () => void;
  onOpenChat: () => void;
  onOpenParticipants: () => void;
}

export function RoomHeader({
  roomId,
  participantCount,
  socketConnected,
  onCopyLink,
  onOpenChat,
  onOpenParticipants,
}: RoomHeaderProps) {
  return (
    <Card className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <BrandMark compact />
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{roomId}</Badge>
          <Badge variant={socketConnected ? "success" : "danger"}>
            {socketConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Badge variant="muted">{participantCount} participants</Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" onClick={onCopyLink}>
          <Link2 className="h-4 w-4" />
          Copy invite
        </Button>
        <Button type="button" variant="secondary" className="xl:hidden" onClick={onOpenParticipants}>
          <Users className="h-4 w-4" />
          People
        </Button>
        <Button type="button" variant="secondary" className="xl:hidden" onClick={onOpenChat}>
          <MessageSquare className="h-4 w-4" />
          Chat
        </Button>
      </div>
    </Card>
  );
}

