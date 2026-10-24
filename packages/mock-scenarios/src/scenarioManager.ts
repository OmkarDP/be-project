import type { ScenarioConfig, ScenarioName, ScenarioState } from "./types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ScenarioManager {
  private scenario: ScenarioName = "normal";
  private config: ScenarioConfig = {};
  private resetCount = 0;
  private readonly failedOnce = new Set<string>();
  private readonly operationCounts = new Map<string, number>();

  setScenario(scenario: ScenarioName, config: ScenarioConfig = {}): void {
    this.scenario = scenario;
    this.config = { ...config };
    this.failedOnce.clear();
    this.operationCounts.clear();
  }

  getScenario(): ScenarioName {
    return this.scenario;
  }

  getConfig(): ScenarioConfig {
    return { ...this.config };
  }

  getState(): ScenarioState {
    return { scenario: this.scenario, config: { ...this.config }, resetCount: this.resetCount };
  }

  reset(): void {
    this.scenario = "normal";
    this.config = {};
    this.failedOnce.clear();
    this.operationCounts.clear();
    this.resetCount += 1;
  }

  async applyDelay(): Promise<void> {
    if (this.scenario === "delayed-response") {
      await sleep(this.config.delayMs ?? 1000);
    }
  }

  shouldFailOnce(operation: string): boolean {
    if (this.scenario !== "temporary-error") return false;
    const ops = this.config.temporaryErrorOperations ?? ["search"];
    if (!ops.includes(operation)) return false;
    if (this.failedOnce.has(operation)) return false;
    this.failedOnce.add(operation);
    return true;
  }

  isEmptyResults(): boolean {
    return this.scenario === "empty-results";
  }

  isSoldOut(): boolean {
    return this.scenario === "sold-out";
  }

  isStaleItem(itemId?: string): boolean {
    if (this.scenario !== "stale-inventory") return false;
    if (!this.config.staleItemId) return true;
    return itemId === this.config.staleItemId;
  }

  isValidationError(): boolean {
    return this.scenario === "validation-error";
  }

  bookingSucceeds(): boolean {
    if (this.scenario === "booking-failure") return false;
    if (this.scenario === "booking-success") return true;
    return true;
  }

  nextOperationCount(operation: string): number {
    const n = (this.operationCounts.get(operation) ?? 0) + 1;
    this.operationCounts.set(operation, n);
    return n;
  }
}

export function createScenarioManager(): ScenarioManager {
  return new ScenarioManager();
}