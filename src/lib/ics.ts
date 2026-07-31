import type { CalendarEvent } from "@/types";

// Real, standards-based calendar interop - not a fake "connect your
// account" button. A .ics file is the actual file format Google
// Calendar, Apple Calendar, and Outlook all import natively with zero
// setup; the Google URL below is Google's own public "quick add event"
// scheme. Neither needs API credentials or a backend. A true two-way
// sync (changes here reflected automatically in someone's Google/Apple
// account) needs a real Google/Apple developer account, OAuth, and a
// backend token store - genuinely separate, much larger scope, not
// something to fake with a button that doesn't actually do anything.

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// event.time is always 24h "HH:MM" (see server/mock-data/calendar.ts).
// Produces a "floating" local date-time with no timezone marker -
// every calendar app interprets that using its own local timezone at
// import time, which is the right behavior for "this happens at 10am
// wherever I am."
function toIcsDateTime(date: string, time: string): string {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function addOneHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + 60) % (24 * 60);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function nowIcsTimestamp(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function eventToVevent(event: CalendarEvent): string {
  return [
    "BEGIN:VEVENT",
    `UID:${event.id}@3stoneone.app`,
    `DTSTAMP:${nowIcsTimestamp()}`,
    `DTSTART:${toIcsDateTime(event.date, event.time)}`,
    `DTEND:${toIcsDateTime(event.date, addOneHour(event.time))}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    "END:VEVENT",
  ].join("\r\n");
}

// A single event or a whole calendar both produce a valid .ics -
// VCALENDAR just wraps however many VEVENTs are passed in.
export function buildIcsCalendar(events: CalendarEvent[], calendarName: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//3Stone One//Calendar//EN",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    ...events.map(eventToVevent),
    "END:VCALENDAR",
  ].join("\r\n");
}

export function googleCalendarAddUrl(event: CalendarEvent): string {
  const start = toIcsDateTime(event.date, event.time);
  const end = toIcsDateTime(event.date, addOneHour(event.time));
  const params = new URLSearchParams({ action: "TEMPLATE", text: event.title, dates: `${start}/${end}` });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
