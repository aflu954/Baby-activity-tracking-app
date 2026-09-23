/** A daily repeating calendar event, so the phone's own calendar sends the reminder. */
export function dailyReminderIcs(time: string, babyName: string, startDate: string, url: string): string {
  const [hh, mm] = time.split(':');
  const start = `${startDate.replaceAll('-', '')}T${hh}${mm}00`;
  const [y, mo, d] = startDate.split('-').map(Number);
  const endDate = new Date(y, mo - 1, d, Number(hh), Number(mm) + 20);
  const pad = (n: number) => String(n).padStart(2, '0');
  const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sbaby Play//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:sbaby-play-daily-${stamp}@sbaby`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:${esc(`Play time with ${babyName}`)}`,
    `DESCRIPTION:${esc(`Open today's checklist: ${url}`)}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(`Play time with ${babyName}`)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
