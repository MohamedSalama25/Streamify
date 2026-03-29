"use client";

import { UserRound } from "lucide-react";
import { Input } from "@/features/ui/components/input";
import { useI18n } from "@/shared/i18n";

interface IdentityFormProps {
  value: string;
  onChange: (value: string) => void;
}

export function IdentityForm({ value, onChange }: IdentityFormProps) {
  const { t } = useI18n();

  return (
    <label className="block space-y-2">
      <span className="text-label-md font-medium uppercase text-on-surface-variant">
        {t.session.displayName}
      </span>
      <div className="relative">
        <UserRound className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t.session.displayNamePlaceholder}
          className="ps-11"
          maxLength={32}
        />
      </div>
    </label>
  );
}
