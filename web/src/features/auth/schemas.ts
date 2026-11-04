import { z } from "zod";
import { PASSWORD_RULES } from "./password-rules";

const email = z.email("Enter a valid email address.").trim();

const newPassword = z
  .string()
  .refine((p) => PASSWORD_RULES.every((r) => r.test(p)), "Your password must meet all of the rules below.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z
  .object({ email, password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match." });

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match." });
