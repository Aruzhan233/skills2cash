import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight text-ink" aria-label="Skills2Cash home">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet to-violet-strong text-[13px] font-black text-white">
        S2
      </span>
      <span className="text-[15px]">
        Skills<span className="text-violet-soft">2</span>Cash
      </span>
    </Link>
  );
}
