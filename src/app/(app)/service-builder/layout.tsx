import { ServiceBuilderTabs } from "@/components/service-builder-tabs";

export default function ServiceBuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceBuilderTabs />
      {children}
    </>
  );
}
