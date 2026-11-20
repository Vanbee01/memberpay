# MemberPay

Aplikasi admin untuk mengelola saldo anggota dengan QR unik, top up, transaksi pengurangan saldo, dan ledger mutasi.

## Persyaratan
- Node.js 20.9+
- PostgreSQL
- npm

## Setup lokal
1. Salin `.env.example` menjadi `.env`.
2. Isi `DATABASE_URL`, `SESSION_SECRET` (minimal 32 karakter acak), `ADMIN_EMAIL`, dan `ADMIN_PASSWORD` (minimal 12 karakter).
3. Jalankan:

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`.

## Deploy Railway
1. Tambahkan service dari repository GitHub ini.
2. Set `DATABASE_URL` ke referensi variabel PostgreSQL Railway (contoh: `${{Postgres.DATABASE_URL}}`, sesuaikan nama service DB).
3. Set `SESSION_SECRET` ke string acak minimal 32 karakter.
4. Set `ADMIN_EMAIL` dan `ADMIN_PASSWORD` (minimal 12 karakter).
5. Set `APP_URL` ke domain publik aplikasi.
6. Set **Pre-deploy Command** menjadi `npx prisma db push`.
7. Setelah deploy, jalankan `npm run db:seed` sekali melalui Railway shell / command job agar akun admin dibuat.
8. Generate domain publik dari Settings > Networking.

## Fitur
- Admin-only session cookie (HttpOnly, Secure pada production, SameSite Strict).
- Anggota dengan nomor unik dan token QR acak.
- QR Code berisi URL scan dan token, bukan saldo.
- Saldo disimpan sebagai BigInt rupiah (integer).
- Mutasi saldo dalam transaksi database serializable, dengan optimistic balance check.
- Top up dan charge dicatat sebagai ledger; tidak ada endpoint edit saldo langsung.

## Catatan produksi
- Tambahkan rate limiting pada endpoint login di level reverse proxy/WAF sebelum penggunaan publik.
- Jadwalkan backup PostgreSQL dan uji restore.
- Gunakan HTTPS domain Railway.
- `prisma db push` sesuai untuk bootstrap awal; untuk perubahan skema jangka panjang, gunakan Prisma Migrate.
