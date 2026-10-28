import { google } from 'googleapis';
import { DateTime } from 'luxon';

const ZONE = 'Asia/Bangkok';
export type Slot = { start: string; end: string; available: boolean };

export async function getAvailability(date: string): Promise<Slot[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date');
  const start = DateTime.fromISO(date, { zone: ZONE });
  if (!start.isValid || start.toISODate() !== date) throw new Error('Invalid date');
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!email || !key || !calendarId) throw new Error('Calendar credentials not configured');

  const auth = new google.auth.JWT({email, key, scopes:['https://www.googleapis.com/auth/calendar.freebusy']});
  const calendar = google.calendar({version:'v3',auth});
  const response = await calendar.freebusy.query({requestBody:{
    timeMin:start.toUTC().toISO()!, timeMax:start.plus({days:1}).toUTC().toISO()!,
    timeZone:ZONE, items:[{id:calendarId}]
  }});
  const item = response.data.calendars?.[calendarId];
  if (!item || (item.errors && item.errors.length)) throw new Error('Unable to read calendar availability');
  const busy = (item.busy || []).map(b=>({
    start:DateTime.fromISO(b.start || '',{setZone:true}).toMillis(),
    end:DateTime.fromISO(b.end || '',{setZone:true}).toMillis()
  }));
  return Array.from({ length: 48 }, (_, index) => {
    const from = start.plus({ minutes: index * 30 });
    const to = from.plus({hours:1});
    const a=from.toMillis(), b=to.toMillis();
    return {start:from.toFormat('HH:mm'),end:to.toFormat('HH:mm'),
      available: !busy.some(x=>Number.isFinite(x.start)&&Number.isFinite(x.end)&&x.start<b&&x.end>a)};
  });
}
