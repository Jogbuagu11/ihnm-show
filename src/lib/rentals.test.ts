import { describe, expect, it } from "vitest";
import { packPrice, quote, refundPct, pacific } from "./rentals";

describe("rental pricing", () => {
  it("podcast recording is $60/hr", () => expect(quote("podcast", 3, {})).toMatchObject({ total: 18000 }));
  it("podcast has a 2-hour minimum", () => expect(quote("podcast", 1, {})).toHaveProperty("error"));
  it("podcast package is $120/hr with 2-hour minimum", () => {
    expect(quote("package", 2, {})).toMatchObject({ total: 24000 });
    expect(quote("package", 1.5, {})).toHaveProperty("error");
  });
  it("half day is $300 and full day $500", () => {
    expect(quote("half_day", 4, {})).toMatchObject({ total: 30000 });
    expect(quote("full_day", 8, {})).toMatchObject({ total: 50000 });
  });
  it("deposit is 50% and security deposit $150", () => expect(quote("full_day", 8, {})).toMatchObject({ deposit: 25000, security: 15000 }));
  it("10-hour pack is 10% off ($540)", () => expect(packPrice()).toBe(54000));
});

describe("cancellation refunds", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  const inH = (h: number) => new Date(now.getTime() + h * 36e5);
  it("full refund 7+ days out", () => expect(refundPct(inH(168), now)).toBe(100));
  it("50% within 7 days", () => expect(refundPct(inH(100), now)).toBe(50));
  it("no refund within 48 hours", () => expect(refundPct(inH(47), now)).toBe(0));
});

it("pacific() converts wall-clock time", () => expect(pacific("2026-07-01", "10:00").toISOString()).toBe("2026-07-01T17:00:00.000Z"));
