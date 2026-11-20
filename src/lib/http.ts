import { NextResponse } from "next/server";
export function unauthorized() {
  return NextResponse.json({ error: "Sesi tidak valid. Silakan login kembali." }, { status: 401 });
}
export function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export function rupiah(value: bigint | number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
}
