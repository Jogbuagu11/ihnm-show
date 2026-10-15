import { describe, expect, it } from "vitest";
import {
  countdownTo,
  parseCsv,
  toCsv,
  normalizeImportRow,
  readUrlAttribution,
  referralUrl,
  shareLinks,
  positionLabel,
  telHref,
} from "./waitlist";

const ORIGIN = "https://ihnmshow.com";

describe("referral links", () => {
  it("builds an absolute link with the code", () => {
    expect(referralUrl("ABC1234", ORIGIN)).toBe("https://ihnmshow.com/?ref=ABC1234");
  });
  it("does not double the slash", () => {
    expect(referralUrl("X", "https://ihnmshow.com/")).toBe("https://ihnmshow.com/?ref=X");
  });
  it("escapes the code", () => {
    expect(referralUrl("A&B", ORIGIN)).toBe("https://ihnmshow.com/?ref=A%26B");
  });
  it("points every share target at the referral link", () => {
    const l = shareLinks("CODE99", ORIGIN);
    const encoded = encodeURIComponent("https://ihnmshow.com/?ref=CODE99");
    expect(l.facebook).toContain(encoded);
    expect(l.x).toContain(encoded);
    expect(l.sms).toContain(encodeURIComponent("?ref=CODE99"));
    expect(l.whatsapp).toContain(encodeURIComponent("?ref=CODE99"));
    expect(l.email).toContain(encodeURIComponent("?ref=CODE99"));
  });
  it("uses the sms form that works on iOS and Android", () => {
    expect(shareLinks("C", ORIGIN).sms.startsWith("sms:?&body=")).toBe(true);
  });
});

describe("url attribution", () => {
  it("reads ref and utm params", () => {
    const a = readUrlAttribution("?ref=ABC&utm_source=ig&utm_campaign=launch");
    expect(a.ref).toBe("ABC");
    expect(a.utm_source).toBe("ig");
    expect(a.utm_campaign).toBe("launch");
  });
  it("works without the leading question mark", () => {
    expect(readUrlAttribution("ref=ZZ").ref).toBe("ZZ");
  });
  it("accepts r as a short alias", () => {
    expect(readUrlAttribution("?r=SHORT").ref).toBe("SHORT");
  });
  it("returns nulls when absent", () => {
    const a = readUrlAttribution("");
    expect(a.ref).toBeNull();
    expect(a.utm_medium).toBeNull();
  });
  it("caps absurdly long values", () => {
    expect(readUrlAttribution(`?ref=${"x".repeat(500)}`).ref).toHaveLength(120);
  });
});

describe("countdown", () => {
  const now = Date.parse("2026-10-14T00:00:00Z");
  it("is null with no date set, so the hero hides it", () => {
    expect(countdownTo(null, now)).toBeNull();
    expect(countdownTo(undefined, now)).toBeNull();
  });
  it("is null for an unparseable date", () => {
    expect(countdownTo("not a date", now)).toBeNull();
  });
  it("counts down", () => {
    const c = countdownTo("2026-10-16T03:04:05Z", now);
    expect(c).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5, done: false });
  });
  it("reports done once the date passes", () => {
    expect(countdownTo("2026-10-13T00:00:00Z", now)?.done).toBe(true);
  });
});

describe("position label", () => {
  it("reads like the brief", () => {
    expect(positionLabel(7)).toBe("You're #7 on the list.");
  });
  it("groups thousands", () => {
    expect(positionLabel(1234)).toBe("You're #1,234 on the list.");
  });
});

describe("tel href", () => {
  it("strips formatting", () => {
    expect(telHref("(408) 555-1234")).toBe("4085551234");
  });
  it("keeps a leading +", () => {
    expect(telHref("+1 408 555 1234")).toBe("+14085551234");
  });
  it("rejects junk", () => {
    expect(telHref("123")).toBeNull();
    expect(telHref(null)).toBeNull();
  });
});

describe("csv export", () => {
  it("quotes commas, quotes and newlines", () => {
    const csv = toCsv([{ a: 'He said "hi", loudly', b: "line1\nline2" }]);
    expect(csv).toContain('"He said ""hi"", loudly"');
    expect(csv).toContain('"line1\nline2"');
  });
  it("is empty for no rows", () => {
    expect(toCsv([])).toBe("");
  });
  it("honours an explicit column order", () => {
    expect(toCsv([{ a: 1, b: 2 }], ["b", "a"]).split("\r\n")[0]).toBe("b,a");
  });
  it("renders null and undefined as blank", () => {
    expect(toCsv([{ a: null, b: undefined }])).toBe("a,b\r\n,");
  });
});

describe("csv import", () => {
  it("parses a quoted field containing a comma", () => {
    const rows = parseCsv('email,name\na@b.com,"Doe, Jane"');
    expect(rows).toEqual([{ email: "a@b.com", name: "Doe, Jane" }]);
  });
  it("handles CRLF and a trailing newline", () => {
    expect(parseCsv("email\r\na@b.com\r\n")).toEqual([{ email: "a@b.com" }]);
  });
  it("handles escaped quotes", () => {
    expect(parseCsv('a\n"say ""hi"""')).toEqual([{ a: 'say "hi"' }]);
  });
  it("lowercases headers so column case does not matter", () => {
    expect(parseCsv("Email\nA@B.com")[0]?.["email"]).toBe("A@B.com");
  });
  it("skips blank lines", () => {
    expect(parseCsv("email\n\na@b.com\n\n")).toHaveLength(1);
  });
  it("returns nothing for an empty file", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("import row mapping", () => {
  it("maps Substack's export columns", () => {
    const r = normalizeImportRow({
      email: "A@B.COM",
      "first name": "Ada",
      "last name": "Lovelace",
    });
    expect(r.email).toBe("a@b.com");
    expect(r.first_name).toBe("Ada");
    expect(r.last_name).toBe("Lovelace");
  });
  it("splits a single full-name column", () => {
    const r = normalizeImportRow({ name: "Grace Brewster Hopper", email: "g@h.com" });
    expect(r.first_name).toBe("Grace");
    expect(r.last_name).toBe("Brewster Hopper");
  });
  it("maps an SMS tool export with only a number", () => {
    const r = normalizeImportRow({ "phone number": "408-555-0000", sms: "yes" });
    expect(r.phone).toBe("408-555-0000");
    expect(r.sms_opt_in).toBe(true);
    expect(r.email).toBeNull();
  });
  it("treats blanks as missing", () => {
    const r = normalizeImportRow({ email: "   ", phone: "" });
    expect(r.email).toBeNull();
    expect(r.phone).toBeNull();
  });
  it("reads several spellings of opt-in", () => {
    expect(normalizeImportRow({ sms_opt_in: "TRUE" }).sms_opt_in).toBe(true);
    expect(normalizeImportRow({ sms_opt_in: "1" }).sms_opt_in).toBe(true);
    expect(normalizeImportRow({ sms_opt_in: "no" }).sms_opt_in).toBe(false);
  });
});
