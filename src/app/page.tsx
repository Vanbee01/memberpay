import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
export default async function Home() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return <Dashboard email={admin.email} />;
}
