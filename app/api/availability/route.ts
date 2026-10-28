import { NextRequest, NextResponse } from 'next/server';
import { getAvailability } from '../../../lib/calendar';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
  const date=req.nextUrl.searchParams.get('date')||'';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({error:'Invalid date'},{status:400});
  try {
    const slots=await getAvailability(date);
    return NextResponse.json({date,timezone:'Asia/Bangkok',slots},{headers:{'Cache-Control':'no-store'}});
  } catch(err){
    console.error('Availability request failed',err);
    return NextResponse.json({error:'Availability temporarily unavailable. Please contact admin.'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
