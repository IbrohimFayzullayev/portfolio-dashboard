import { describe, expect, it } from "vitest";

import {
  ago,
  failureRate,
  finbotName,
  joinedVia,
  type FinbotUser,
} from "./finbot-admin";

const base = {
  first_name: "Ali",
  username: "",
  entries_30d: 0,
  failures_30d: 0,
} as unknown as FinbotUser;

describe("finbot admin helpers", () => {
  it("names people the same way everywhere", () => {
    expect(finbotName({ first_name: "Ali", username: "ali_t" })).toBe(
      "Ali (@ali_t)",
    );
    expect(finbotName({ first_name: " ", username: "" })).toBe("Ismsiz");
  });

  it("says how someone got in", () => {
    expect(joinedVia("invite:abc")).toBe("taklif havolasi");
    expect(joinedVia("approved")).toBe("so'rov orqali");
    expect(joinedVia("")).toBe("-");
  });

  it("measures how often the bot could not read a message", () => {
    expect(failureRate(base)).toBeNull();
    expect(failureRate({ ...base, entries_30d: 8, failures_30d: 2 })).toBe(20);
  });

  it("speaks Uzbek about time", () => {
    const now = new Date("2026-10-29T12:00:00Z");
    expect(ago("2026-10-29T11:59:40Z", now)).toBe("hozir");
    expect(ago("2026-10-29T11:30:00Z", now)).toBe("30 daqiqa oldin");
    expect(ago("2026-10-29T07:00:00Z", now)).toBe("5 soat oldin");
    expect(ago("2026-10-25T12:00:00Z", now)).toBe("4 kun oldin");
  });
});
