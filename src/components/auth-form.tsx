"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Logo } from "./logo";
import { Button, Card, ErrorState, Field, Input, LinkButton, Notice, PageLoader } from "./ui";
import { useWorkspace } from "./workspace";
import { getSupabase, supabaseConfigured } from "@/lib/client/supabase";

const CredentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export function AuthForm({ kind }: { kind: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  // Only same-site paths: "//host" would leave the app.
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const ws = useWorkspace();
  const signedIn = ws.auth.status === "signed_in";

  // A valid session already exists: go to the destination instead of asking to log in again.
  useEffect(() => {
    if (signedIn) router.replace(destination);
  }, [signedIn, destination, router]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = CredentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({ email: f.email?.[0], password: f.password?.[0] });
      return;
    }
    setErrors({});
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    try {
      if (kind === "signup") {
        const { data, error: err } = await sb.auth.signUp(parsed.data);
        if (err) throw err;
        if (!data.session) {
          setInfo("Check your inbox to confirm your email, then log in.");
          return;
        }
      } else {
        const { error: err } = await sb.auth.signInWithPassword(parsed.data);
        if (err) throw err;
      }
      if (ws.mode === "demo") ws.exitDemo();
      router.push(destination);
    } catch (err) {
      setError((err as Error).message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  if (signedIn) return <PageLoader label="You are already signed in. Opening your workspace…" />;

  const title = kind === "login" ? "Log in to Skills2Cash" : "Create your account";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="sky" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-[18%] aspect-square w-[min(900px,140vw)] -translate-x-1/2 rounded-full [box-shadow:inset_0_2px_0_rgb(236_226_255/0.6),inset_0_24px_60px_rgb(150_63_255/0.4),0_-24px_90px_-10px_rgb(150_63_255/0.5)] [mask-image:linear-gradient(180deg,#000_30%,transparent_60%)]" aria-hidden />
      <div className="relative mb-8">
        <Logo size={40} />
      </div>
      <Card className="relative w-full max-w-md p-6 shadow-glow-lg sm:p-8">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted">
          {kind === "login" ? "Your profile, missions and simulations are saved to your account." : "Free to start. Your progress is private to you."}
        </p>
        {!supabaseConfigured ? (
          <div className="mt-6 space-y-4">
            <Notice tone="warn">
              Accounts are not configured on this deployment (Supabase environment variables are missing). You can still use the full app in
              local mode — progress is saved in this browser — or open the demo.
            </Notice>
            <div className="flex flex-wrap gap-2">
              <LinkButton href="/onboarding">Continue in local mode</LinkButton>
              <LinkButton href="/demo" variant="secondary">
                Open demo
              </LinkButton>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Field label="Email" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password}>
              <Input
                id="password"
                type="password"
                autoComplete={kind === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && <ErrorState title={kind === "login" ? "Could not log in" : "Could not sign up"} message={error} />}
            {info && <Notice tone="good">{info}</Notice>}
            <Button type="submit" className="w-full" loading={busy}>
              {kind === "login" ? "Log in" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted">
              {kind === "login" ? (
                <>
                  New here?{" "}
                  <Link className="text-violet-soft hover:underline" href={`/signup?next=${encodeURIComponent(next)}`}>
                    Create an account
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link className="text-violet-soft hover:underline" href={`/login?next=${encodeURIComponent(next)}`}>
                    Log in
                  </Link>
                </>
              )}
            </p>
          </form>
        )}
        <div className="mt-6 border-t border-line pt-4 text-center text-sm text-muted">
          Judging?{" "}
          <Link href="/demo" className="text-violet-soft hover:underline">
            Try the demo without signing up
          </Link>
        </div>
      </Card>
    </div>
  );
}
