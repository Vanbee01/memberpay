"use client";
import { useEffect,useRef,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Plus, QrCode, Search, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
type Member={id:string;name:string;memberNo:string;phone:string|null;qrToken:string;balance:string};
const money=(v:string)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(v));
export default function MembersClient(){
 const [members,setMembers]=useState<Member[]>([]);const [name,setName]=useState("");const [memberNo,setMemberNo]=useState("");const [phone,setPhone]=useState("");const [error,setError]=useState("");const [search,setSearch]=useState("");const [selected,setSelected]=useState<Member|null>(null);const qrRef=useRef<SVGSVGElement>(null);const router=useRouter();
 async function load(){const r=await fetch("/api/members");if(r.status===401){router.replace("/login");return;}const d=await r.json();setMembers(d.members??[]);}
 useEffect(()=>{load()},[]);
 async function add(e:React.FormEvent){e.preventDefault();setError("");const r=await fetch("/api/members",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,memberNo,phone})});const d=await r.json();if(!r.ok){setError(d.error);return;}setName("");setMemberNo("");setPhone("");await load();setSelected(d.member);}
 function downloadQr(){
  const svg=qrRef.current;if(!svg||!selected)return;
  const serialized=new XMLSerializer().serializeToString(svg);
  const svgUrl=URL.createObjectURL(new Blob([serialized],{type:"image/svg+xml;charset=utf-8"}));
  const img=new Image();
  img.onload=()=>{
   const canvas=document.createElement("canvas");canvas.width=1440;canvas.height=820;
   const ctx=canvas.getContext("2d");if(!ctx){URL.revokeObjectURL(svgUrl);return;}
   const rounded=(x:number,y:number,w:number,h:number,r:number)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
   const bg=ctx.createLinearGradient(0,0,1440,820);bg.addColorStop(0,"#202020");bg.addColorStop(.55,"#111111");bg.addColorStop(1,"#080808");
   ctx.fillStyle=bg;ctx.fillRect(0,0,1440,820);
   ctx.save();ctx.globalAlpha=.16;ctx.fillStyle="#555";
   for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-180+i*125,0);ctx.lineTo(90+i*125,0);ctx.lineTo(700+i*125,410);ctx.lineTo(430+i*125,410);ctx.closePath();ctx.fill();}
   for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-180+i*145,820);ctx.lineTo(90+i*145,820);ctx.lineTo(700+i*145,410);ctx.lineTo(430+i*145,410);ctx.closePath();ctx.fill();}
   ctx.restore();
   ctx.fillStyle="#f5f5f5";ctx.font="700 76px Arial, sans-serif";ctx.fillText(selected.name.toLocaleUpperCase("id-ID"),125,390,600);
   ctx.fillStyle="#aaa";ctx.font="400 36px Arial, sans-serif";ctx.fillText("YOUR POSITION",125,445);
   ctx.fillStyle="#f0eee9";ctx.font="400 40px Arial, sans-serif";ctx.fillText("MEMBER ID: "+selected.memberNo,125,505,600);
   ctx.strokeStyle="#f5f5f5";ctx.lineWidth=14;rounded(800,190,470,470,55);ctx.stroke();
   ctx.strokeStyle="#f5f5f5";ctx.lineWidth=10;
   const corners=[[850,235,1,1],[1220,235,-1,1],[850,615,1,-1],[1220,615,-1,-1]];
   for(const [x,y,sx,sy] of corners){ctx.beginPath();ctx.moveTo(x+sx*62,y);ctx.lineTo(x,y);ctx.lineTo(x,y+sy*62);ctx.stroke();}
   ctx.fillStyle="#fff";ctx.font="500 34px Arial, sans-serif";ctx.textAlign="center";
   ctx.fillText("TEMPEL",1035,340);ctx.fillText("QR CODE",1035,395);ctx.fillText("DI SINI",1035,450);
   ctx.fillStyle="#fff";ctx.fillRect(935,385,200,200);
   ctx.drawImage(img,940,390,190,190);
   ctx.textAlign="left";
   canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="Member-"+selected.memberNo.replace(/[^a-z0-9_-]/gi,"_")+".png";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);},"image/png");
   URL.revokeObjectURL(svgUrl);
  };
  img.onerror=()=>URL.revokeObjectURL(svgUrl);img.src=svgUrl;
 }
 const visible=members.filter(m=>(m.name+" "+m.memberNo).toLowerCase().includes(search.toLowerCase()));
 return <main className="max-w-6xl mx-auto p-5 md:p-8 space-y-6">
  <Link href="/" className="muted text-sm inline-flex gap-2 items-center"><ArrowLeft size={16}/> Dashboard</Link>
  <div><h1 className="text-3xl font-bold">Data Anggota</h1><p className="muted mt-1">Daftarkan anggota dan buat kartu QR unik.</p></div>
  <div className="grid lg:grid-cols-[360px_1fr] gap-5">
   <form onSubmit={add} className="panel p-5 space-y-4 h-fit"><h2 className="font-semibold">Tambah anggota</h2>
    <label className="block text-sm">Nama lengkap<input className="field mt-2" required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label>
    <label className="block text-sm">Nomor anggota<input className="field mt-2" required maxLength={40} value={memberNo} onChange={e=>setMemberNo(e.target.value)}/></label>
    <label className="block text-sm">Nomor HP (opsional)<input className="field mt-2" maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)}/></label>
    {error&&<p className="text-red-400 text-sm">{error}</p>}<button className="btn w-full"><Plus size={16}/> Simpan anggota</button>
   </form>
   <section className="panel overflow-hidden"><div className="p-4 border-b border-slate-800"><div className="relative"><Search size={16} className="absolute left-3 top-3 muted"/><input className="field pl-9" placeholder="Cari nama atau nomor anggota..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
    <div className="divide-y divide-slate-800">{visible.map(m=><div key={m.id} className="p-4 flex items-center justify-between gap-3"><div><div className="font-medium">{m.name}</div><div className="muted text-xs">{m.memberNo} · {money(m.balance)}</div></div><button onClick={()=>setSelected(m)} className="btn btn-secondary text-sm"><QrCode size={16}/> Lihat kartu QR</button></div>)}{visible.length===0&&<p className="muted p-5">Belum ada anggota.</p>}</div>
   </section>
  </div>
  {selected&&<div className="fixed inset-0 bg-black/80 grid place-items-center p-3 sm:p-6 z-20 overflow-y-auto" onClick={()=>setSelected(null)}>
   <div className="w-full max-w-5xl" onClick={e=>e.stopPropagation()}>
    <div className="flex justify-between items-center mb-3"><p className="text-sm text-slate-300">Preview kartu anggota</p><button onClick={()=>setSelected(null)} aria-label="Tutup" className="p-2 rounded-lg bg-slate-800"><X size={18}/></button></div>
    <div className="member-card relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/15 shadow-2xl grid grid-cols-[1.15fr_.85fr] items-center gap-2 sm:gap-8 p-4 sm:p-10 md:p-14" style={{aspectRatio:"1.76",background:"linear-gradient(120deg,#202020,#090909)"}}>
     <div className="absolute inset-0 pointer-events-none opacity-30" style={{backgroundImage:"repeating-linear-gradient(45deg,transparent 0 70px,rgba(255,255,255,.055) 70px 145px,transparent 145px 220px)"}}/>
     <div className="relative min-w-0 z-10"><div className="font-extrabold tracking-wide text-white text-xl sm:text-4xl md:text-5xl lg:text-6xl break-words leading-tight">{selected.name.toLocaleUpperCase("id-ID")}</div><div className="text-white/55 text-[9px] sm:text-base md:text-2xl tracking-wider mt-1 sm:mt-3">YOUR POSITION</div><div className="text-white/90 text-[10px] sm:text-lg md:text-2xl mt-1 sm:mt-2 break-all">MEMBER ID: {selected.memberNo}</div></div>
     <div className="relative z-10 aspect-square w-full max-w-[310px] justify-self-center rounded-[12%] sm:rounded-[14%] border-[3px] sm:border-[7px] border-white flex flex-col items-center justify-center p-[7%]">
      <div className="absolute top-[9%] left-[9%] w-[16%] h-[16%] border-l-[3px] sm:border-l-[6px] border-t-[3px] sm:border-t-[6px] border-white"/>
      <div className="absolute top-[9%] right-[9%] w-[16%] h-[16%] border-r-[3px] sm:border-r-[6px] border-t-[3px] sm:border-t-[6px] border-white"/>
      <div className="absolute bottom-[9%] left-[9%] w-[16%] h-[16%] border-l-[3px] sm:border-l-[6px] border-b-[3px] sm:border-b-[6px] border-white"/>
      <div className="absolute bottom-[9%] right-[9%] w-[16%] h-[16%] border-r-[3px] sm:border-r-[6px] border-b-[3px] sm:border-b-[6px] border-white"/>
      <div className="relative z-10 bg-white p-1 sm:p-2 rounded-sm w-[72%] aspect-square flex items-center justify-center"><QRCodeSVG ref={qrRef} value={typeof window!=="undefined"?window.location.origin+"/scan?token="+selected.qrToken:""} size={256} level="H" bgColor="#ffffff" fgColor="#000000" style={{width:"100%",height:"100%"}}/></div>
     </div>
    </div>
    <p className="text-slate-400 text-xs sm:text-sm mt-3 text-center">Kartu hitam landscape · QR identitas anggota · saldo tidak tersimpan di QR</p>
    <button className="btn w-full mt-4 py-3" onClick={downloadQr}><Download size={17}/> Download kartu + QR (PNG)</button>
   </div>
  </div>}
 </main>;
}
