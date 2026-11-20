import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
export default async function LoginPage() {
  if (await getAdmin()) redirect("/");
  return <main className="min-h-screen grid place-items-center p-5">
    <div className="panel w-full max-w-md p-8">
      <div className="mb-8"><div className="text-blue-400 font-bold text-sm tracking-widest">MEMBERPAY</div><h1 className="text-2xl font-bold mt-2">Masuk Admin</h1><p className="muted text-sm mt-1">Kelola saldo dan data anggota.</p></div>
      <LoginForm />
    </div>
  </main>;
}
