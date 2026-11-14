import { cn } from "@/lib/cn";

export type Variant = "primary" | "secondary" | "ghost" | "danger";
export type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  // violet-strong keeps white label text above 4.5:1
  primary: "bg-violet-strong text-white hover:bg-violet-deep active:bg-violet-deep",
  secondary: "bg-surface-3 text-ink hover:bg-line-strong active:bg-line-strong",
  ghost: "text-ink-2 hover:text-ink hover:bg-surface-3",
  danger: "bg-bad/10 text-bad hover:bg-bad/20",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap",
    variants[variant],
    sizes[size],
    extra,
  );
}

