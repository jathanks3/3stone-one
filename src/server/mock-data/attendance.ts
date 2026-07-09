import type { AttendanceRecord, Employee } from "@/types";

export const ATTENDANCE_WORKDAYS = [
  "2026-06-29",
  "2026-06-30",
  "2026-07-01",
  "2026-07-02",
  "2026-07-03",
  "2026-07-06",
  "2026-07-07",
];

export const ATTENDANCE_TODAY = "2026-07-07";

function seedFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function minutesToClock(totalMinutes: number) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const h24 = Math.floor(clamped / 60);
  const m = clamped % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Deterministically generates a believable week of clock-in/out records for
 * any employee roster, so every industry gets real attendance data without
 * hand-authoring it per person. The first employee in the roster tends to run
 * long weeks (overtime example), and the last "away" employee misses today's
 * clock-in (missed-clock-in example) — deterministic, not random, so the same
 * roster always produces the same story.
 */
export function generateAttendanceForEmployees(employees: Employee[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const awayIndex = employees.findIndex((e) => e.status === "away");

  employees.forEach((employee, index) => {
    ATTENDANCE_WORKDAYS.forEach((date) => {
      const seed = seedFromString(`${employee.id}_${date}`);
      const isToday = date === ATTENDANCE_TODAY;
      const missedToday = isToday && index === awayIndex;

      if (missedToday) {
        records.push({
          id: `att_${employee.id}_${date}`,
          employeeId: employee.id,
          date,
          clockIn: null,
          clockOut: null,
          hoursWorked: 0,
        });
        return;
      }

      const runsLong = index === 0;
      const startMinutes = 7 * 60 + (seed % 45);
      const lengthMinutes = (runsLong ? 9.5 : 8) * 60 + ((seed % 40) - 20);
      const endMinutes = startMinutes + lengthMinutes;
      const stillClockedIn = isToday && seed % 3 === 0;

      records.push({
        id: `att_${employee.id}_${date}`,
        employeeId: employee.id,
        date,
        clockIn: minutesToClock(startMinutes),
        clockOut: stillClockedIn ? null : minutesToClock(endMinutes),
        hoursWorked: stillClockedIn ? 0 : Math.round((lengthMinutes / 60) * 10) / 10,
      });
    });
  });

  return records;
}

export function getWeeklyHours(employeeId: string, records: AttendanceRecord[]) {
  return Math.round(
    records.filter((r) => r.employeeId === employeeId).reduce((sum, r) => sum + r.hoursWorked, 0) * 10
  ) / 10;
}

export function getTodayRecord(employeeId: string, records: AttendanceRecord[]) {
  return records.find((r) => r.employeeId === employeeId && r.date === ATTENDANCE_TODAY) ?? null;
}
