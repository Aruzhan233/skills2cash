import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Check,
  ClipboardCheck,
  Compass,
  Flag,
  Hammer,
  MessagesSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { LandingAccountLink } from "@/components/landing-account-link";
import { buttonClass } from "@/components/button-class";
import { Orb, ParticleSphere } from "@/components/orb";
import { JOURNEY } from "@/lib/journey";

const STAGES = [
  { icon: Compass, title: "Discover", text: "Map the skills you already have and pick one realistic service direction." },
  { icon: Hammer, title: "Build", text: "Turn a broad skill into a specific offer with clear deliverables and limits." },
  { icon: BadgeDollarSign, title: "Price", text: "Calculate effort and costs, design packages, and explain your price." },
  { icon: MessagesSquare, title: "Practice", text: "Rehearse sales conversations with realistic AI clients and objections." },
  { icon: Rocket, title: "Launch", text: "Prepare your pitch and outreach, and validate the offer with real people." },
];

const BENEFITS = [
  { icon: Target, title: "Specific, not generic", text: "You leave with one defined service, a target customer, and a priced package." },
  { icon: ClipboardCheck, title: "Evidence, not vibes", text: "Every score is tied to a mission or a quote from your conversation." },
  { icon: BarChart3, title: "Progress you can see", text: "Self-reported skills and demonstrated skills are tracked separately over time." },
  { icon: ShieldCheck, title: "Honest by design", text: "Prices are hypotheses to test. No income promises, no fake market data." },
];

// Sample content below comes from the labelled demo workspace (Alex), not from real users.
const SAMPLE_TIERS = [
  { name: "Starter", price: 110, text: "5 Reels per month, captions" },
  { name: "Studio", price: 200, text: "10 Reels, captions, licensed music, covers", featured: true },
  { name: "Studio Pro", price: 340, text: "16 Reels, music, covers, content plan" },
];

const SAMPLE_SKILLS = [
  { label: "Short-form video editing", value: 80, demonstrated: true },
  { label: "Client communication", value: 75, demonstrated: false },
  { label: "Pricing", value: 25, demonstrated: true },
];

