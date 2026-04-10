"use client";

import React, { useEffect, useState, useCallback, type FormEvent } from "react";
import { Mic, Video as VideoIcon, MonitorUp, MicOff, VideoOff, MonitorOff, ArrowRight, ShieldCheck, EyeOff, User } from "lucide-react";
import { cn } from "@/shared/lib/cn";

import { PageBackground } from "@/features/layout/components/page-background";

interface GuestJoinLobbyProps {
    roomId: string;
    initialDisplayName?: string;
    onJoin: (displayName: string, media: { mic: boolean; cam: boolean; screen: boolean }) => void;
}

export function GuestJoinLobby({ roomId, initialDisplayName = "", onJoin }: GuestJoinLobbyProps) {
    const [displayName, setDisplayName] = useState(initialDisplayName);
    const [isJoining, setIsJoining] = useState(false);

    const [micState, setMicState] = useState(true);
    const [camState, setCamState] = useState(true);
    const [screenState, setScreenState] = useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const streamRef = React.useRef<MediaStream | null>(null);

    useEffect(() => {
        let isMounted = true;
        const initMedia = async () => {
            if (!camState) return;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                if (isMounted) {
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                }
            } catch (err) {
                console.warn("Lobby cam access denied or unavailable", err);
            }
        };
        initMedia();
        return () => {
            isMounted = false;
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, []);

    const handleToggleCam = async () => {
        if (camState) {
            setCamState(false);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            if (videoRef.current) videoRef.current.srcObject = null;
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                setCamState(true);
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                console.warn("Cannot enable cam", err);
            }
        }
    };


    const isValid = displayName.trim().length >= 2;

    const handleSubmit = useCallback(
        (e: FormEvent) => {
            e.preventDefault();
            if (!isValid || isJoining) return;
            setIsJoining(true);
            onJoin(displayName.trim(), { mic: micState, cam: camState, screen: screenState });
        },
        [displayName, isValid, isJoining, micState, camState, screenState, onJoin]
    );

    return (
        <div className="relative min-h-screen w-full text-on-surface font-body overflow-hidden flex flex-col xl:flex-row">
            <PageBackground imageUrl="/images/app-background.png" />


            {/* Main Stage */}
            <section className="flex-1 p-8 lg:p-12 flex flex-col items-center justify-center overflow-y-auto relative">
                <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-12 items-start relative z-10">

                    {/* Center Video Column */}
                    <div className="flex-1 w-full space-y-8">
                        {/* Glassmorphic Video Container */}
                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-[rgba(15,19,30,0.6)] backdrop-blur-3xl ring-1 ring-white/10 shadow-2xl group">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={cn(
                                    "w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-[1.02]",
                                    !camState && "opacity-0"
                                )}
                            />
                            {!camState && (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#0f131e]">
                                    <div className="w-24 h-24 rounded-full bg-[#1b1f2b] flex items-center justify-center border-2 border-white/5 shadow-2xl">
                                        <User className="w-12 h-12 text-[#908fa0]" />
                                    </div>
                                </div>
                            )}

                            {/* Top Indicator */}
                            <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md ring-1 ring-white/10">
                                <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></div>
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                                    Preview Only
                                </span>
                            </div>

                            {/* Video Controls Overlay */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-full bg-[#313441]/80 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl">
                                <button type="button" onClick={() => setMicState(!micState)} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-[0_0_15px_rgba(0,0,0,0.2)]", micState ? "bg-[#262a36] hover:bg-[#353945] text-white" : "bg-error text-on-error")}>
                                    {micState ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                                </button>
                                <button type="button" onClick={handleToggleCam} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-[0_0_15px_rgba(0,0,0,0.2)]", camState ? "bg-[#262a36] hover:bg-[#353945] text-white" : "bg-error text-on-error")}>
                                    {camState ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                                </button>
                                <div className="h-6 w-px bg-white/20 mx-2"></div>
                                <button type="button" onClick={() => setScreenState(!screenState)} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-[0_0_15px_rgba(192,193,255,0.1)]", screenState ? "bg-primary text-on-primary" : "bg-[#262a36] hover:bg-[#353945] text-[#c0c1ff]")}>
                                    {screenState ? <MonitorUp className="h-5 w-5" /> : <MonitorOff className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Device Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#908fa0] px-1">
                                    Microphone
                                </label>
                                <div className="relative">
                                    <select disabled className="w-full bg-[#171b27] border-0 border-b-2 border-transparent focus:border-[#c0c1ff] focus:ring-0 rounded-xl text-sm py-3 px-4 appearance-none text-white cursor-not-allowed opacity-80">
                                        <option>System Default Mic</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#908fa0] px-1">
                                    Camera
                                </label>
                                <div className="relative">
                                    <select disabled className="w-full bg-[#171b27] border-0 border-b-2 border-transparent focus:border-[#c0c1ff] focus:ring-0 rounded-xl text-sm py-3 px-4 appearance-none text-white cursor-not-allowed opacity-80">
                                        <option>System Default Camera</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#908fa0] px-1">
                                    Speakers
                                </label>
                                <div className="relative">
                                    <select disabled className="w-full bg-[#171b27] border-0 border-b-2 border-transparent focus:border-[#c0c1ff] focus:ring-0 rounded-xl text-sm py-3 px-4 appearance-none text-white cursor-not-allowed opacity-80">
                                        <option>System Default Speaker</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Panel Column */}
                    <div className="w-full lg:w-80 space-y-8 pt-4">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-extrabold font-headline tracking-tighter text-white">
                                Ready to join?
                            </h1>
                            <p className="text-[#c7c4d7] text-sm leading-relaxed">
                                Everything is set. Your camera and microphone are optimized for the elite experience.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="space-y-2 mb-2">
                                <div className="flex justify-between items-center px-1">
                                    <label htmlFor="display-name" className="text-[10px] font-bold uppercase tracking-widest text-[#c0c1ff]">
                                        Display Name
                                    </label>
                                </div>
                                <input
                                    id="display-name"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Enter your name..."
                                    className="w-full bg-[#171b27] border border-white/10 focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff]/20 rounded-xl text-sm py-4 px-5 text-white placeholder:text-[#908fa0] transition-all outline-none"
                                    autoComplete="off"
                                    maxLength={32}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!isValid || isJoining}
                                className={cn(
                                    "w-full py-5 rounded-xl font-bold text-[#1000a9] shadow-lg shadow-[#c0c1ff]/20 hover:shadow-[#c0c1ff]/30 transition-all flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed",
                                    "bg-gradient-to-br from-[#c0c1ff] to-[#8083ff]"
                                )}
                            >
                                <span className="relative z-10 text-lg">
                                    {isJoining ? "Connecting..." : "Join Session"}
                                </span>
                                {!isJoining && (
                                    <ArrowRight className="h-5 w-5 relative z-10 transition-transform group-hover:translate-x-1" />
                                )}
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                            </button>
                        </form>

                        <div className="p-6 rounded-2xl bg-[#171b27] ring-1 ring-white/5 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-tighter text-[#908fa0]">
                                Security Check
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-[#4edea3]">
                                <ShieldCheck className="h-5 w-5" />
                                <span>End-to-End Encrypted</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-[#c7c4d7]">
                                <EyeOff className="h-5 w-5 text-[#908fa0]" />
                                <span>Waiting room enabled</span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
}
