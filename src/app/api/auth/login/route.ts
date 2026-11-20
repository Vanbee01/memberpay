import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const schema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) });
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email atau password tidak valid." }, { status: 400 });
  const email = parsed.data.email.trim().toLowerCase();
  const admin = await prisma.admin.findUnique({ where: { email } });
  const valid = admin ? await bcrypt.compare(parsed.data.password, admin.passwordHash) : false;
  if (!admin || !valid) return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
  await createSession(admin.id);
  return NextResponse.json({ ok: true });
}
