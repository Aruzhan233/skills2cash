import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { PageLoader } from "@/components/ui";

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AuthForm kind="login" />
    </Suspense>
  );
}
