import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET() {
  if (!await getAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [members, wallets, topups, charges, latest] = await Promise.all([
    prisma.member.count({ where: { active: true } }),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.ledgerEntry.aggregate({ where: { type: "TOPUP" }, _sum: { amount: true } }),
    prisma.ledgerEntry.aggregate({ where: { type: "CHARGE" }, _sum: { amount: true } }),
    prisma.ledgerEntry.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { member: { select: { name: true, memberNo: true } } } })
  ]);
  return NextResponse.json({
    stats: { members, balance: (wallets._sum.balance ?? 0n).toString(), topups: (topups._sum.amount ?? 0n).toString(), charges: (charges._sum.amount ?? 0n).toString() },
    latest: latest.map(x => ({ id: x.id, name: x.member.name, memberNo: x.member.memberNo, type: x.type, amount: x.amount.toString(), createdAt: x.createdAt }))
  });
}
