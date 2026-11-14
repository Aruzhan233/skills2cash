"use client";

import type { ReactNode } from "react";
import { ClipboardList } from "lucide-react";
import { useWorkspace } from "./workspace";
import { EmptyState, LinkButton } from "./ui";

/** Shows a call to action instead of the page until the assessment exists. */
export function RequireProfile({ children, what }: { children: ReactNode; what: string }) {
  const { state } = useWorkspace();
  if (!state.profile) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-8 w-8" />}
        title="Start with your skill assessment"
        text={`${what} is personalised from your assessment. It takes about 4 minutes.`}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <LinkButton href="/onboarding">Start assessment</LinkButton>
            <LinkButton href="/demo" variant="secondary">
              Try the demo
            </LinkButton>
          </div>
        }
      />
    );
  }
  return <>{children}</>;
}
