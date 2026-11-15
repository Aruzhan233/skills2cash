import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

const LOGO_SRC = "/brand/skills2cash-logo.png";

/** The official Skills2Cash mark (transparent PNG cut from the original artwork, unmodified). */
export function LogoMark({ size = 30, className, priority }: { size?: number; className?: string; priority?: boolean }) {
  return <Image src={LOGO_SRC} alt="" width={size} height={size} priority={priority} className={cn("shrink-0 select-none", className)} />;
}

export function Logo({ href = "/", size = 30 }: { href?: string; size?: number }) {
  return (
    <Link
      href={href}
      className="-mx-1.5 flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 font-semibold tracking-tight text-ink transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
      aria-label="Skills2Cash home"
    >
      <LogoMark size={size} priority />
      <span className="text-[15px]">
        Skills<span className="text-violet-soft">2</span>Cash
      </span>
    </Link>
  );
}
