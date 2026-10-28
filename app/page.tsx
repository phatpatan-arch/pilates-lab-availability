'use client';
import {useCallback,useEffect,useState} from 'react';
type Slot={start:string;end:string;available:boolean};
const localDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const whatsapp='66657755299';
const firstStart='06:30';
const lastStart='22:00';
const inBookingWindow=(start:string)=>start>=firstStart&&start<=lastStart;
export default function Home(){
  const [date,setDate]=useState(localDate);
  const [slots,setSlots]=useState<Slot[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [selected,setSelected]=useState<number[]>([]);
  const duration = 1;
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{const r=await fetch(`/api/availability?date=${encodeURIComponent(date)}`,{cache:'no-store'});const data=await r.json();
      if(!r.ok||!Array.isArray(data.slots))throw new Error(data.error||'Could not load availability');
      setSlots(data.slots);
    }catch(e){setSlots([]);setError(e instanceof Error?e.message:'Unable to load availability');}
    finally{setLoading(false)}
  },[date]);
  useEffect(()=>{setSelected([]);load();const timer=setInterval(load,60000);return()=>clearInterval(timer)},[load]);
  const today=localDate();
  const currentHour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
  const isPast = (i: number) => {
    if (date < today) return true;
    if (date > today) return false;
  
    const now = new Date();
    const bangkokTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(now);
  
    return slots[i].start <= bangkokTime;
  };
  const selectable = (i: number) => {
    const requiredSlots = duration * 2;
  
    if (i < 0 || i + requiredSlots > slots.length || !inBookingWindow(slots[i].start)) {
      return false;
    }
  
    if (isPast(i)) {
      return false;
    }
  
    // Each slot already checks a full 60-minute booking.
    // Check start times every 30 minutes without extending
    // the booking window unnecessarily.
    const checksNeeded = Math.max(1, requiredSlots - 1);
  
    return slots
      .slice(i, i + checksNeeded)
      .every((slot) => slot.available);
  };
  const overlaps = (a: number, b: number) => a !== b && Math.abs(a - b) < duration * 2;
  useEffect(()=>{
    setSelected(prev=>{
      const sorted=prev.filter(i=>selectable(i)).sort((a,b)=>a-b);
      const next=sorted.filter((i,idx)=>!sorted.slice(0,idx).some(s=>overlaps(s,i)));
      return next.length===prev.length&&next.every((v,idx)=>v===prev[idx])?prev:next;
    });
  },[slots,date]);
  const blocked = (i: number) => selected.some(s => overlaps(s, i));
  const sessions = [...selected]
    .filter((i) => selectable(i) && !selected.some((s) => s < i && overlaps(s, i)))
    .sort((a, b) => a - b)
    .map((i) => {
      const endIndex = i + duration * 2;
      const endLabel = slots[endIndex]?.start ?? (endIndex === slots.length ? '00:00' : '');
      const endDateNote = endIndex === slots.length ? ' (next day)' : '';
      return {start: slots[i]?.start ?? '', endLabel, endDateNote};
    })
    .filter((session) => session.start && session.endLabel);
  const rangeText = sessions.map((session) => `${session.start} to ${session.endLabel}${session.endDateNote}`);
  const joinedRanges = rangeText.length < 2 ? rangeText.join('') : `${rangeText.slice(0, -1).join(', ')} and ${rangeText[rangeText.length - 1]}`;
  const message = sessions.length === 0 ? '' : `Hello Pilates LAB! I would like to request studio rental on ${date} from ${joinedRanges} (${sessions.length} hour${sessions.length > 1 ? 's' : ''}). Could you please confirm availability?`;
  const summaryTimes = sessions.map((session) => `${session.start}–${session.endLabel}${session.endDateNote}`).join(', ');
  const hourCount = sessions.length || duration;
  const toggle = (i: number) => {
    setSelected((prev) => {
      if (prev.includes(i)) return prev.filter((s) => s !== i);
      if (!selectable(i) || prev.some((s) => overlaps(s, i))) return prev;
      return [...prev, i].sort((a, b) => a - b);
    });
  };
  return <main className="shell">
    <header><div className="brand">PILATES <span>LAB</span><small>PRIVATE STUDIO · BANGTAO, PHUKET</small></div><a className="contact" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">Contact us ↗</a></header>
    <section className="hero"><p className="eyebrow">YOUR SPACE. YOUR TIME.</p><h1>Find your studio time.</h1><p>Each 1-hour booking includes 50 minutes of Pilates and 10 minutes to clean and reset the equipment. Choose your preferred time below, and our team will confirm your booking.</p></section>
    <section className="panel"><div className="controls"><label>SELECT DATE<input aria-label="Select date" type="date" min={today} value={date} onChange={e=>{setDate(e.target.value);setSelected([])}}/></label></div>
    <div className="legend"><span><i className="dot free"/>Available</span><span><i className="dot busy"/>Booked / unavailable</span></div>
    {error&&<p className="error" role="alert">{error} <button onClick={load}>Try again</button></p>}
    {loading?<p className="loading">Checking live availability…</p>:!error&&<div className="slots">{slots.map((slot,i)=>({slot,i})).filter(({slot})=>inBookingWindow(slot.start)).map(({slot,i})=>{const picked=selected.includes(i);const open=selectable(i)&&!blocked(i);return <button type="button" key={slot.start} disabled={!picked&&!open} aria-pressed={picked} className={`slot ${!open&&!picked?'unavailable':''} ${picked?'selected':''}`} onClick={()=>toggle(i)}><strong>{slot.start}</strong><small>{open||picked?'Available':'Unavailable'}</small></button>})}</div>}
    <p className="note" style={{marginTop:15}}>Our studio is open 24/7. For bookings outside the displayed hours, please contact us via WhatsApp.</p>
    <div className="summary"><div><small>YOUR REQUEST</small><strong>{sessions.length===0?'Select an available time':`${date} · ${summaryTimes}`}</strong><p>{`${hourCount} hour${hourCount>1?'s':''} · Thailand time (GMT+7)`}</p></div><a className={`cta ${sessions.length===0?'disabled':''}`} aria-disabled={sessions.length===0} href={sessions.length>0?`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`:undefined} target="_blank" rel="noreferrer">Request via WhatsApp ↗</a></div>
    <p className="note">Availability is subject to change. Your reservation is only confirmed after our admin replies. All times are shown in Phuket local time.</p></section>
    <footer>© Pilates LAB · Private Pilates Studio Rental · Pasak, Cherng Talay, Phuket</footer>
  </main>;
}
