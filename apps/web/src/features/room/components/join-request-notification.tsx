"use client";

import { useCallback } from "react";
import { Check, X, UserRound } from "lucide-react";
import type { UserIdentity } from "@streamify/shared";
import { cn } from "@/shared/lib/cn";

interface JoinRequestNotificationProps {
    requests: UserIdentity[];
    onAccept: (userId: string) => void;
    onReject: (userId: string) => void;
}

export function JoinRequestNotification({
    requests,
    onAccept,
    onReject,
}: JoinRequestNotificationProps) {
    if (requests.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-[60] flex flex-col gap-3 max-w-sm w-full animate-fade-in-up">
            {requests.map((user) => (
                <JoinRequestCard
                    key={user.userId}
                    user={user}
                    onAccept={() => onAccept(user.userId)}
                    onReject={() => onReject(user.userId)}
                />
            ))}
        </div>
    );
}

function JoinRequestCard({
    user,
    onAccept,
    onReject,
}: {
    user: UserIdentity;
    onAccept: () => void;
    onReject: () => void;
}) {
    return (
        <div
            className={cn(
                "session-card rounded-2xl ghost-border shadow-ambient overflow-hidden",
                "animate-slide-in-right",
            )}
        >
            <div className="px-4 py-3.5 flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center border border-primary/20 shrink-0">
                    <UserRound className="h-5 w-5 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">
                        {user.displayName}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                        Wants to join the meeting
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={onReject}
                        className="w-9 h-9 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-all duration-200 border border-destructive/10 hover:border-destructive/30 group"
                        title="Reject"
                    >
                        <X className="h-4 w-4 text-destructive group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={onAccept}
                        className="w-9 h-9 rounded-full bg-secondary/15 hover:bg-secondary/25 flex items-center justify-center transition-all duration-200 border border-secondary/20 hover:border-secondary/40 group"
                        title="Accept"
                    >
                        <Check className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Subtle progress bar animation */}
            <div className="h-0.5 bg-outline-variant/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary/40 to-primary-container/40 animate-pulse" />
            </div>
        </div>
    );
}
