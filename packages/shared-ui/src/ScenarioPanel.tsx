import React from "react";
import type { ScenarioName } from "@agentic/mock-scenarios";

export interface ScenarioPanelProps {
  platform: string;
  scenarios: ScenarioName[];
  current: ScenarioName;
  delayMs: number;
  onScenarioChange: (scenario: ScenarioName) => void;
  onDelayChange: (ms: number) => void;
  onReset: () => void;
}

export function ScenarioPanel({
  platform,
  scenarios,
  current,
  delayMs,
  onScenarioChange,
  onDelayChange,
  onReset,
}: ScenarioPanelProps): JSX.Element {
  return (
    <section
      aria-label={`${platform} test scenario panel`}
      data-testid="scenario-panel"
      style={{
        border: "1px dashed #888",
        padding: 12,
        marginTop: 16,
        borderRadius: 8,
        background: "#fafafa",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: 16 }}>Test Scenario Panel (dev only)</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <label htmlFor="scenario-select">
          Scenario
          <select
            id="scenario-select"
            data-testid="scenario-select"
            value={current}
            onChange={(e) => onScenarioChange(e.target.value as ScenarioName)}
            style={{ marginLeft: 8 }}
          >
            {scenarios.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="delay-input">
          Delay (ms)
          <input
            id="delay-input"
            data-testid="scenario-delay-input"
            type="number"
            min={0}
            value={delayMs}
            onChange={(e) => onDelayChange(Number(e.target.value))}
            style={{ marginLeft: 8, width: 90 }}
          />
        </label>
        <button type="button" data-testid="scenario-reset-button" onClick={onReset}>
          Reset scenario
        </button>
      </div>
    </section>
  );
}