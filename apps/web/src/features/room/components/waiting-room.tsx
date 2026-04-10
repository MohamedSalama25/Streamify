"use client";

import { ArrowLeft, ShieldCheck, XCircle } from "lucide-react";
import { useI18n } from "@/shared/i18n";

import { PageBackground } from "@/features/layout/components/page-background";

export type WaitingRoomStatus = "waiting" | "rejected";

interface WaitingRoomProps {
    roomId: string;
    displayName: string;
    status: WaitingRoomStatus;
    onBack: () => void;
}

export function WaitingRoom({ roomId, displayName, status, onBack }: WaitingRoomProps) {
    const { t } = useI18n();

    return (
        <div className="fixed inset-0 font-body text-on-surface flex items-center justify-center overflow-hidden">
            <PageBackground imageUrl="/images/app-background.png" />
            {/* ── Animated Background ── */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] opacity-20 animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[160px] opacity-30 animate-pulse [animation-delay:1s]" />
            </div>

            {/* ── Main Content ── */}
            <div className="relative z-10 w-full max-w-md px-4 animate-fade-in-up">
                <div className="session-card rounded-3xl ghost-border shadow-ambient overflow-hidden text-center">
                    {status === "waiting" ? (
                        <>
                            {/* Waiting State */}
                            <div className="px-8 pt-10 pb-8 space-y-6">
                                {/* Animated Spinner Ring */}
                                <div className="relative mx-auto w-20 h-20">
                                    <div className="absolute inset-0 rounded-full border-[3px] border-outline-variant/10" />
                                    <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-lg font-bold text-primary font-display">
                                                {displayName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Text */}
                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold font-display text-on-surface">
                                        {t.session.waitingTitle}
                                    </h2>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        {t.session.waitingDesc}
                                    </p>
                                </div>

                                {/* User Info Pill */}
                                <div className="inline-flex items-center gap-3 bg-surface-container-lowest/60 rounded-full px-4 py-2.5 border border-outline-variant/10">
                                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-on-surface">{displayName}</span>
                                    <div className="w-px h-4 bg-outline-variant/20" />
                                    <span className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">
                                        Room: {roomId}
                                    </span>
                                </div>

                                {/* Pulsing dots */}
                                <div className="flex items-center justify-center gap-1.5 pt-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:600ms]" />
                                </div>

                                {/* Cancel Request Button */}
                                <div className="pt-4 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={onBack}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all duration-200"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        {t.session.cancelRequest}
                                    </button>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-4 border-t border-outline-variant/10 bg-surface-container-lowest/30">
                                <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-medium text-on-surface-variant">
                                    <ShieldCheck className="h-3 w-3 text-secondary" />
                                    {t.session.waitingSecure}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Rejected State */}
                            <div className="px-8 pt-10 pb-8 space-y-6">
                                <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                                    <XCircle className="h-8 w-8 text-destructive" />
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold font-display text-on-surface">
                                        {t.session.rejectedTitle}
                                    </h2>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        {t.session.rejectedDesc}
                                    </p>
                                </div>

                                <button
                                    onClick={onBack}
                                    className="inline-flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest rounded-full px-6 py-2.5 text-sm font-medium text-on-surface transition-all duration-300 border border-outline-variant/10"
                                >
                                    {t.session.rejectedBack}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <p className="text-center mt-6 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-medium">
                    Powered by Streamify Elite
                </p>
            </div>
        </div>
    );
}
