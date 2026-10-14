import { describe, it, expect } from "vitest";
import { DEFAULT_FUNDRAISING_GOAL_CENTS, invoiceStatus, needsRenewal, rentCoveredPct, toCsv, lastMonths } from "./finance";

describe("finance rules", () => {
  it("default fundraising goal is $21,000", () => expect(DEFAULT_FUNDRAISING_GOAL_CENTS).toBe(2_100_000));
  it("rent covered meter compares income to operating costs", () => {
    expect(rentCoveredPct(150_000, 300_000)).toBe(50);
    expect(rentCoveredPct(400_000, 300_000)).toBe(100);
  });
  it("sent invoice past due date is overdue; paid is not", () => {
    expect(invoiceStatus({ status: "sent", due_on: "2026-01-01" }, "2026-02-01")).toBe("overdue");
    expect(invoiceStatus({ status: "paid", due_on: "2026-01-01" }, "2026-02-01")).toBe("paid");
  });
  it("renewal reminder within 30 days of end date", () => {
    const today = new Date("2026-03-01T00:00:00Z");
    expect(needsRenewal("2026-03-25", today)).toBe(true);
    expect(needsRenewal("2026-04-15", today)).toBe(false);
  });
  it("12-month trend ends with the current month", () => {
    const m = lastMonths(12, new Date("2026-10-14T00:00:00Z"));
    expect(m).toHaveLength(12);
    expect(m[0]).toBe("2025-11");
    expect(m[11]).toBe("2026-10");
  });
  it("CSV escapes commas and quotes", () => expect(toCsv([{ a: 'x,"y"', b: 1 }])).toBe('a,b\n"x,""y""",1'));
});
