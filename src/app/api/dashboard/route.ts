import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!await getAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 13);

  const [members, wallets, topups, charges, latest, chartEntries] = await Promise.all([
    prisma.member.count({ where: { active: true } }),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.ledgerEntry.aggregate({ where: { type: "TOPUP" }, _sum: { amount: true } }),
    prisma.ledgerEntry.aggregate({ where: { type: "CHARGE" }, _sum: { amount: true } }),
    prisma.ledgerEntry.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { member: { select: { name: true, memberNo: true } } } }),
    prisma.ledgerEntry.findMany({ where: { createdAt: { gte: start } }, select: { type: true, amount: true, createdAt: true } })
  ]);

  const daily = new Map<string, { topup: bigint; charge: bigint }>();
  for (let i = 0; i < 14; i++) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    daily.set(date.toISOString().slice(0, 10), { topup: 0n, charge: 0n });
  }
  for (const entry of chartEntries) {
    const key = entry.createdAt.toISOString().slice(0, 10);
    const day = daily.get(key);
    if (!day) continue;
    if (entry.type === "TOPUP") day.topup += entry.amount;
    else day.charge += entry.amount;
  }

  return NextResponse.json({
    stats: { members, balance: (wallets._sum.balance ?? 0n).toString(), topups: (topups._sum.amount ?? 0n).toString(), charges: (charges._sum.amount ?? 0n).toString() },
    latest: latest.map(x => ({ id: x.id, name: x.member.name, memberNo: x.member.memberNo, type: x.type, amount: x.amount.toString(), createdAt: x.createdAt })),
    chart: Array.from(daily, ([date, value]) => ({ date, topup: value.topup.toString(), charge: value.charge.toString() }))
  });
}
