import { getDashboardData } from "@/lib/queries";
import { requireProfile } from "@/lib/auth";
import { DashboardTabs } from "./dashboard-tabs";

export default async function DashboardPage() {
  await requireProfile();
  const data = await getDashboardData();
  return <DashboardTabs data={data} />;
}
