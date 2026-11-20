import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  memberNo: z.string().trim().min(1).max(40).regex(/^[a-zA-Z0-9._-]+$/),
  phone: z.string().trim().max(30).optional().or(z.literal(""))
});
export async function GET() {
  if (!await getAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const members = await prisma.member.findMany({
    orderBy: { createdAt: "desc" },
    include: { wallet: true },
    take: 500
  });
  return NextResponse.json({ members: members.map(m => ({
    id: m.id, name: m.name, memberNo: m.memberNo, phone: m.phone,
    active: m.active, qrToken: m.qrToken, balance: m.wallet?.balance.toString() ?? "0"
  })) });
}
export async function POST(req: NextRequest) {
  if (!await getAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data anggota tidak valid." }, { status: 400 });
  try {
    const member = await prisma.member.create({
      data: { ...parsed.data, phone: parsed.data.phone || null, qrToken: randomUUID(), wallet: { create: { balance: 0n } } },
      include: { wallet: true }
    });
    return NextResponse.json({ member: { id: member.id, name: member.name, memberNo: member.memberNo, phone: member.phone, qrToken: member.qrToken, balance: "0" } }, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002")
      return NextResponse.json({ error: "Nomor anggota sudah digunakan." }, { status: 409 });
    return NextResponse.json({ error: "Gagal menyimpan anggota." }, { status: 500 });
  }
}
