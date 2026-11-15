"use client";

import Link from "next/link";
import { buttonClass } from "./button-class";
import { useWorkspace } from "./workspace";

/** Landing header link: "Log in" for visitors, "Dashboard" when a session already exists. */
export function LandingAccountLink() {
  const ws = useWorkspace();
  if (ws.auth.status === "signed_in") {
    return (
      <Link href="/dashboard" className={buttonClass("ghost", "sm")}>
        Dashboard
      </Link>
    );
  }
  return (
    <Link href="/login" className={buttonClass("ghost", "sm")}>
      Log in
    </Link>
  );
}
