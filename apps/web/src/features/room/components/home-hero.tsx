"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, Mic, Shield, Monitor, Video } from "lucide-react";

import { usePersistentIdentity } from "@/features/auth/hooks/use-persistent-identity";
import { IdentityForm } from "@/features/auth/components/identity-form";
import { useHomeActions } from "@/features/room/hooks/use-home-actions";
import { Button } from "@/features/ui/components/button";
import { Input } from "@/features/ui/components/input";
import { TopNav } from "@/features/layout/components/top-nav";
import { PageBackground } from "@/features/layout/components/page-background";
import { useI18n } from "@/shared/i18n";

export function HomeHero() {
  const { identity, upsertIdentity } = usePersistentIdentity();
  const [displayName, setDisplayName] = useState(identity?.displayName ?? "");
  const [roomId, setRoomId] = useState("");
  const { isCreatingRoom, isBusy, handleCreateRoom, handleJoinRoom } = useHomeActions({
    displayName,
    roomId,
    upsertIdentity,
  });
  const { t } = useI18n();

  useEffect(() => {
    if (identity?.displayName) {
      setDisplayName(identity.displayName);
    }
  }, [identity?.displayName]);

  const features = [
    {
      icon: Mic,
      title: t.features.audio.title,
      description: t.features.audio.description,
    },
    {
      icon: Shield,
      title: t.features.security.title,
      description: t.features.security.description,
    },
    {
      icon: Monitor,
      title: t.features.screenShare.title,
      description: t.features.screenShare.description,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <PageBackground imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuCEFX8-PekjQB9w8ytQENtxWp_9Srnq05pKITWI_25PklnewCczrGS4rg7hkk97pyMGwHp2T9zYojrh4nZK2_ItHkMbbdp-EhUOV0MxdR1mouEJJONs1Q4LO-vd3lEnNv9xxEbxxm_xKrgwexspSfU9gXVmHYhcLF1be2kfS4e5qLB_f-ic8YPm9IlYAKYsoMPEiqStPnOh_T6tAjPjyPUMapFujhY0OW0pL-5hGZbD9ViYrqb9ZGrBUPbItNJM-G5q8Ye6v7981zI" />

      {/* ── Top Navigation ── */}
      <TopNav />

      {/* ── Main Content ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-12 lg:px-8 lg:pt-32 lg:pb-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16 items-start">

          {/* ── Left Column — Hero Content ── */}
          <div className="space-y-10 animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-high ghost-border px-4 py-1.5 text-label-md uppercase font-medium tracking-widest text-on-surface-variant">
              <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulseGlow" />
              {t.hero.badge}
            </div>

            {/* Headline */}
            <div className="space-y-6">
              <h1 className="text-display-lg font-extrabold text-on-surface max-w-2xl">
                {t.hero.titlePre}{" "}
                <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent italic">
                  {t.hero.titleHighlight}
                </span>
                <br />
                {t.hero.titlePost}
              </h1>
              <p className="max-w-xl text-body-lg text-on-surface-variant leading-relaxed">
                {t.hero.description}
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="feature-card group rounded-2xl ghost-border p-5 transition-all duration-300 hover:shadow-glow cursor-default"
                >
                  <feature.icon className="mb-3 h-5 w-5 text-primary" />
                  <p className="font-display text-title-md font-semibold text-on-surface">
                    {feature.title}
                  </p>
                  <p className="mt-2 text-body-md text-on-surface-variant">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Column — Session Card ── */}
          <div className="animate-slide-in-right [animation-delay:200ms] opacity-0 lg:sticky lg:top-24">
            <div className="session-card rounded-3xl ghost-border shadow-ambient p-6 space-y-6">
              {/* Card Header */}
              <div className="space-y-1">
                <h2 className="font-display text-headline-md font-bold text-on-surface">
                  {t.session.title}
                </h2>
                <p className="text-body-md text-on-surface-variant">
                  {t.session.description}
                </p>
              </div>

              {/* Identity Form */}
              <IdentityForm value={displayName} onChange={setDisplayName} />

              {/* Create Room */}
              <Button
                type="button"
                size="lg"
                onClick={() => void handleCreateRoom()}
                disabled={isBusy}
                className="w-full"
              >
                {isCreatingRoom ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                {t.session.createRoom}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-outline-variant/20" />
                <span className="text-label-md text-muted-foreground">{t.session.or}</span>
                <div className="h-px flex-1 bg-outline-variant/20" />
              </div>

              {/* Join Room */}
              <div className="space-y-3">
                <label className="block space-y-2">
                  <span className="text-label-md font-medium uppercase text-on-surface-variant">
                    {t.session.roomCode}
                  </span>
                  <Input
                    value={roomId}
                    onChange={(event) => setRoomId(event.target.value.toUpperCase())}
                    placeholder={t.session.roomCodePlaceholder}
                    maxLength={6}
                    className="uppercase tracking-[0.28em] text-center"
                  />
                </label>
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  onClick={handleJoinRoom}
                  disabled={isBusy}
                  className="w-full"
                >
                  {t.session.joinSession}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Section — Designed for Focus ── */}
        <section className="mt-20 lg:mt-28">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            {/* Preview */}
            <div className="relative rounded-3xl ghost-border overflow-hidden bg-surface-container-lowest aspect-video flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high">
                  <Monitor className="h-7 w-7 text-on-surface-variant" />
                </div>
                <p className="text-label-md uppercase tracking-widest text-muted-foreground">
                  {t.session.noSignal}
                </p>
              </div>
            </div>

            {/* Focus Description */}
            <div className="space-y-5">
              <h2 className="text-headline-lg font-bold text-on-surface">
                {t.focus.title}
              </h2>
              <p className="text-body-lg text-on-surface-variant leading-relaxed max-w-lg">
                {t.focus.description}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
