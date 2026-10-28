# Pilates LAB – Studio Availability

A simple read-only 24-hour availability viewer. Customers request a booking via WhatsApp; admins continue managing bookings in Google Calendar.

## 1. Install

Requires Node.js 20+. Run:

```bash
npm install
cp .env.example .env.local
```

## 2. Google Calendar setup (one-time)

1. Sign in to [Google Cloud Console](https://console.cloud.google.com/) and create/select a project.
2. Enable **Google Calendar API** in APIs & Services.
3. Create a **service account** in IAM & Admin > Service Accounts. Generate a JSON key (keep it private). Some organizations restrict service-account key creation; in that case use a server-side OAuth integration instead.
4. Sign in to Google Calendar as **pilateslab.hkt@gmail.com**. In Settings > Settings for my calendars, select the calendar containing ALL studio reservations. Under **Share with specific people or groups**, share it with the service-account email, giving **See only free/busy (hide details)** access. Do not make the calendar public. Note: depending on account sharing restrictions, a service account may not be eligible; use server-side OAuth if sharing is unavailable.
5. Copy the calendar ID from **Integrate calendar** into `GOOGLE_CALENDAR_ID`. The ID might be an email address or a long `@group.calendar.google.com` string; verify rather than assuming.
6. Fill in `.env.local` with the service-account `client_email` and `private_key`. The key stays server-side. Never place it in client code or commit it.
7. In Google Calendar, ensure every reservation blocks time as **Busy**, including recurring bookings. Events marked **Free** will not block availability.

## 3. Run

```bash
npm run dev
```

Open http://localhost:3000. Test an existing busy period, a free period, and a booking spanning midnight. On errors, the website does not display unverified free slots.

## 4. Deploy

Deploy to Vercel or another Next.js-capable host. Add the three environment variables to the host's **server-side** environment configuration. Use HTTPS and verify the deployed site before sharing. Attach a subdomain such as `booking.pilateslabphuket.com` if desired.

## How availability works

- Google Calendar FreeBusy API is queried on the server only, with no-store caching.
- The browser refreshes every 60 seconds and whenever the date changes.
- Slots cover 00:00–24:00 in `Asia/Bangkok`. Each hourly slot is unavailable if any portion overlaps a busy event.
- Customer can request 1–8 consecutive hours; selections cannot cross midnight in this MVP (midnight is represented as 00:00 the following day).
- The last hour starts at 23:00 and ends at 00:00 next day.
- WhatsApp requests are NOT bookings. Admin must recheck availability and confirm, then add the booking to Google Calendar.
- No names or event details are exposed through the API.

## Important operational notes

- If the studio has multiple calendars, aggregate ALL busy intervals before allowing reservations. This starter project assumes a single complete calendar.
- Availability refresh is near-real-time, not instantaneous. A slot can be taken between viewing and messaging the admin.
- The UI prevents selection of hours already started (Thailand time), but the browser can remain open past the hour boundary. Admin confirmation is authoritative.
- Do not share Google credentials or service-account JSON files in chat or a public repository.
