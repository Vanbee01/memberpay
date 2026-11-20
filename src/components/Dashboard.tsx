"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Wallet, TrendingUp, TrendingDown, ScanLine, History, LogOut } from "lucide-react";
import Link from "next/link";
type Data = { stats: { members:number; balance:string; topups:string; charges:string }; latest: { id:string; name:string; memberNo:string; type:string; amount:string; createdAt:string }[] };
const money = (v:string) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(v));
export default function Dashboard({email}:{email:string}) {
  const [data,setData] = useState<Data|null>(null); const [error,setError] = useState(""); const router = useRouter();
  useEffect(()=>{ fetch("/api/dashboard").then(r=>r.json()).then(d=>{if(d.error) throw new Error(d.error);setData(d)}).catch(e=>setError(e.message)); },[]);
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});router.replace("/login");}
  const cards = [
    {label:"Anggota aktif",value:data?.stats.members.toLocaleString("id-ID")??"—",Icon:Users},
    {label:"Total saldo",value:data?money(data.stats.balance):"—",Icon:Wallet},
    {label:"Akumulasi top up",value:data?money(data.stats.topups):"—",Icon:TrendingUp},
    {label:"Akumulasi transaksi",value:data?money(data.stats.charges):"—",Icon:TrendingDown}
  ];
  return <main className="min-h-screen">
    <header className="border-b border-slate-800 bg-slate-950/80"><div className="max-w-6xl mx-auto px-5 py-4 flex justify-between items-center"><div><div className="text-blue-400 font-bold tracking-widest text-xs">MEMBERPAY</div><div className="font-semibold mt-1">Panel Admin</div></div><div className="flex gap-3 items-center"><span className="muted text-sm hidden sm:block">{email}</span><button onClick={logout} className="btn btn-secondary text-sm"><LogOut size={16}/> Keluar</button></div></div></header>
    <div className="max-w-6xl mx-auto p-5 md:p-8 space-y-7">
      <div className="flex flex-wrap justify-between gap-3 items-end"><div><p className="muted text-sm">Ringkasan operasional</p><h1 className="text-3xl font-bold mt-1">Dashboard</h1></div><div className="flex gap-2"><Link className="btn btn-secondary" href="/scan"><ScanLine size={17}/> Scan QR</Link><Link className="btn" href="/members"><Users size={17}/> Anggota</Link></div></div>
      {error && <p className="text-red-400">{error}</p>}
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(({label,value,Icon})=><div className="panel p-5" key={label}><div className="flex justify-between items-center"><span className="muted text-sm">{label}</span><Icon className="text-blue-400" size={19}/></div><div className="text-2xl font-bold mt-4">{value}</div></div>)}</section>
      <section className="panel overflow-hidden"><div className="p-5 border-b border-slate-800 flex items-center gap-2"><History size={18} className="text-blue-400"/><h2 className="font-semibold">Aktivitas terbaru</h2></div>
        {!data ? <p className="muted p-5">Memuat data...</p> : data.latest.length===0 ? <p className="muted p-5">Belum ada transaksi.</p> : <div className="divide-y divide-slate-800">{data.latest.map(x=><div key={x.id} className="p-4 flex flex-wrap gap-2 justify-between items-center"><div><div className="font-medium">{x.name}</div><div className="muted text-xs">{x.memberNo} · {new Date(x.createdAt).toLocaleString("id-ID")}</div></div><div className={x.type==="TOPUP"?"text-emerald-400 font-semibold":"text-rose-400 font-semibold"}>{x.type==="TOPUP"?"+":"−"}{money(x.amount)}</div></div>)}</div>}
      </section>
      <p className="muted text-xs">Semua nominal dalam Rupiah. Data diperbarui saat halaman dimuat.</p>
    </div>
  </main>;
}
