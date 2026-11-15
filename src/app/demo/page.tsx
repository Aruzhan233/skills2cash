"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart3, FlaskConical, MessagesSquare, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button, Card, Notice } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";

const WALKTHROUGH = [
  "Open Alex's Skill Profile — skills tracker, radar chart, achievements.",
  "Check the Learning Path: the next recommended step is chosen from Alex's weakest scores.",
  "Open the Service Builder and Pricing Builder — Alex's offer and packages are pre-filled.",
  "Start “Another freelancer offered a lower price” and negotiate with the AI client.",
  "Press End Session: a separate evaluator scores 8 criteria with quotes from your messages.",
  "See the result on the Readiness dashboard and in the simulation history.",
];

export default function DemoPage() {
  const ws = useWorkspace();
  const router = useRouter();
  const [scripted, setScripted] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function go(target: string, key: string) {
    setBusy(key);
    await ws.startDemo({ scripted });
    router.push(target);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="sky" aria-hidden />
      <div className="lamp pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] overflow-hidden [mask-image:linear-gradient(180deg,#000_55%,transparent)]" aria-hidden>
        <div className="horizon top-[330px] w-[max(150%,1100px)]" />
      </div>
      <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Logo />
        <div className="mt-10">
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Meet <span className="text-gradient">Alex.</span>
          </h1>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-warn/30 bg-warn/10 px-3 py-1 text-xs font-semibold text-warn">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Demo — no sign-up required
          </p>
          <p className="mt-3 max-w-2xl text-ink-2">
            Alex can edit short-form videos but has never sold this as a service. Alex&apos;s assessment, offer, three missions and one
            practice conversation are pre-written sample data so you can explore quickly. Everything you do next — new simulations, missions,
            edits — runs for real and is saved only in this browser, isolated from other visitors.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { key: "profile", icon: UserRound, title: "Open Alex's profile", text: "Skill tracker, radar chart and achievements.", href: "/profile/skills" },
            { key: "practice", icon: MessagesSquare, title: "Try the negotiation", text: "A client says another freelancer is cheaper.", href: "/practice/cheaper-freelancer" },
            { key: "result", icon: BarChart3, title: "See a scored result", text: "Rubric scores, quotes and the next exercise.", href: "/practice#history" },
          ].map((c) => (
            <Card key={c.key} className={c.key === "practice" ? "glass-lit flex flex-col" : "glass-hover flex flex-col"}>
              <c.icon className={c.key === "practice" ? "relative h-6 w-6 text-white" : "h-6 w-6 text-violet-soft"} aria-hidden />
              <h2 className="relative mt-3 font-semibold">{c.title}</h2>
              <p className="relative mt-1 flex-1 text-sm text-muted">{c.text}</p>
              <Button
                variant={c.key === "practice" ? "primary" : "secondary"}
                className="relative mt-4"
                loading={busy === c.key}
                disabled={busy !== null}
                onClick={() => go(c.href, c.key)}
              >
                Open
              </Button>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 accent-violet" checked={scripted} onChange={(e) => setScripted(e.target.checked)} />
            <span>
              <span className="font-medium">Scripted mode (no AI)</span>
              <span className="block text-sm text-muted">
                Use pre-written client replies and a keyword-based sample evaluation, clearly labelled “Offline sample — not AI”. Use this if
                the AI or network is unavailable. In normal demo mode, the app also falls back to this automatically if an AI call fails.
              </span>
            </span>
          </label>
        </Card>

        <Card className="mt-6">
          <h2 className="font-semibold">2-minute judge walkthrough</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink-2">
            {WALKTHROUGH.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ol>
        </Card>

        <Notice tone="neutral" className="mt-6">
          Want your own profile instead? Go back to the{" "}
          <button
            className="text-violet-soft underline-offset-2 hover:underline"
            onClick={() => {
              ws.exitDemo();
              router.push("/onboarding");
            }}
          >
            skill assessment
          </button>
          .
        </Notice>
      </div>
    </div>
  );
}
