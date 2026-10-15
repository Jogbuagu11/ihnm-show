import { expect, it } from "vitest";
import { openSlots, shiftHours } from "./volunteers";

it("open spots = slots minus claims, never negative", () => {
  expect(openSlots(3, 1)).toBe(2);
  expect(openSlots(2, 5)).toBe(0);
});
it("shift hours from start/end", () =>
  expect(shiftHours({ starts_at: "2026-01-01T01:30:00Z", ends_at: "2026-01-01T05:30:00Z" })).toBe(
    4,
  ));
