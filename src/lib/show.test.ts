import { describe, it, expect } from "vitest";
import { shuttleLoops } from "./show";

describe("shuttle loops", () => {
  it("default schedule runs every 15 minutes from 6:00 to 6:45 PM", () => {
    expect(shuttleLoops("18:00", "18:45", 15)).toEqual(["18:00", "18:15", "18:30", "18:45"]);
  });
});
