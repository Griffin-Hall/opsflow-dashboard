import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getOperationsData } from "@/lib/excelData";

export default async function DashboardPage() {
  const payload = await getOperationsData();

  return <DashboardShell initialData={payload} />;
}
