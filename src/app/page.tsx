import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Bot,
  ClipboardCheck,
  Compass,
  Hammer,
  MessagesSquare,
  Rocket,
  ShieldCheck,
  Target,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonClass } from "@/components/button-class";

const STAGES = [
  { icon: Compass, title: "Discover", text: "Map the skills you already have and pick one realistic service direction." },
  { icon: Hammer, title: "Build", text: "Turn a broad skill into a specific offer with clear deliverables and limits." },
  { icon: BadgeDollarSign, title: "Price", text: "Calculate effort and costs, design packages, and explain your price." },
  { icon: MessagesSquare, title: "Practice", text: "Rehearse sales conversations with realistic AI clients and objections." },
  { icon: Rocket, title: "Launch", text: "Prepare your pitch and outreach, and validate the offer with real people." },
];

const STEPS = [
  { n: "01", title: "Take the skill assessment", text: "Structured questions about your skill, evidence, time and goals — not a blank chat box." },
  { n: "02", title: "Get your Skill Profile", text: "Strengths, gaps and one concrete service direction, with assumptions you still need to test." },
  { n: "03", title: "Build and price your offer", text: "Service Builder and Pricing Builder turn the direction into an offer you can explain." },
  { n: "04", title: "Practise and get scored", text: "AI clients push back. A separate evaluator scores your replies against a consistent rubric." },
];

const BENEFITS = [
  { icon: Target, title: "Specific, not generic", text: "You leave with one defined service, a target customer, and a priced package." },
  { icon: ClipboardCheck, title: "Evidence, not vibes", text: "Every score is tied to a mission or a quote from your conversation." },
  { icon: BarChart3, title: "Progress you can see", text: "Self-reported skills and demonstrated skills are tracked separately over time." },
  { icon: ShieldCheck, title: "Honest by design", text: "Prices are hypotheses to test. No income promises, no fake market data." },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Landing">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#stages" className="hover:text-ink">Learning stages</a>
            <a href="#simulator" className="hover:text-ink">AI Client Simulator</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonClass("ghost", "sm")}>Log in</Link>
            <Link href="/demo" className={buttonClass("secondary", "sm")}>Try Demo</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-grid">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-violet/30 bg-violet-tint px-3 py-1 text-xs font-medium text-violet-soft">
            For US adults who want to turn a skill into a service
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-6xl">
            Your skills have value. <span className="text-violet-soft">Learn how to turn them into income.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-ink-2 sm:text-lg">
            Discover what you can offer, build a service, master pricing, and practise selling with AI-powered customer simulations.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
<<<<<<< HEAD
            <Link href="/onboarding" className={buttonClass("primary", "lg")}>
              Discover My Skills <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/demo" className={buttonClass("secondary", "lg")}>
              Try Demo — no sign-up
=======
            <Link href="/guest-start" className={buttonClass("primary", "lg")}>
              Continue as Guest <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/login" className={buttonClass("secondary", "lg")}>
              Sign In / Create Account
>>>>>>> 12acf10 (feat: implement guest mode and pricing paywall)
            </Link>
          </div>
          <a href="#how" className="mt-5 inline-block text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
            See How It Works ↓
          </a>
        </div>
      </section>

      {/* Value proposition */}
      <section className="border-y border-line bg-surface/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Being good at something isn&apos;t the same as selling it.</h2>
            <p className="mt-4 text-ink-2">
              Many people can edit video, design, build spreadsheets or plan events — but don&apos;t know what exactly to offer, who would pay,
              how much to charge, or what to say when a client says “someone else is cheaper”.
            </p>
            <p className="mt-3 text-ink-2">
              Skills2Cash is a structured learning journey with practice, feedback and saved progress. It is not a marketplace and it
              doesn&apos;t promise income — it builds the business skills to offer your service with confidence.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Example transformation</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-line-strong bg-surface-2 p-4 text-sm text-ink-2">“I know graphic design.”</div>
              <div className="flex justify-center text-violet-soft">
                <ArrowRight className="h-5 w-5 rotate-90" aria-hidden />
              </div>
              <div className="rounded-xl border border-violet/40 bg-violet-tint p-4 text-sm text-ink">
                “I create starter brand identity packages for independent coffee shops — logo, palette and 5 social templates in 2 weeks.”
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">How Skills2Cash works</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-surface p-5">
              <p className="font-mono text-sm text-violet-soft">{s.n}</p>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stages */}
      <section id="stages" className="scroll-mt-20 border-y border-line bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Five learning stages</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted">Discover → Build → Price → Practice → Launch. Each stage has short lessons, practical missions and clear completion criteria.</p>
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {STAGES.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl border border-line bg-surface p-5">
                <s.icon className="h-6 w-6 text-violet-soft" aria-hidden />
                <p className="mt-4 text-xs text-muted">Stage {i + 1}</p>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Simulator preview */}
      <section id="simulator" className="mx-auto grid max-w-6xl scroll-mt-20 gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-violet-soft">
            <Bot className="h-4 w-4" aria-hidden /> AI Client Simulator
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Practise the conversations that usually go wrong.</h2>
          <p className="mt-4 text-ink-2">
            Pick a scenario — price objections, discount requests, last-minute changes, “I’m not sure I need this”. The AI client stays in
            character and pushes back. When you end the session, a separate evaluator scores eight observable skills and quotes your own
            messages as evidence.
          </p>
          <Link href="/demo" className={buttonClass("primary", "md", "mt-6")}>
            Try a negotiation now <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4" aria-label="Illustrative example conversation">
          <p className="mb-3 text-xs text-muted">Illustrative example — the live simulator responds to what you write.</p>
          <div className="space-y-3 text-sm">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface-3 px-4 py-2.5 text-ink-2">
              Hi! I need someone to edit 10 Instagram Reels. Your price is $200, but another freelancer offered $80. Why should I choose you?
            </div>
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-violet/90 px-4 py-2.5 text-white">
              Fair question! Can I ask what the $80 quote includes — music, captions, revisions?
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface-3 px-4 py-2.5 text-ink-2">Not sure about music. Why does that matter?</div>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {[
                ["Discovery", 4],
                ["Pricing", 3],
                ["Objections", 4],
                ["Next step", 2],
              ].map(([l, v]) => (
                <div key={l as string} className="rounded-lg border border-line bg-surface-2 p-2 text-center">
                  <p className="text-[11px] text-muted">{l}</p>
                  <p className="text-sm font-semibold text-violet-soft">{v}/5</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-line bg-surface/50">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-20 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-line bg-surface p-5">
              <b.icon className="h-5 w-5 text-violet-soft" aria-hidden />
              <h3 className="mt-3 font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight">Turn what you know into what you can confidently offer and sell.</h2>
        <p className="mt-3 text-muted">Start with a 4-minute assessment, or explore Alex&apos;s demo profile first.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/onboarding" className={buttonClass("primary", "lg")}>
            Start Assessment
          </Link>
          <Link href="/demo" className={buttonClass("secondary", "lg")}>
            Try Demo
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p className="max-w-xl text-xs">
            Skills2Cash is a learning tool. Scores and AI suggestions can be imperfect, prices are hypotheses to validate, and nothing here
            guarantees income, customers or business success. Business Cup 2.0 · Track 03: Skills.
          </p>
        </div>
      </footer>
    </div>
  );
}
