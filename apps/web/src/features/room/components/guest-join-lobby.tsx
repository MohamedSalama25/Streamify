"use client";

import { useState, useCallback, type FormEvent } from "react";
import { UserRound, ArrowRight, Shield, Sparkles, Lock, Video } from "lucide-react";

import { Input } from "@/features/ui/components/input";
import { Button } from "@/features/ui/components/button";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";

interface GuestJoinLobbyProps {
    roomId: string;
    initialDisplayName?: string;
    onJoin: (displayName: string) => void;
}

export function GuestJoinLobby({ roomId, initialDisplayName = "", onJoin }: GuestJoinLobbyProps) {
    const [displayName, setDisplayName] = useState(initialDisplayName);
    const [isFocused, setIsFocused] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const { t } = useI18n();

    const isValid = displayName.trim().length >= 2;

    const handleSubmit = useCallback(
        (e: FormEvent) => {
            e.preventDefault();
            if (!isValid || isJoining) return;
            setIsJoining(true);
            onJoin(displayName.trim());
        },
        [displayName, isValid, isJoining, onJoin],
    );

    return (
        <div className="fixed inset-0 bg-surface-container-lowest font-body text-on-surface flex items-center justify-center overflow-hidden">
            {/* ── Animated Background ── */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] opacity-20 animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[160px] opacity-30 animate-pulse [animation-delay:1s]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary-container/10 rounded-full blur-[120px] opacity-20 animate-pulse [animation-delay:2s]" />
            </div>

            {/* ── Floating Particles ── */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
                        style={{
                            left: `${15 + i * 14}%`,
                            top: `${20 + (i % 3) * 25}%`,
                            animationDelay: `${i * 0.7}s`,
                            animationDuration: `${3 + i * 0.5}s`,
                        }}
                    />
                ))}
            </div>

            {/* ── Main Content ── */}
            <div className="relative z-10 w-full max-w-md px-4 animate-fade-in-up">
                {/* ── Logo & Branding ── */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5 shadow-[0_0_40px_hsl(var(--primary)/0.15)]">
                        <Video className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold font-display tracking-tight text-on-surface">
                        Streamify
                    </h1>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-surface-container-high/60 px-3 py-1 border border-outline-variant/10">
                        <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                        <span className="text-xs uppercase tracking-widest font-medium text-on-surface-variant">
                            Room: {roomId}
                        </span>
                    </div>
                </div>

                {/* ── Join Card ── */}
                <div className="session-card rounded-3xl ghost-border shadow-ambient overflow-hidden">
                    {/* Card Header Gradient */}
                    <div className="relative px-6 pt-7 pb-5 bg-gradient-to-b from-primary/5 to-transparent">
                        <h2 className="font-display text-xl font-bold text-on-surface text-center">
                            {t.session.guestJoinTitle}
                        </h2>
                        <p className="text-sm text-on-surface-variant text-center mt-1.5">
                            {t.session.guestJoinSubtitle}
                        </p>
                    </div>

                    {/* Card Body */}
                    <form onSubmit={handleSubmit} className="px-6 pb-7 space-y-5">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="text-label-md font-medium uppercase text-on-surface-variant block tracking-wide">
                                {t.session.displayName}
                            </label>
                            <div className="relative group">
                                <div
                                    className={cn(
                                        "absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/40 to-primary-container/40 opacity-0 blur-sm transition-opacity duration-500",
                                        isFocused && "opacity-100",
                                    )}
                                />
                                <div className="relative">
                                    <UserRound
                                        className={cn(
                                            "pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300",
                                            isFocused ? "text-primary" : "text-muted-foreground",
                                        )}
                                    />
                                    <Input
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        placeholder={t.session.guestJoinPlaceholder}
                                        className="ps-11 h-12 rounded-xl text-sm bg-surface-container-lowest/80 border border-outline-variant/10 focus:border-primary/40"
                                        maxLength={32}
                                        autoFocus
                                        autoComplete="off"
                                        id="guest-display-name"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-lowest/50 border border-outline-variant/10">
                            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-on-surface">
                                    {t.session.guestJoinReady}
                                </p>
                                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                                    {t.session.guestJoinReadyDesc}
                                </p>
                            </div>
                        </div>

                        {/* Join Button */}
                        <Button
                            type="submit"
                            size="lg"
                            disabled={!isValid || isJoining}
                            className={cn(
                                "w-full h-12 text-sm font-bold uppercase tracking-wider transition-all duration-500",
                                isValid && !isJoining
                                    ? "shadow-[0_0_30px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.35)]"
                                    : "opacity-50",
                            )}
                            id="guest-join-button"
                        >
                            {isJoining ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    <span>Connecting...</span>
                                </div>
                            ) : (
                                <>
                                    {t.session.guestJoinButton}
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Card Footer — Security Badges */}
                    <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-lowest/30">
                        <div className="flex items-center justify-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <Shield className="h-3 w-3 text-secondary" />
                                <span className="text-[10px] uppercase tracking-widest font-medium text-on-surface-variant">
                                    {t.session.guestJoinSecure}
                                </span>
                            </div>
                            <div className="w-px h-3 bg-outline-variant/20" />
                            <div className="flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3 text-primary" />
                                <span className="text-[10px] uppercase tracking-widest font-medium text-on-surface-variant">
                                    {t.session.guestJoinHd}
                                </span>
                            </div>
                            <div className="w-px h-3 bg-outline-variant/20" />
                            <div className="flex items-center gap-1.5">
                                <Lock className="h-3 w-3 text-secondary" />
                                <span className="text-[10px] uppercase tracking-widest font-medium text-on-surface-variant">
                                    {t.session.guestJoinEncrypted}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Bottom Branding ── */}
                <p className="text-center mt-6 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-medium">
                    Powered by Streamify Elite
                </p>
            </div>
        </div>
    );
}
