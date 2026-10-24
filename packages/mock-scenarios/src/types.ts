export type ScenarioName =
  | "normal"
  | "empty-results"
  | "sold-out"
  | "delayed-response"
  | "temporary-error"
  | "stale-inventory"
  | "validation-error"
  | "booking-failure"
  | "booking-success";

export interface ScenarioConfig {
  delayMs?: number;
  temporaryErrorOperations?: string[];
  staleItemId?: string;
  validationField?: string;
  holdDurationMs?: number;
}

export const SCENARIO_NAMES: ScenarioName[] = [
  "normal",
  "empty-results",
  "sold-out",
  "delayed-response",
  "temporary-error",
  "stale-inventory",
  "validation-error",
  "booking-failure",
  "booking-success",
];

export interface ScenarioState {
  scenario: ScenarioName;
  config: ScenarioConfig;
  resetCount: number;
}