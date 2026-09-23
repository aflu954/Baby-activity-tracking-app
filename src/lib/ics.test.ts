import { describe, expect, it } from 'vitest';
import { dailyReminderIcs } from './ics';

describe('dailyReminderIcs', () => {
  it('creates a daily repeating floating-time event with an alarm', () => {
    const ics = dailyReminderIcs('19:30', 'Mila, Rose', '2026-09-23', 'https://example.com/');
    expect(ics).toContain('DTSTART:20260923T193000');
    expect(ics).toContain('DTEND:20260923T195000');
    expect(ics).toContain('RRULE:FREQ=DAILY');
    expect(ics).toContain('SUMMARY:Play time with Mila\\, Rose');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
  });

  it('rolls the end time over midnight', () => {
    expect(dailyReminderIcs('23:50', 'A', '2026-12-31', 'x')).toContain('DTEND:20270101T001000');
  });
});
