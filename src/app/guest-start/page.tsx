"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/workspace";
import { PageLoader } from "@/components/ui";

export default function GuestStartPage() {
  const ws = useWorkspace();
  const router = useRouter();
  const started = useRef(false);
  const authStatus = ws.auth.status;
  useEffect(() => {
    if (started.current || authStatus === "loading") return;
    started.current = true;
    // Already signed in: the account is the workspace; Guest Mode would be replaced immediately.
    if (authStatus === "signed_in") {
      router.replace("/dashboard");
      return;
    }
    ws.beginGuest();
    router.replace("/onboarding");
  }, [router, ws, authStatus]);
  return <PageLoader label={authStatus === "signed_in" ? "You are signed in. Opening your workspace…" : "Starting your guest workspace…"} />;
}
