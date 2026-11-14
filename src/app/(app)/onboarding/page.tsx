"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Pencil, RotateCcw, Trash2, Undo2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardTitle,
  ErrorState,
  Field,
  GeneratedBadge,
  Input,
  Notice,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { GuestPaywall } from "@/components/guest-paywall";
import { callAI, offlineAI, type ApiError } from "@/lib/client/ai";
import { COMPETENCY_LIST } from "@/lib/competencies";
import { newId } from "@/lib/id";
import { cn } from "@/lib/cn";
import {
  AssessmentInputSchema,
  GOALS,
  GOAL_LABEL,
  ServiceDirectionSchema,
  type AssessmentInput,
  type AssessmentResult,
  type ServiceDirection,
} from "@/lib/schemas";
import type { Generator, SkillProfile } from "@/lib/types";

type Draft = Omit<AssessmentInput, "level" | "hoursPerWeek" | "confidence"> & { level: number; hoursPerWeek: string; confidence: number };

const EMPTY: Draft = {
  displayName: "",
  skill: "",
  otherSkills: "",
  level: 3,
  tasksDoneWell: "",
  helpRequests: "",
  experience: "",
  workExample: "",
  confidence: 2,
  interests: "",
  hoursPerWeek: "6",
  preferredIndustries: "",
  goal: "side_income",
  goalNote: "",
  selfRatings: Object.fromEntries(COMPETENCY_LIST.map((c) => [c.key, 2])) as AssessmentInput["selfRatings"],
};

const STEPS = [
  { title: "Your skill", fields: ["displayName", "skill", "otherSkills", "level"] },
  { title: "Experience & evidence", fields: ["tasksDoneWell", "helpRequests", "experience", "workExample"] },
  { title: "Time, customers & goals", fields: ["hoursPerWeek", "preferredIndustries", "interests", "goal", "goalNote", "confidence"] },
  { title: "Rate yourself", fields: ["selfRatings"] },
] as const;

const LEVELS = ["Beginner", "Basic", "Competent", "Strong", "Expert"];

