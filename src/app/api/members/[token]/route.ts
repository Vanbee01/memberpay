import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!await getAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { token } = await ctx.params;
  const member = await prisma.member.findUnique({ where: { qrToken: token }, include: { wallet: true } });
  if (!member || !member.active) return NextResponse.json({ error: "Anggota tidak ditemukan atau nonaktif." }, { status: 404 });
  const entries = await prisma.ledgerEntry.findMany({ where: { memberId: member.id }, orderBy: { createdAt: "desc" }, take: 10 });
  return NextResponse.json({
    member: { id: member.id, name: member.name, memberNo: member.memberNo, phone: member.phone, balance: member.wallet?.balance.toString() ?? "0" },
    entries: entries.map(e => ({ id: e.id, type: e.type, amount: e.amount.toString(), balanceAfter: e.balanceAfter.toString(), note: e.note, createdAt: e.createdAt }))
  });
}
