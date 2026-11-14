import { cn } from "@/lib/cn";

export type Variant = "primary" | "secondary" | "ghost" | "danger";
export type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-violet text-white hover:bg-violet-strong shadow-[0_0_0_1px_#a78bfa33_inset]",
  secondary: "bg-surface-3 text-ink border border-line-strong hover:border-violet/60 hover:bg-surface-2",
  ghost: "text-ink-2 hover:text-ink hover:bg-surface-3",
  danger: "bg-bad/10 text-bad border border-bad/30 hover:bg-bad/20",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
    variants[variant],
    sizes[size],
    extra,
  );
}

