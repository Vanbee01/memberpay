import { getAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import MembersClient from "@/components/MembersClient";
export default async function MembersPage(){if(!await getAdmin())redirect("/login");return <MembersClient/>}
