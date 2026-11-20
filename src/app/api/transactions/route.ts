import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

const schema = z.object({
  memberId: z.string().min(1),
  type: z.enum(["TOPUP", "CHARGE"]),
  amount: z.number().int().positive().max(1000000000),
  note: z.string().trim().max(250).optional()
});
export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nominal atau data transaksi tidak valid." }, { status: 400 });
  const { memberId, type, amount, note } = parsed.data;
  const value = BigInt(amount);
  const idempotencyKey = randomUUID();
  try {
    const result = await prisma.$transaction(async tx => {
      const member = await tx.member.findUnique({ where: { id: memberId }, select: { id: true, active: true } });
      if (!member || !member.active) throw new Error("MEMBER_NOT_FOUND");
      const wallet = await tx.wallet.findUnique({ where: { memberId } });
      if (!wallet) throw new Error("WALLET_NOT_FOUND");
      const before = wallet.balance;
      if (type === "CHARGE" && before < value) throw new Error("INSUFFICIENT_BALANCE");
      const after = type === "TOPUP" ? before + value : before - value;
      const changed = await tx.wallet.updateMany({
        where: { memberId, balance: before },
        data: { balance: after }
      });
      if (changed.count !== 1) throw new Error("BALANCE_CONFLICT");
      const entry = await tx.ledgerEntry.create({
        data: { memberId, adminId: admin.id, type, amount: value, balanceBefore: before, balanceAfter: after, note: note || null, idempotencyKey }
      });
      return { entryId: entry.id, balance: after.toString(), before: before.toString() };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10000 });
    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "MEMBER_NOT_FOUND") return NextResponse.json({ error: "Anggota tidak ditemukan atau nonaktif." }, { status: 404 });
    if (message === "WALLET_NOT_FOUND") return NextResponse.json({ error: "Dompet anggota belum tersedia." }, { status: 409 });
    if (message === "INSUFFICIENT_BALANCE") return NextResponse.json({ error: "Saldo tidak mencukupi." }, { status: 409 });
    if (message === "BALANCE_CONFLICT" || (typeof error === "object" && error && "code" in error && error.code === "P2034"))
      return NextResponse.json({ error: "Saldo baru saja berubah. Muat ulang lalu coba lagi." }, { status: 409 });
    return NextResponse.json({ error: "Transaksi gagal diproses." }, { status: 500 });
  }
}
