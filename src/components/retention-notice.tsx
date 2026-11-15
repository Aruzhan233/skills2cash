"use client";

import { HardDrive } from "lucide-react";
import { useWorkspace } from "./workspace";

/** Honest label when weekly missions and XP cannot be stored in the account's database yet. */
export function RetentionStorageNotice() {
  const ws = useWorkspace();
  if (ws.storage !== "supabase" || ws.retentionStorage !== "browser") return null;
  return (
    <p className="mb-4 flex items-start gap-2 rounded-xl border border-warn/25 bg-warn/[0.07] px-4 py-3 text-xs text-ink-2">
      <HardDrive className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" aria-hidden />
      Weekly missions and XP are being saved in this browser only, because the database tables for them are not available yet. Apply the
      migrations supabase/migrations/20261115000000_retention.sql and 20261115000100_retention_integrity.sql to sync them with your
      account. Progress saved here moves to your account automatically once they are applied.
    </p>
  );
}
