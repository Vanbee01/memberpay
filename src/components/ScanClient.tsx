"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {ArrowLeft,Camera,Search,Plus,Minus,CameraOff,ImagePlus} from "lucide-react";
type Detail={member:{id:string;name:string;memberNo:string;phone:string|null;balance:string};entries:{id:string;type:string;amount:string;balanceAfter:string;note:string|null;createdAt:string}[]};
const money=(v:string)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(v));
export default function ScanClient(){
 const params=useSearchParams();const [token,setToken]=useState(params.get("token")??"");const [detail,setDetail]=useState<Detail|null>(null);const [amount,setAmount]=useState("");const [note,setNote]=useState("");const [type,setType]=useState<"TOPUP"|"CHARGE">("TOPUP");const [error,setError]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);const [scanning,setScanning]=useState(false);const [cameraError,setCameraError]=useState("");const [imageBusy,setImageBusy]=useState(false);const [imageError,setImageError]=useState("");
 async function lookup(value=token){setError("");setMessage("");setDetail(null);if(!value.trim())return;const r=await fetch(`/api/members/${encodeURIComponent(value.trim())}`);const d=await r.json();if(!r.ok){setError(d.error);return;}setDetail(d);}
 useEffect(()=>{const t=params.get("token");if(t){setToken(t);lookup(t)}},[]);
 useEffect(()=>{
   if(!scanning)return;
   let scanner: import("html5-qrcode").Html5Qrcode | null=null;
   let cancelled=false;
   (async()=>{
     try{
       const {Html5Qrcode}=await import("html5-qrcode");
       if(cancelled)return;
       scanner=new Html5Qrcode("memberpay-qr-reader");
       await scanner.start({facingMode:"environment"},{fps:10,qrbox:{width:240,height:240}},
         async(decodedText)=>{
           let value=decodedText;
           try{const url=new URL(decodedText);value=url.searchParams.get("token")??decodedText;}catch{}
           setToken(value);setScanning(false);
           try{await scanner?.stop();}catch{}
           await lookup(value);
         },()=>{});
     }catch(e){setCameraError(e instanceof Error?e.message:"Kamera tidak dapat dibuka.");setScanning(false);}
   })();
   return ()=>{cancelled=true;if(scanner?.isScanning)scanner.stop().catch(()=>{});};
 },[scanning]);
 async function scanImage(file:File){setImageError("");setError("");setMessage("");setImageBusy(true);try{const {Html5Qrcode}=await import("html5-qrcode");const reader=new Html5Qrcode("memberpay-image-reader");const decoded=await reader.scanFile(file,true);try{await reader.clear();}catch{}let value=decoded;try{const url=new URL(decoded);value=url.searchParams.get("token")??decoded;}catch{}setToken(value);await lookup(value);}catch(e){setImageError(e instanceof Error?e.message:"QR tidak ditemukan pada gambar. Coba gambar yang lebih jelas.");}finally{setImageBusy(false);}}
 async function transact(e:React.FormEvent){e.preventDefault();if(!detail)return;setBusy(true);setError("");setMessage("");try{const r=await fetch("/api/transactions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({memberId:detail.member.id,type,amount:Number(amount),note})});const d=await r.json();if(!r.ok)throw new Error(d.error);setMessage("Transaksi berhasil disimpan.");setAmount("");await lookup();}catch(e){setError(e instanceof Error?e.message:"Transaksi gagal");}finally{setBusy(false)}}
 return <main className="max-w-4xl mx-auto p-5 md:p-8 space-y-6"><Link href="/" className="muted text-sm inline-flex gap-2 items-center"><ArrowLeft size={16}/> Dashboard</Link><div><h1 className="text-3xl font-bold">Scan & Kelola Saldo</h1><p className="muted mt-1">Masukkan token QR atau scan menggunakan aplikasi kamera perangkat.</p></div>
 <div className="panel p-4 space-y-3"><form onSubmit={e=>{e.preventDefault();lookup()}} className="flex flex-col sm:flex-row gap-2"><input className="field flex-1" value={token} onChange={e=>setToken(e.target.value)} placeholder="Tempel token atau URL QR anggota..." /><button className="btn"><Search size={16}/> Cari anggota</button><button type="button" className="btn btn-secondary" onClick={()=>{setCameraError("");setScanning(v=>!v)}}>{scanning?<CameraOff size={16}/>:<Camera size={16}/>} {scanning?"Tutup kamera":"Scan kamera"}</button><label className="btn btn-secondary cursor-pointer"><ImagePlus size={16}/>{imageBusy?"Membaca QR...":"Pilih Gambar"}<input type="file" accept="image/*" className="hidden" disabled={imageBusy} onChange={e=>{const file=e.target.files?.[0];if(file)void scanImage(file);e.currentTarget.value="";}}/></label></form><div id="memberpay-image-reader" className="hidden"/>{scanning&&<div id="memberpay-qr-reader" className="max-w-md mx-auto overflow-hidden rounded-xl"/>}{cameraError&&<p className="text-rose-400 text-sm">{cameraError} Pastikan akses kamera diizinkan dan gunakan HTTPS.</p>}{imageError&&<p className="text-rose-400 text-sm">{imageError}</p>}<p className="muted text-xs">Pilih gambar QR dari galeri, foto, atau file perangkat (PNG/JPG/WebP).</p></div>
 {error&&<p className="text-red-400 text-sm">{error}</p>}{message&&<p className="text-emerald-400 text-sm">{message}</p>}
 {detail&&<div className="grid lg:grid-cols-2 gap-5"><section className="panel p-6"><p className="muted text-sm">Informasi anggota</p><h2 className="text-2xl font-bold mt-1">{detail.member.name}</h2><p className="muted text-sm">{detail.member.memberNo}{detail.member.phone? ` · ${detail.member.phone}`:""}</p><div className="mt-7"><p className="muted text-sm">Saldo saat ini</p><div className="text-3xl font-bold text-emerald-400 mt-1">{money(detail.member.balance)}</div></div><h3 className="font-semibold mt-8 mb-3">10 mutasi terakhir</h3><div className="space-y-3">{detail.entries.map(x=><div key={x.id} className="flex justify-between gap-3 text-sm"><div><div>{x.type==="TOPUP"?"Top Up":"Transaksi"}</div><div className="muted text-xs">{new Date(x.createdAt).toLocaleString("id-ID")} {x.note? `· ${x.note}`:""}</div></div><div className={x.type==="TOPUP"?"text-emerald-400":"text-rose-400"}>{x.type==="TOPUP"?"+":"−"}{money(x.amount)}</div></div>)}{detail.entries.length===0&&<p className="muted text-sm">Belum ada mutasi.</p>}</div></section>
 <form onSubmit={transact} className="panel p-6 space-y-4"><h2 className="font-semibold">Kelola saldo</h2><div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setType("TOPUP")} className={`rounded-lg p-3 border ${type==="TOPUP"?"border-emerald-500 bg-emerald-500/10 text-emerald-300":"border-slate-700"}`}><Plus size={18} className="inline mr-2"/>Top Up</button><button type="button" onClick={()=>setType("CHARGE")} className={`rounded-lg p-3 border ${type==="CHARGE"?"border-rose-500 bg-rose-500/10 text-rose-300":"border-slate-700"}`}><Minus size={18} className="inline mr-2"/>Transaksi</button></div><label className="block text-sm">Nominal (Rupiah)<input className="field mt-2" type="number" min="1" max="1000000000" step="1" required value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Contoh: 25000"/></label><label className="block text-sm">Catatan (opsional)<input className="field mt-2" maxLength={250} value={note} onChange={e=>setNote(e.target.value)} placeholder="Keterangan transaksi"/></label><p className="muted text-xs">Pastikan nominal dan jenis transaksi benar. Operasi akan langsung mengubah saldo anggota.</p><button className="btn w-full" disabled={busy}>{busy?"Memproses...":type==="TOPUP"?"Konfirmasi Top Up":"Konfirmasi Transaksi"}</button></form></div>}
 </main>;
}
