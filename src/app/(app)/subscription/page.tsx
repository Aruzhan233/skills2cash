import Link from "next/link";
import { PlanUsage } from "@/components/plan-usage";
import { Button, PageHeader } from "@/components/ui";

export default function SubscriptionPage() {
  return (
    <div>
      <PageHeader title="Subscription" sub="Your plan and available usage." />
      <PlanUsage />
      <Link href="/pricing" className="mt-4 inline-block"><Button>View plans and upgrade</Button></Link>
    </div>
  );
}
