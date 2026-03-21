import DashboardClient from "@/components/DashboardClient";

export default function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <DashboardClient searchParamsPromise={searchParams} />;
}
