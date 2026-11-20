"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Wallet, TrendingUp, TrendingDown, ScanLine, History, LogOut, ChartColumn } from "lucide-react";
import Link from "next/link";

type Data = {
  stats: { members:number; balance:string; topups:string; charges:string };
  latest: { id:string; name:string; memberNo:string; type:string; amount:string; createdAt:string }[];
  chart: { date:string; topup:string; charge:string }[];
};
const money = (v:string) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(v));
const compactMoney = (v:number) => new Intl.NumberFormat("id-ID",{notation:"compact",maximumFractionDigits:1}).format(v);

function TransactionChart({items}:{items:Data["chart"]}) {
  const values = items.map(x => Number(x.topup) + Number(x.charge));
  const max = Math.max(1, ...values);
  const chartHeight = 164;
  const step = 700 / Math.max(items.length, 1);
  const barWidth = Math.min(22, step * 0.62);
  return <div className="p-5">
    <div className="flex flex-wrap gap-4 text-xs mb-4">
      <span className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-sm bg-emerald-400"/>Top up</span>
      <span className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-sm bg-rose-400"/>Pemakaian saldo</span>
    </div>
    {items.every(x => Number(x.topup) === 0 && Number(x.charge) === 0) ? <p className="muted py-10 text-center">Belum ada transaksi dalam 14 hari terakhir.</p> :
    <div className="w-full overflow-hidden">
      <svg viewBox="0 0 700 220" role="img" aria-label="Grafik nominal top up dan pemakaian saldo 14 hari terakhir" className="w-full h-auto">
        {[0,1,2,3].map(i => <g key={i}><line x1="38" x2="694" y1={18+i*chartHeight/3} y2={18+i*chartHeight/3} stroke="#334155" strokeDasharray="4 5"/><text x="32" y={22+i*chartHeight/3} textAnchor="end" fill="#94a3b8" fontSize="10">{compactMoney(max*(3-i)/3)}</text></g>)}
        {items.map((item,i) => {
          const top = Number(item.topup), charge = Number(item.charge);
          const x = 43 + i*step + (step-barWidth)/2;
          const topH = top/max*chartHeight, chargeH = charge/max*chartHeight;
          return <g key={item.date}>
            <rect x={x} y={182-topH} width={barWidth} height={topH} rx="3" fill="#34d399"><title>{item.date}: top up {money(item.topup)}</title></rect>
            <rect x={x} y={182-topH-chargeH} width={barWidth} height={chargeH} rx="3" fill="#fb7185"><title>{item.date}: pemakaian {money(item.charge)}</title></rect>
            {(i%2===0 || i===items.length-1) && <text x={x+barWidth/2} y="204" textAnchor="middle" fill="#94a3b8" fontSize="10">{item.date.slice(8,10)}/{item.date.slice(5,7)}</text>}
          </g>;
        })}
      </svg>
    </div>}
  </div>;
}

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
      <section className="panel overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-wrap justify-between items-center gap-2"><div className="flex items-center gap-2"><ChartColumn size={18} className="text-blue-400"/><h2 className="font-semibold">Grafik transaksi</h2></div><span className="muted text-xs">14 hari terakhir · Rupiah</span></div>
        {data ? <TransactionChart items={data.chart}/> : <p className="muted p-5">Memuat grafik...</p>}
      </section>
      <section className="panel overflow-hidden"><div className="p-5 border-b border-slate-800 flex items-center gap-2"><History size={18} className="text-blue-400"/><h2 className="font-semibold">Aktivitas terbaru</h2></div>
        {!data ? <p className="muted p-5">Memuat data...</p> : data.latest.length===0 ? <p className="muted p-5">Belum ada transaksi.</p> : <div className="divide-y divide-slate-800">{data.latest.map(x=><div key={x.id} className="p-4 flex flex-wrap gap-2 justify-between items-center"><div><div className="font-medium">{x.name}</div><div className="muted text-xs">{x.memberNo} · {new Date(x.createdAt).toLocaleString("id-ID")}</div></div><div className={x.type==="TOPUP"?"text-emerald-400 font-semibold":"text-rose-400 font-semibold"}>{x.type==="TOPUP"?"+":"−"}{money(x.amount)}</div></div>)}</div>}
      </section>
      <p className="muted text-xs">Semua nominal dalam Rupiah. Grafik menghitung transaksi harian dari ledger dan diperbarui saat halaman dimuat.</p>
    </div>
  </main>;
}
