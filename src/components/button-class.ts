import { cn } from "@/lib/cn";

export type Variant = "primary" | "secondary" | "ghost" | "danger";
export type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  // Lit: electric-to-violet fill with a top highlight; white label stays above 4.5:1 on #782BFF.
  primary:
    "text-white bg-[linear-gradient(180deg,#9a4dff_0%,#782bff_100%)] [box-shadow:inset_0_1px_0_rgb(255_255_255/0.25),var(--shadow-glow)] hover:brightness-110 hover:-translate-y-px active:translate-y-0 active:brightness-95",
  // Glass: translucent with a lavender hairline.
  secondary:
    "text-ink bg-surface-2 border border-line-strong backdrop-blur-md [box-shadow:inset_0_1px_0_rgb(255_255_255/0.06)] hover:bg-surface-3 hover:border-violet-soft/40",
  ghost: "text-ink-2 hover:text-ink hover:bg-surface-2",
  danger: "bg-bad/10 text-bad border border-bad/20 hover:bg-bad/20",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center font-medium whitespace-nowrap transition-[transform,filter,background-color,border-color,color,box-shadow] duration-200 ease-out-expo disabled:opacity-45 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    extra,
  );
}
