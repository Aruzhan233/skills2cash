"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/workspace";
import { PageLoader } from "@/components/ui";

export default function GuestStartPage() {
  const ws = useWorkspace();
  const router = useRouter();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    ws.beginGuest();
    router.replace("/onboarding");
  }, [router, ws]);
  return <PageLoader label="Starting your guest workspace…" />;
}
