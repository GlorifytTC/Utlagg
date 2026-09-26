import { describe, it, expect } from "vitest";
import { formatDayLabel, formatListDate } from "@/lib/chat-format";

const now = new Date(2026, 8, 25, 14, 0); // Fri 25 Sep 2026

describe("chat date formatting", () => {
  it("list stamp: time today, yesterday label, weekday this week, date otherwise", () => {
    expect(formatListDate(new Date(2026, 8, 25, 9, 5), "sv", "Igår", now)).toBe("09:05");
    expect(formatListDate(new Date(2026, 8, 24, 23, 59), "sv", "Igår", now)).toBe("Igår");
    expect(formatListDate(new Date(2026, 8, 21, 10), "en", "Yesterday", now)).toBe("Mon");
    expect(formatListDate(new Date(2026, 8, 1, 10), "en", "Yesterday", now)).toContain("1 Sep");
    expect(formatListDate(new Date(2025, 8, 1, 10), "en", "Yesterday", now)).toContain("2025");
  });

  it("day divider: today / yesterday / full date", () => {
    expect(formatDayLabel(new Date(2026, 8, 25, 1), "en", "Today", "Yesterday", now)).toBe("Today");
    expect(formatDayLabel(new Date(2026, 8, 24, 1), "en", "Today", "Yesterday", now)).toBe("Yesterday");
    expect(formatDayLabel(new Date(2026, 8, 20, 1), "en", "Today", "Yesterday", now)).toContain("20 September");
  });
});
