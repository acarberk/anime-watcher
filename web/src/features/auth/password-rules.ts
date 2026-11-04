export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "At least one letter", test: (p: string) => /\p{L}/u.test(p) },
  { label: "At least one number", test: (p: string) => /\d/.test(p) },
] as const;
