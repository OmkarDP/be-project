let offsetMs = 0;
let fixedNow: number | null = null;

export function now(): number {
  return fixedNow ?? Date.now() + offsetMs;
}

export function advance(ms: number): void {
  if (fixedNow !== null) fixedNow += ms;
  else offsetMs += ms;
}

export function setNow(ms: number): void {
  fixedNow = ms;
}

export function resetClock(): void {
  offsetMs = 0;
  fixedNow = null;
}
