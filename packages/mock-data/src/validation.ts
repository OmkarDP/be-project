export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function required(value: unknown, message = "This field is required"): string | null {
  if (value === null || value === undefined || String(value).trim() === "") return message;
  return null;
}

export function validateSearchForm(values: Record<string, string>): ValidationResult {
  const errors: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    const err = required(value);
    if (err) errors[key] = err;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function isFutureOrToday(dateString: string): boolean {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d >= today;
}