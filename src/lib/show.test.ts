import { describe, it, expect } from "vitest";
import { shuttleLoops } from "./show";

describe("shuttle loops", () => {
  it("default schedule runs every 15 minutes from 6:00 to 6:45 PM", () => {
    expect(shuttleLoops("18:00", "18:45", 15)).toEqual(["18:00", "18:15", "18:30", "18:45"]);
  });
});

import { effectiveCapacity as ec } from "./show";
describe("over-booking", () => {
  it("adds 30% extra free tickets by default (20 → 26)", () => expect(ec(20, 30)).toBe(26));
  it("rounds extra seats up", () => expect(ec(15, 30)).toBe(20));
  it("0% means no extra", () => expect(ec(20, 0)).toBe(20));
});
