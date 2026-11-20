import { getAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import ScanClient from "@/components/ScanClient";
export default async function ScanPage(){if(!await getAdmin())redirect("/login");return <ScanClient/>}
