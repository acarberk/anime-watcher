import { describe, expect, it } from "vitest";
import { authMessage, urlAuthError } from "@/lib/auth-errors";
import { resetSchema, signUpSchema } from "./schemas";

describe("signUpSchema", () => {
  const ok = { email: "a@b.co", password: "anime2026", confirm: "anime2026" };

  it("accepts a valid sign-up", () => {
    expect(signUpSchema.safeParse(ok).success).toBe(true);
  });

  it.each([
    ["short", { ...ok, password: "a1", confirm: "a1" }],
    ["no digit", { ...ok, password: "animeanime", confirm: "animeanime" }],
    ["no letter", { ...ok, password: "12345678", confirm: "12345678" }],
    ["mismatch", { ...ok, confirm: "anime2027" }],
    ["bad email", { ...ok, email: "nope" }],
  ])("rejects %s", (_, v) => {
    expect(signUpSchema.safeParse(v).success).toBe(false);
  });

  it("counts non-ASCII letters as letters", () => {
    expect(resetSchema.safeParse({ password: "şğüçöı12", confirm: "şğüçöı12" }).success).toBe(true);
  });
});

describe("auth errors", () => {
  it("maps known codes and hides unknown internals", () => {
    expect(authMessage({ code: "invalid_credentials", message: "x" })).toMatch(/Incorrect/);
    expect(authMessage({ code: "something_new", message: "stack trace" })).not.toContain("stack");
  });

  it("reads redirect errors from query or hash", () => {
    expect(urlAuthError({ search: "?error_code=otp_expired&error_description=x", hash: "" })?.code).toBe("otp_expired");
    expect(urlAuthError({ search: "", hash: "#error=access_denied&error_code=otp_expired" })?.code).toBe("otp_expired");
    expect(urlAuthError({ search: "?code=abc", hash: "" })).toBeNull();
  });
});
