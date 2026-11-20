import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "MemberPay Admin", description: "Sistem manajemen saldo anggota" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