function SampleTag({ children = "Sample · demo data" }: { children?: React.ReactNode }) {
  return <span className="rounded-full border border-line-strong bg-surface-2 px-2 py-0.5 text-xs text-muted">{children}</span>;
}

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* Navigation: a glass bar floating over the sky */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
        <div className="glass-float mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-2xl pl-4 pr-2 sm:pl-5">
          <Logo />
          <nav className="hidden items-center gap-1 text-sm text-ink-2 md:flex" aria-label="Landing">
            <a href="#how" className="rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-2 hover:text-ink">How it works</a>
            <a href="#stages" className="rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-2 hover:text-ink">Learning stages</a>
            <a href="#simulator" className="rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-2 hover:text-ink">AI Client Simulator</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <LandingAccountLink />
            <Link href="/demo" className={buttonClass("primary", "sm")}>Try Demo</Link>
          </div>
        </div>
      </header>

      {/* Hero: a sphere of light rising behind the headline */}
      <section className="relative -mt-[68px] overflow-hidden pt-[68px]">
        <div className="lamp pointer-events-none absolute inset-0" aria-hidden />
        {/* the dome: a planet of light whose rim rises behind the headline */}
        <div
          className="pointer-events-none absolute left-1/2 top-[-124px] w-[calc(min(1180px,150vw)+440px)] -translate-x-1/2 animate-[fade-in_1400ms_ease-out_both] p-[220px] [mask-image:linear-gradient(180deg,#000_50%,transparent_66%)] sm:top-[-136px] xl:top-[-200px] xl:w-[1940px]"
          aria-hidden
        >
          <div className="relative aspect-square w-full">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_34%_22%,rgb(197_167_255/0.2),transparent_34%),radial-gradient(circle_at_50%_0%,rgb(164_92_255/0.5),rgb(90_31_208/0.32)_22%,rgb(50_16_120/0.22)_42%,rgb(8_6_13/0.2)_62%)] [box-shadow:inset_0_2px_0_rgb(236_226_255/0.75),inset_0_24px_60px_rgb(150_63_255/0.5),0_-24px_90px_-10px_rgb(150_63_255/0.55),0_-80px_200px_-40px_rgb(120_43_255/0.45)]" />
          <ParticleSphere className="absolute inset-0" count={3600} />
          </div>
        </div>
        {/* the glow fades into the page instead of stopping at the section edge */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(180deg,transparent,#08060d_85%)]" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-4 pb-[min(34vw,290px)] pt-28 text-center sm:px-6 sm:pt-36 xl:max-w-7xl">
          <h1 className="mx-auto animate-rise text-[2.5rem] font-semibold leading-[1.06] text-ink sm:text-6xl lg:text-[3.6rem] xl:text-[3.9rem]">
            Your skills have value.{" "}
            <span className="text-gradient block pb-1 xl:whitespace-nowrap">Learn how to turn them into income.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-rise text-base leading-relaxed text-ink-2 [animation-delay:120ms] sm:text-lg">
            Discover what you can offer, build a service, master pricing, and practise selling with AI-powered customer simulations.
          </p>
          <div className="mt-9 flex animate-rise flex-col items-center justify-center gap-3 [animation-delay:220ms] sm:flex-row">
            <Link href="/guest-start" className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
              Continue as Guest <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/login" className={buttonClass("secondary", "lg", "w-full sm:w-auto")}>
              Sign In / Create Account
            </Link>
          </div>
          <a href="#how" className="mt-6 inline-flex animate-rise items-center gap-1.5 text-sm text-muted [animation-delay:300ms] hover:text-ink">
            See How It Works <ArrowDown className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </section>

      {/* Product preview: the workspace emerging from the horizon */}
      <section className="relative z-10 mx-auto -mt-[min(16vw,150px)] max-w-6xl px-4 sm:px-6" aria-label="Sample workspace preview">
        <div className="glass relative overflow-hidden rounded-3xl p-2 shadow-glow-lg">
          <div className="pointer-events-none absolute inset-x-12 -top-px h-px bg-[linear-gradient(90deg,transparent,#e4d6ff,transparent)]" aria-hidden />
          <div className="grid gap-2 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="hidden rounded-2xl bg-[rgb(16_10_28/0.7)] p-4 md:block">
              <p className="mb-3 text-xs font-medium text-muted">Your journey</p>
              <ol className="space-y-1">
                {JOURNEY.map((s, i) => {
                  const done = i === 0 || i === 2;
                  const next = i === 1;
                  return (
                    <li key={s.key} className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm ${next ? "bg-violet-tint text-ink ring-1 ring-inset ring-violet/30" : "text-ink-2"}`}>
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                          done ? "bg-[linear-gradient(180deg,#a45cff,#782bff)] text-white shadow-[0_2px_10px_rgb(150_63_255/0.6)]" : next ? "border border-violet text-violet-soft" : "border border-line-strong text-muted"
                        }`}
                      >
                        {done ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : s.number}
                      </span>
                      {s.label}
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_200px]">
              <div className="glass-lit rounded-2xl p-5 sm:p-6">
                <Orb size={170} className="-bottom-16 -right-10 opacity-80" />
                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2">
                    <SampleTag />
                  </div>
                  <p className="mt-4 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
                    <span className="text-violet-soft">Next step:</span> Create three pricing packages
                  </p>
                  <p className="mt-2 max-w-md text-sm text-ink-2">Your demonstrated pricing score is 25/100, so pricing practice comes first.</p>
                  <span className={buttonClass("primary", "md", "mt-5 pointer-events-none")}>
                    Open mission <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                <div className="rounded-2xl bg-[rgb(16_10_28/0.7)] p-4">
                  <p className="text-sm text-muted">Readiness</p>
                  <p className="mt-1 text-3xl font-semibold text-ink">52<span className="text-base text-muted">/100</span></p>
                </div>
                <div className="rounded-2xl bg-[rgb(16_10_28/0.7)] p-4">
                  <p className="text-sm text-muted">Level 2 · Builder</p>
                  <p className="mt-1 text-3xl font-semibold text-spark">275<span className="text-base"> XP</span></p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full w-[85%] rounded-full bg-[linear-gradient(90deg,#d99a3c,#f2be6a)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The problem, and the transformation */}
      <section className="relative mx-auto grid max-w-6xl gap-12 px-4 py-28 sm:px-6 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-3xl font-semibold leading-tight sm:text-[2.6rem]">Being good at something isn&apos;t the same as selling it.</h2>
          <p className="mt-5 text-ink-2">
            Many people can edit video, design, build spreadsheets or plan events — but don&apos;t know what exactly to offer, who would pay,
            how much to charge, or what to say when a client says “someone else is cheaper”.
          </p>
          <p className="mt-3 text-ink-2">
            Skills2Cash is a structured learning journey with practice, feedback and saved progress. It is not a marketplace and it
            doesn&apos;t promise income — it builds the business skills to offer your service with confidence.
          </p>
        </div>
        <figure className="relative">
          <div className="absolute -inset-10 rounded-full bg-violet/15 blur-3xl" aria-hidden />
          <div className="relative space-y-3">
            <div className="glass rounded-2xl p-5 text-ink-2">
              <p className="text-xs text-muted">Before</p>
              <p className="mt-1.5 text-lg">“I know graphic design.”</p>
            </div>
            <div className="flex justify-center" aria-hidden>
              <span className="h-10 w-px bg-[linear-gradient(180deg,rgb(197_167_255/0.1),#c5a7ff)] shadow-[0_0_10px_rgb(150_63_255/0.8)]" />
            </div>
            <div className="glass rounded-2xl border-violet-soft/40 p-5">
              <p className="relative text-xs text-muted">After Skills2Cash</p>
              <p className="relative mt-1.5 text-lg leading-snug text-ink">
                “I create starter brand identity packages for independent coffee shops — logo, palette and 5 social templates in 2 weeks.”
              </p>
            </div>
          </div>
          <figcaption className="sr-only">Example transformation from a broad skill to a specific service</figcaption>
        </figure>
      </section>

      {/* How it works: the six-step path, lit */}
      <section id="how" className="relative scroll-mt-24 py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgb(120_43_255/0.16),transparent_70%)]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold leading-tight sm:text-[2.6rem]">
              How Skills2Cash <span className="text-gradient">works</span>
            </h2>
            <p className="mt-4 text-ink-2">
              One connected journey from “I have a skill” to a priced service you have rehearsed selling. Every step stays open; the app always
              shows the most useful next one.
            </p>
          </div>
          <ol className="relative mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-6">
            <span className="absolute left-0 right-0 top-[22px] hidden h-px bg-[linear-gradient(90deg,#782bff,#c5a7ff_50%,rgb(197_167_255/0.15))] shadow-[0_0_10px_rgb(150_63_255/0.7)] lg:block" aria-hidden />
            {JOURNEY.map((s) => (
              <li key={s.key} className="relative">
                <span className="relative grid h-11 w-11 place-items-center rounded-full border border-violet-soft/40 bg-[radial-gradient(circle_at_35%_30%,#a45cff,#321078)] text-sm font-semibold text-white shadow-[0_6px_20px_-4px_rgb(150_63_255/0.8)]">
                  {s.number}
                </span>
                <h3 className="mt-5 font-semibold text-ink">{s.label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Skill discovery · service creation · pricing */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="studio">
        <h2 id="studio" className="max-w-2xl text-3xl font-semibold leading-tight sm:text-[2.6rem]">
          From a skill to an offer people can say yes to.
        </h2>
        <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:grid-rows-2">
          {/* Service creation: the large cell */}
          <article className="glass glass-hover relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:row-span-2">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet/25 blur-3xl" aria-hidden />
            <div className="relative flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet/30 bg-violet-tint text-violet-soft"><Hammer className="h-5 w-5" aria-hidden /></span>
              <h3 className="text-lg font-semibold">Service creation</h3>
            </div>
            <p className="relative mt-3 max-w-md text-sm leading-relaxed text-muted">
              The Service Builder walks you through who it is for, what they get, why you, and the limits — with AI suggestions on every field.
            </p>
            <div className="relative mt-8 rounded-2xl border border-line-strong bg-[rgb(12_8_24/0.6)] p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted">Service Offer Canvas</p>
                <SampleTag />
              </div>
              <p className="mt-3 font-display text-xl font-semibold leading-snug">Monthly Reels package for local fitness studios</p>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted">For</dt>
                  <dd className="mt-1 text-ink-2">Independent fitness studios and personal trainers in my city</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">They get</dt>
                  <dd className="mt-1 text-ink-2">10 edited Reels per month (15–30 s), captions, licensed music, cover frames</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Price hypothesis</dt>
                  <dd className="mt-1 text-ink">$200 per month (10 Reels)</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Revisions</dt>
                  <dd className="mt-1 text-ink-2">Up to 2 revision rounds per Reel</dd>
                </div>
              </dl>
            </div>
          </article>

          {/* Skill discovery */}
          <article className="glass glass-hover relative overflow-hidden rounded-3xl p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet/30 bg-violet-tint text-violet-soft"><Compass className="h-5 w-5" aria-hidden /></span>
              <h3 className="text-lg font-semibold">Skill discovery</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">A structured assessment, then a Skill Profile that separates what you say from what you have shown.</p>
            <ul className="mt-5 space-y-3">
              {SAMPLE_SKILLS.map((s) => (
                <li key={s.label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-ink-2">{s.label}</span>
                    <span className="text-xs text-muted">{s.demonstrated ? "Demonstrated" : "Self-reported"} · {s.value}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className={s.demonstrated ? "h-full rounded-full bg-[linear-gradient(90deg,#782bff,#c5a7ff)]" : "h-full rounded-full bg-ink-2/40"}
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </article>

          {/* Pricing */}
          <article className="glass glass-hover relative overflow-hidden rounded-3xl p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet/30 bg-violet-tint text-violet-soft"><BadgeDollarSign className="h-5 w-5" aria-hidden /></span>
              <h3 className="text-lg font-semibold">Pricing</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">Cost floor, three packages and a pricing coach. Every price is a hypothesis you test with real people.</p>
            <ul className="mt-5 grid grid-cols-3 gap-2">
              {SAMPLE_TIERS.map((t) => (
                <li key={t.name} className={`rounded-xl p-3 ${t.featured ? "border border-violet/50 bg-violet-tint" : "border border-line bg-[rgb(12_8_24/0.5)]"}`}>
                  <p className="relative text-xs text-muted">{t.name}</p>
                  <p className="relative mt-1 text-xl font-semibold text-ink">${t.price}</p>
                  <p className="relative mt-1 text-xs leading-snug text-muted">{t.text}</p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* Learning stages: a lit path of five stations */}
      <section id="stages" className="relative scroll-mt-24 overflow-hidden py-28">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px] overflow-hidden [mask-image:linear-gradient(180deg,transparent,#000_35%,#000_62%,transparent)]" aria-hidden>
          <div className="horizon top-[340px] w-[max(140%,1100px)]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold leading-tight sm:text-[2.6rem]">Five learning stages</h2>
            <p className="mt-4 text-ink-2">
              Discover → Build → Price → Practice → Launch. Each stage has short lessons, practical missions and clear completion criteria.
            </p>
          </div>
          <ol className="relative mt-16 grid gap-10 md:mt-20 md:grid-cols-5 md:gap-6">
            {/* the path: an arc that grows brighter from Discover to Launch */}
            <svg className="pointer-events-none absolute inset-x-0 top-0 hidden h-[120px] w-full overflow-visible md:block [filter:drop-shadow(0_0_6px_rgb(150_63_255/0.8))]" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="stage-path" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#c5a7ff" stopOpacity="0.25" />
                  <stop offset="0.6" stopColor="#963fff" stopOpacity="0.85" />
                  <stop offset="1" stopColor="#ece2ff" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path d="M 0 110 Q 500 -50 1000 110" fill="none" stroke="url(#stage-path)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="absolute bottom-4 left-[21px] top-4 w-px bg-[linear-gradient(180deg,rgb(197_167_255/0.25),#ece2ff)] shadow-[0_0_8px_rgb(150_63_255/0.8)] md:hidden" aria-hidden />
            {STAGES.map((s, i) => {
              const glow = 0.35 + i * 0.16;
              return (
                <li key={s.title} className="relative flex gap-5 md:block md:text-center" style={{ ["--arc-y" as string]: `${[81, 43, 30, 43, 81][i] - 22}px` }}>
                  <span
                    className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-violet-soft/40 text-white md:mx-auto md:mt-[var(--arc-y)]"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, rgb(196 150 255 / ${glow}), rgb(50 16 120 / 0.95))`,
                      boxShadow: `0 6px 24px -4px rgb(150 63 255 / ${glow})`,
                    }}
                  >
                    <s.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 md:mt-5">
                    <h3 className="text-lg font-semibold">
                      <span className="text-violet-soft">{i + 1}</span> · {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* AI Client Simulator */}
      <section id="simulator" className="relative mx-auto grid max-w-6xl scroll-mt-24 gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold leading-tight sm:text-[2.6rem]">Practise the conversations that usually go wrong.</h2>
          <p className="mt-5 text-ink-2">
            Pick a scenario — price objections, discount requests, last-minute changes, “I’m not sure I need this”. The AI client stays in
            character and pushes back. When you end the session, a separate evaluator scores eight observable skills and quotes your own
            messages as evidence.
          </p>
          <Link href="/demo" className={buttonClass("primary", "lg", "mt-8")}>
            Try a negotiation now <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="relative">
          <div className="absolute -inset-8 rounded-[40%] bg-violet/20 blur-3xl" aria-hidden />
          <div className="glass relative overflow-hidden rounded-3xl" aria-label="Illustrative example conversation">
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(135deg,#963fff,#321078)] text-sm font-semibold text-white">MC</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Maya Chen · potential client</p>
                <p className="text-xs text-muted">Scenario: Another freelancer offered a lower price</p>
              </div>
              <SampleTag>Illustrative example</SampleTag>
            </div>
            <div className="space-y-3 px-5 py-5 text-sm">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-surface-2 px-4 py-2.5 text-ink-2">
                Hi! I need someone to edit 10 Instagram Reels. Your price is $200, but another freelancer offered $80. Why should I choose you?
              </div>
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[linear-gradient(135deg,#8a3dff,#5a1fd0)] px-4 py-2.5 text-white shadow-[0_8px_24px_-10px_rgb(150_63_255/0.8)]">
                Fair question! Can I ask what the $80 quote includes — music, captions, revisions?
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-surface-2 px-4 py-2.5 text-ink-2">Not sure about music. Why does that matter?</div>
              <div className="flex items-center gap-1.5 pl-1 text-muted" aria-hidden>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-soft" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-soft [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-soft [animation-delay:300ms]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
              {[
                ["Discovery", 4],
                ["Pricing", 3],
                ["Objections", 4],
                ["Next step", 2],
              ].map(([l, v]) => (
                <div key={l as string} className="bg-[rgb(14_9_26/0.9)] px-4 py-3">
                  <p className="text-xs text-muted">{l}</p>
                  <p className="mt-0.5 text-lg font-semibold text-ink">
                    {v}
                    <span className="text-sm text-muted">/5</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Weekly missions and progress tracking */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="momentum">
        <div className="max-w-2xl">
          <h2 id="momentum" className="text-3xl font-semibold leading-tight sm:text-[2.6rem]">
            Small weekly wins. <span className="text-gradient">Progress you earn.</span>
          </h2>
          <p className="mt-4 text-ink-2">
            Weekly missions keep you moving with real-world tasks. XP, levels and achievements come only from things you actually completed.
          </p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <article className="glass rounded-3xl p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet/30 bg-violet-tint text-violet-soft"><Flag className="h-5 w-5" aria-hidden /></span>
                <h3 className="text-lg font-semibold">Weekly missions</h3>
              </div>
              <SampleTag />
            </div>
            <ul className="mt-6 divide-y divide-line">
              {[
                ["Analyze three competitors", 50, true],
                ["Test your price with three people", 80, false],
                ["Write your reply to “Can you do it cheaper?”", 30, false],
              ].map(([t, xp, done]) => (
                <li key={t as string} className="flex items-center gap-3 py-3 text-sm">
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${done ? "bg-good/15 text-good" : "border border-line-strong"}`}>
                    {done ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : null}
                  </span>
                  <span className={`min-w-0 flex-1 ${done ? "text-muted line-through decoration-muted/40" : "text-ink"}`}>{t}</span>
                  <span className={`flex items-center gap-1 text-xs font-medium ${done ? "text-spark" : "text-muted"}`}>
                    <Sparkles className="h-3 w-3" aria-hidden /> {xp} XP
                  </span>
                </li>
              ))}
            </ul>
          </article>
          <article className="glass relative overflow-hidden rounded-3xl p-6 sm:p-7">
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-spark/10 blur-3xl" aria-hidden />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-spark/30 bg-spark/10 text-spark"><Trophy className="h-5 w-5" aria-hidden /></span>
                <h3 className="text-lg font-semibold">Progress tracking</h3>
              </div>
              <SampleTag />
            </div>
            <div className="relative mt-6">
              <div className="flex items-baseline justify-between">
                <p className="font-medium">Level 2 · Builder</p>
                <p className="text-sm text-spark">275 XP</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full w-[85%] rounded-full bg-[linear-gradient(90deg,#d99a3c,#f2be6a)] shadow-[0_0_10px_rgb(242_190_106/0.5)]" />
              </div>
              <p className="mt-1.5 text-xs text-muted">25 XP to level 3</p>
            </div>
            <ul className="relative mt-6 grid grid-cols-3 gap-2">
              {["First Mission", "First Service Offer", "First Client Simulation"].map((a) => (
                <li key={a} className="rounded-xl border border-spark/20 bg-spark/[0.06] p-3 text-center">
                  <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-spark/15 text-spark shadow-gold">
                    <Trophy className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="mt-2 text-xs leading-snug text-ink-2">{a}</p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* Close */}
      <section className="relative mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <div className="glass-lit rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-20">
          <Orb size={320} className="-left-24 -top-32 opacity-60" />
          <Orb size={200} className="-bottom-20 -right-12 opacity-70" />
          <h2 className="relative mx-auto max-w-3xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">
            Turn what you know into what you can confidently offer and sell.
          </h2>
          <p className="relative mt-4 text-ink-2">Start with a 4-minute assessment, or explore Alex&apos;s demo profile first.</p>
          <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/onboarding" className={buttonClass("primary", "lg")}>
              Start Assessment <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/demo" className={buttonClass("secondary", "lg")}>
              Try Demo
            </Link>
          </div>
          <ul className="relative mx-auto mt-14 grid max-w-4xl gap-x-10 gap-y-4 border-t border-violet-soft/20 pt-8 text-left text-sm sm:grid-cols-2" aria-label="Principles">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-3">
                <b.icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-soft" aria-hidden />
                <span className="text-ink-2">
                  <span className="font-semibold text-ink">{b.title}.</span> {b.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="relative border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p className="max-w-xl text-xs leading-relaxed">
            Skills2Cash is a learning tool. Scores and AI suggestions can be imperfect, prices are hypotheses to validate, and nothing here
            guarantees income, customers or business success. Business Cup 2.0 · Track 03: Skills.
          </p>
        </div>
      </footer>
    </div>
  );
}
