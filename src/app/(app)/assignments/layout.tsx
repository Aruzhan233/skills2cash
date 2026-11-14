import { MissionsTabs } from "@/components/missions-tabs";

export default function MissionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MissionsTabs />
      {children}
    </>
  );
}
