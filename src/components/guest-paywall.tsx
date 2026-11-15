"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import { useWorkspace } from "./workspace";
import { Card, LinkButton, PageHeader } from "./ui";

export function GuestPaywall({ feature, children }: { feature: string; children?: ReactNode }) {
  const ws = useWorkspace();
  if (!ws.guest) return children;
  return (
    <div>
      <PageHeader title="Free plan limit reached" sub="You've reached your free plan limit." />
      <Card className="mx-auto max-w-xl text-center">
        <LockKeyhole className="mx-auto h-8 w-8 text-violet-soft" aria-hidden />
        <h2 className="mt-3 text-xl font-semibold">{feature} is part of Skills2Cash Pro</h2>
        <p className="mt-2 text-sm text-ink-2">Upgrade for all 7 scenarios, all missions, Full Readiness, extended recommendations and full product access.</p>
        <p className="mt-4 text-2xl font-semibold text-ink">Skills2Cash Pro — $19/month</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <LinkButton href="/subscription">Upgrade to Pro</LinkButton>
          <LinkButton href="/dashboard" variant="secondary">Back to Dashboard</LinkButton>
          <Link href="/subscription" className="self-center text-sm text-violet-soft underline">Compare plans</Link>
        </div>
        <p className="mt-3 text-xs text-muted">Create an account to start secure Stripe Checkout. Your guest progress remains saved here.</p>
      </Card>
    </div>
  );
}