function Scale({ value, onChange, id, labels }: { value: number; onChange: (n: number) => void; id: string; labels?: string[] }) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-labelledby={id}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          title={labels?.[n - 1]}
          onClick={() => onChange(n)}
          className={cn(
            "h-9 min-w-9 flex-1 rounded-lg border text-sm font-medium transition-colors",
            value === n ? "border-violet bg-violet text-white" : "border-line-strong bg-surface-2 text-ink-2 hover:border-violet/50",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function toInput(d: Draft): unknown {
  return { ...d, hoursPerWeek: Number(d.hoursPerWeek) };
}

export default function OnboardingPage() {
  const ws = useWorkspace();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() =>
    ws.state.profile ? { ...ws.state.profile.assessment, hoursPerWeek: String(ws.state.profile.assessment.hoursPerWeek) } : EMPTY,
  );
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"form" | "loading" | "review">("form");
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [generatedBy, setGeneratedBy] = useState<Generator>("ai");
  const [notice, setNotice] = useState<string | null>(null);
  const [dirIndex, setDirIndex] = useState(0);
  const [direction, setDirection] = useState<ServiceDirection | null>(null);
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  function validateStep(i: number): boolean {
    const parsed = AssessmentInputSchema.safeParse(toInput(draft));
    if (parsed.success) {
      setErrors({});
      return true;
    }
    const fields = STEPS[i].fields as readonly string[];
    const errs: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const f = String(issue.path[0]);
      if (fields.includes(f) && !errs[f]) {
        errs[f] =
          issue.code === "too_small" && issue.type === "string"
            ? `Please write at least ${issue.minimum} characters.`
            : issue.message;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function accept(data: AssessmentResult, by: Generator, msg?: string) {
    setResult(data);
    setGeneratedBy(by);
    setNotice(msg ?? null);
    setDirIndex(0);
    setDirection(data.service_directions[0]);
    setEdited(false);
    setEditing(false);
    setRejected([]);
    setPhase("review");
  }

  async function analyse() {
    const parsed = AssessmentInputSchema.safeParse(toInput(draft));
    if (!parsed.success) return;
    setPhase("loading");
    setApiError(null);
    try {
      const r = await callAI("assess", parsed.data, ws.aiOpts);
      accept(r.data, r.generatedBy, r.notice);
    } catch (e) {
      setApiError(e as ApiError);
      setPhase("form");
    }
  }

  function useOffline() {
    const parsed = AssessmentInputSchema.safeParse(toInput(draft));
    if (!parsed.success) return;
    const r = offlineAI("assess", parsed.data);
    setApiError(null);
    accept(r.data, "sample", r.notice);
  }

  async function save() {
    if (!result || !direction) return;
    const dirCheck = ServiceDirectionSchema.safeParse(direction);
    if (!dirCheck.success) {
      setSaveError("Please complete the service direction: name, customer, problem, why it fits and at least one assumption.");
      return;
    }
    const input = AssessmentInputSchema.parse(toInput(draft));
    const now = new Date().toISOString();
    const profile: SkillProfile = {
      id: ws.state.profile?.id ?? newId(),
      displayName: input.displayName,
      assessment: input,
      result,
      direction: dirCheck.data,
      directionEdited: edited,
      rejectedStrengths: rejected,
      generatedBy,
      createdAt: ws.state.profile?.createdAt ?? now,
      updatedAt: now,
    };
    setSaving(true);
    setSaveError(null);
    try {
      await ws.saveProfile(profile);
      router.push("/profile/skills");
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (phase === "loading") {
    return (
      <Card className="mx-auto max-w-xl py-14 text-center">
        <div className="flex justify-center">
          <Spinner label="Analysing your answers and building your Skill Profile…" />
        </div>
        <p className="mt-3 text-xs text-muted">This usually takes 5–15 seconds.</p>
      </Card>
    );
  }

  if (phase === "review" && result && direction) {
    const dir = direction;
    const setDir = (patch: Partial<ServiceDirection>) => {
      setDirection({ ...dir, ...patch });
      setEdited(true);
    };
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow={<GeneratedBadge by={generatedBy} />}
          title={`Your Skill Profile, ${draft.displayName.split(" ")[0]}`}
          sub="Review the suggestions. You can remove strengths you disagree with, pick or edit the service direction, or write your own."
        />
        {notice && <Notice tone="warn" className="mb-4">{notice}</Notice>}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardTitle>Summary</CardTitle>
            <p className="text-sm text-ink-2">{result.summary}</p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted">Facts you told us</p>
            <ul className="mt-2 grid gap-1 text-sm text-ink-2 sm:grid-cols-2">
              {result.facts_from_user.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-good" aria-hidden /> {f}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle sub="Level 1–5 and where it comes from">Identified skills</CardTitle>
            <ul className="space-y-3">
              {result.identified_skills.map((s) => (
                <li key={s.name} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    <Badge tone="violet">Level {s.level}/5</Badge>
                    <Badge>{s.basis === "from-example" ? "Supported by your example" : "Self-reported"}</Badge>
                    {s.commercial && <Badge tone="good">Commercially applicable</Badge>}
                  </div>
                  <p className="mt-1 text-muted">{s.note}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle sub="Remove any you disagree with">Strengths</CardTitle>
            <ul className="space-y-2">
              {result.strengths.map((s) => {
                const off = rejected.includes(s);
                return (
                  <li key={s} className="flex items-center justify-between gap-2 text-sm">
                    <span className={cn(off && "text-muted line-through")}>{s}</span>
                    <button
                      className="rounded p-1 text-muted hover:bg-surface-3 hover:text-ink"
                      onClick={() => setRejected((r) => (off ? r.filter((x) => x !== s) : [...r, s]))}
                      aria-label={off ? `Restore ${s}` : `Remove ${s}`}
                    >
                      {off ? <Undo2 className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted">Gaps to work on</p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
              {result.gaps.map((g) => (
                <li key={g.competency + g.note}>
                  <span className="font-medium text-ink">{COMPETENCY_LIST.find((c) => c.key === g.competency)?.label}:</span> {g.note}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="md:col-span-2">
            <CardTitle
              sub="One concrete direction to focus your learning path on"
              right={
                <div className="flex gap-2">
                  {!editing && (
                    <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDirection({
                        name: "",
                        target_customer: "",
                        problem_solved: "",
                        why_it_may_fit: "My own choice.",
                        assumptions_to_validate: [""],
                        price_hypothesis: dir.price_hypothesis,
                      });
                      setEdited(true);
                      setEditing(true);
                    }}
                  >
                    Reject & write my own
                  </Button>
                </div>
              }
            >
              Recommended service direction
            </CardTitle>
            {result.service_directions.length > 1 && !editing && (
              <div className="mb-4 flex flex-wrap gap-2">
                {result.service_directions.map((d, i) => (
                  <button
                    key={d.name}
                    onClick={() => {
                      setDirIndex(i);
                      setDirection(d);
                      setEdited(false);
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs",
                      i === dirIndex ? "border-violet bg-violet-tint text-violet-soft" : "border-line-strong text-muted hover:text-ink",
                    )}
                  >
                    Option {i + 1}
                  </button>
                ))}
              </div>
            )}
            {editing ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Service" htmlFor="d-name" className="sm:col-span-2">
                  <Input id="d-name" value={dir.name} onChange={(e) => setDir({ name: e.target.value })} />
                </Field>
                <Field label="Target customer" htmlFor="d-cust">
                  <Input id="d-cust" value={dir.target_customer} onChange={(e) => setDir({ target_customer: e.target.value })} />
                </Field>
                <Field label="Problem solved" htmlFor="d-prob">
                  <Input id="d-prob" value={dir.problem_solved} onChange={(e) => setDir({ problem_solved: e.target.value })} />
                </Field>
                <Field label="Assumptions to validate (one per line)" htmlFor="d-ass" className="sm:col-span-2">
                  <Textarea
                    id="d-ass"
                    value={dir.assumptions_to_validate.join("\n")}
                    onChange={(e) => setDir({ assumptions_to_validate: e.target.value.split("\n").slice(0, 5) })}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setDir({ assumptions_to_validate: dir.assumptions_to_validate.map((a) => a.trim()).filter(Boolean) });
                      setEditing(false);
                    }}
                  >
                    Done editing
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-lg font-semibold text-ink">{dir.name}</p>
                  {edited && <Badge className="mt-1">Edited by you</Badge>}
                </div>
                <div>
                  <p className="text-xs text-muted">Target customer</p>
                  <p className="text-sm">{dir.target_customer}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Problem solved</p>
                  <p className="text-sm">{dir.problem_solved}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Why it may fit you</p>
                  <p className="text-sm">{dir.why_it_may_fit}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Price hypothesis (estimate, not market data)</p>
                  <p className="text-sm">
                    ${dir.price_hypothesis.low}–${dir.price_hypothesis.high} {dir.price_hypothesis.unit}
                  </p>
                  <p className="text-xs text-muted">{dir.price_hypothesis.basis}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted">Assumptions about customers and demand you still need to check</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-warn">
                    {dir.assumptions_to_validate.map((a) => (
                      <li key={a}>
                        <span className="text-ink-2">{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>
          <Card className="md:col-span-2">
            <CardTitle>Recommended next steps</CardTitle>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-2">
              {result.recommended_next_steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </Card>
        </div>
        {saveError && (
          <div className="mt-4">
            <ErrorState title="Could not save" message={saveError} onRetry={save} />
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setPhase("form")}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Edit answers
            </Button>
            <Button variant="secondary" onClick={analyse}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Regenerate
            </Button>
          </div>
          <Button onClick={save} loading={saving} disabled={editing}>
            Save profile & continue <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    );
  }

  const s = STEPS[step];
  if (ws.guest && ws.guestUsage.assessments_used >= 1 && ws.state.profile) {
    return <GuestPaywall feature="Another skill assessment" />;
  }
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Skill assessment"
        sub="Structured questions about what you can do, your evidence and your constraints. We only use what you write — the AI won't invent experience."
      />
      {ws.mode === "demo" && (
        <Notice tone="warn" className="mb-4">
          You are in demo mode. Saving this assessment will replace Alex&apos;s demo profile in your demo workspace (only in this browser).
        </Notice>
      )}
      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Progress">
        {STEPS.map((st, i) => (
          <li key={st.title}>
            <div className={cn("h-1.5 rounded-full", i <= step ? "bg-violet" : "bg-surface-3")} />
            <p className={cn("mt-1.5 hidden text-xs sm:block", i === step ? "text-ink" : "text-muted")}>{st.title}</p>
          </li>
        ))}
      </ol>
      <Card className="p-6">
        <h2 className="mb-5 text-lg font-semibold">
          Step {step + 1} of {STEPS.length}: {s.title}
        </h2>
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Your first name (or a nickname)" htmlFor="name" error={errors.displayName}>
              <Input id="name" value={draft.displayName} onChange={(e) => set("displayName", e.target.value)} autoComplete="given-name" />
            </Field>
            <Field label="Which skill do you want to turn into a service?" htmlFor="skill" error={errors.skill} hint="E.g. video editing, Excel reporting, event planning, copywriting.">
              <Input id="skill" value={draft.skill} onChange={(e) => set("skill", e.target.value)} />
            </Field>
            <Field label="Other skills you have (optional)" htmlFor="other" error={errors.otherSkills}>
              <Input id="other" value={draft.otherSkills} onChange={(e) => set("otherSkills", e.target.value)} placeholder="Comma-separated" />
            </Field>
            <div>
              <p id="lvl" className="mb-1.5 text-sm font-medium text-ink-2">
                Your level in this skill: <span className="text-ink">{LEVELS[draft.level - 1]}</span>
              </p>
              <Scale id="lvl" value={draft.level} onChange={(n) => set("level", n)} labels={LEVELS} />
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <Field label="What tasks do you do well with this skill?" htmlFor="tasks" error={errors.tasksDoneWell}>
              <Textarea id="tasks" value={draft.tasksDoneWell} onChange={(e) => set("tasksDoneWell", e.target.value)} />
            </Field>
            <Field label="What do people already ask you to help with? (optional)" htmlFor="help" error={errors.helpRequests}>
              <Textarea id="help" rows={2} value={draft.helpRequests} onChange={(e) => set("helpRequests", e.target.value)} />
            </Field>
            <Field label="Your experience" htmlFor="exp" error={errors.experience} hint="Years, jobs, personal or volunteer projects — paid or not.">
              <Textarea id="exp" rows={2} value={draft.experience} onChange={(e) => set("experience", e.target.value)} />
            </Field>
            <Field label="Describe one example of your work or a project" htmlFor="example" error={errors.workExample} hint="What was the situation, what did you do, what happened? At least 20 characters.">
              <Textarea id="example" rows={4} value={draft.workExample} onChange={(e) => set("workExample", e.target.value)} />
            </Field>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <Field label="Hours per week you can spend on this" htmlFor="hours" error={errors.hoursPerWeek}>
              <Input id="hours" type="number" min={1} max={60} value={draft.hoursPerWeek} onChange={(e) => set("hoursPerWeek", e.target.value)} />
            </Field>
            <Field label="Preferred industries or types of customers (optional)" htmlFor="ind" error={errors.preferredIndustries}>
              <Input id="ind" value={draft.preferredIndustries} onChange={(e) => set("preferredIndustries", e.target.value)} placeholder="E.g. local gyms, real-estate agents, small nonprofits" />
            </Field>
            <Field label="Interests (optional)" htmlFor="int" error={errors.interests}>
              <Input id="int" value={draft.interests} onChange={(e) => set("interests", e.target.value)} />
            </Field>
            <Field label="Your monetization goal" htmlFor="goal" error={errors.goal}>
              <Select id="goal" value={draft.goal} onChange={(e) => set("goal", e.target.value as Draft["goal"])}>
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {GOAL_LABEL[g]}
                  </option>
                ))}
              </Select>
            </Field>
            {draft.goal === "other" && (
              <Field label="Tell us more (optional)" htmlFor="gn" error={errors.goalNote}>
                <Input id="gn" value={draft.goalNote} onChange={(e) => set("goalNote", e.target.value)} />
              </Field>
            )}
            <div>
              <p id="conf" className="mb-1.5 text-sm font-medium text-ink-2">How confident are you about selling this skill? (1 = not at all, 5 = very)</p>
              <Scale id="conf" value={draft.confidence} onChange={(n) => set("confidence", n)} />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <Notice tone="neutral">
              These ratings are shown as <strong>self-reported</strong> on your profile. They are replaced by demonstrated scores as you complete
              missions and simulations. 1 = never done it, 5 = I do this confidently.
            </Notice>
            {COMPETENCY_LIST.map((c) => (
              <div key={c.key}>
                <p id={`r-${c.key}`} className="text-sm font-medium text-ink-2">
                  {c.label}
                </p>
                <p className="mb-1.5 text-xs text-muted">{c.description}</p>
                <Scale
                  id={`r-${c.key}`}
                  value={draft.selfRatings[c.key]}
                  onChange={(n) => set("selfRatings", { ...draft.selfRatings, [c.key]: n })}
                />
              </div>
            ))}
          </div>
        )}
        {apiError && (
          <div className="mt-5">
            <ErrorState title="The assessment could not be generated" message={apiError.message} onRetry={analyse}>
              <Button size="sm" variant="ghost" onClick={useOffline}>
                Use offline sample profile (labelled, not AI)
              </Button>
            </ErrorState>
          </div>
        )}
        <div className="mt-6 flex justify-between gap-2">
          <Button variant="ghost" onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => validateStep(step) && setStep(step + 1)}>
              Next <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button
              onClick={() => {
                for (let i = 0; i < STEPS.length; i++) {
                  if (!validateStep(i)) {
                    setStep(i);
                    return;
                  }
                }
                analyse();
              }}
            >
              Build my Skill Profile <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
