import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IRCTC_STATIONS,
  IRCTC_TRAINS,
  formatCurrency,
  formatDate,
} from "@agentic/mock-data";
import type { Station, Train, TrainClassAvailability } from "@agentic/mock-data";
import {
  MockEnvironmentBanner,
  ScenarioPanel,
  LoadingSpinner,
  ErrorAlert,
  Toast,
} from "@agentic/shared-ui";
import type { ToastMessage } from "@agentic/shared-ui";
import type { ScenarioName } from "@agentic/mock-scenarios";

interface SearchParams {
  fromName: string;
  fromCode: string;
  toName: string;
  toCode: string;
  date: string;
  travelClass: string;
  quota: string;
  passengers: number;
}

interface Passenger {
  id: string;
  name: string;
  age: string;
  gender: string;
  berth: string;
}

interface BookingRecord {
  bookingId: string;
  pnr: string;
  platform: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  currency: string;
  trainId: string;
  classType: string;
  passengers: Passenger[];
  search: SearchParams;
}

interface FlowState {
  search?: SearchParams;
  results?: Train[];
  selection?: { train: Train; classType: string };
  passengers?: Passenger[];
  booking?: BookingRecord;
}

const CLASSES = [
  { value: "ALL", label: "All Classes" },
  { value: "SL", label: "Sleeper" },
  { value: "3A", label: "AC 3 Tier" },
  { value: "2A", label: "AC 2 Tier" },
  { value: "1A", label: "AC First Class" },
];

const QUOTAS = [
  { value: "GN", label: "General" },
  { value: "TQ", label: "Tatkal (simulation only)" },
  { value: "SS", label: "Senior Citizen (simulation only)" },
];

const BERTHS = [
  "No Preference",
  "Lower",
  "Middle",
  "Upper",
  "Side Lower",
  "Side Upper",
];

const GENDERS = ["Male", "Female", "Other"];

const SCENARIOS: ScenarioName[] = [
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

const FLOW_KEY = "railbook-flow";

function loadFlow(): FlowState {
  try {
    const raw = sessionStorage.getItem(FLOW_KEY);
    return raw ? (JSON.parse(raw) as FlowState) : {};
  } catch {
    return {};
  }
}

function saveFlow(state: FlowState) {
  try {
    sessionStorage.setItem(FLOW_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function todayLocalIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parts = value.split("-").map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const d = parts[2] ?? 0;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

function isFutureOrToday(value: string): boolean {
  const dt = parseIsoDate(value);
  if (!dt) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dt.setHours(0, 0, 0, 0);
  return dt >= today;
}

function classLabel(code: string): string {
  return CLASSES.find((c) => c.value === code)?.label ?? code;
}

function quotaLabel(code: string): string {
  return QUOTAS.find((q) => q.value === code)?.label ?? code;
}

function trainClasses(train: Train): TrainClassAvailability[] {
  if (train.classes && train.classes.length > 0) return train.classes;
  return [
    {
      classType: train.classType,
      price: train.price,
      availableSeats: train.availableSeats,
      status: train.status === "sold-out" ? "sold-out" : "available",
    },
  ];
}

function durationText(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function departurePeriod(time: string): string {
  const hour = Number(time.split(":")[0] ?? 0);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

function StationField({
  label,
  inputTestId,
  optionTestId,
  value,
  selected,
  onInputChange,
  onSelect,
  error,
}: {
  label: string;
  inputTestId: string;
  optionTestId: string;
  value: string;
  selected: Station | null;
  onInputChange: (v: string) => void;
  onSelect: (s: Station) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    if (selected && value === selected.name) return [];
    return IRCTC_STATIONS.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.city.toLowerCase().includes(q),
    );
  }, [value, selected]);

  useEffect(() => {
    setHighlight(0);
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(suggestions.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && suggestions.length > 0) {
        e.preventDefault();
        const chosen = suggestions[highlight] ?? suggestions[0];
        if (chosen) {
          onSelect(chosen);
          setOpen(false);
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="station-field" style={{ position: "relative" }}>
      <label>
        {label}
        <input
          data-testid={inputTestId}
          value={value}
          onChange={(e) => {
            onInputChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
      </label>
      {error && <span className="error" role="alert">{error}</span>}
      {open && value.trim() !== "" && (
        <div
          className="station-suggestions"
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 20,
            background: "#fff",
            border: "1px solid #ccc",
            width: "100%",
            maxHeight: 220,
            overflow: "auto",
          }}
        >
          {suggestions.length === 0 ? (
            <div className="no-match" style={{ padding: 8 }}>No matching stations</div>
          ) : (
            suggestions.map((s, idx) => (
              <div
                key={s.code}
                data-testid={optionTestId}
                role="option"
                aria-selected={idx === highlight}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(s);
                  setOpen(false);
                }}
                style={{
                  padding: "8px 10px",
                  cursor: "pointer",
                  background: idx === highlight ? "#e3f2fd" : "#fff",
                }}
              >
                {s.name} ({s.code})
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [flow, setFlowState] = useState<FlowState>(loadFlow);
  const [scenario, setScenario] = useState<ScenarioName>("normal");
  const [delayMs, setDelayMs] = useState(1000);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const setFlow = useCallback((updater: (prev: FlowState) => FlowState) => {
    setFlowState((prev) => {
      const next = updater(prev);
      saveFlow(next);
      return next;
    });
  }, []);

  const navigate = useCallback((to: string) => {
    window.history.pushState({}, "", to);
    setPath(to);
  }, []);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function pushToast(message: string, type: ToastMessage["type"] = "info") {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }

  async function loadScenario() {
    try {
      const res = await fetch("/api/scenario");
      const data = await res.json();
      setScenario(data.scenario);
      setDelayMs(data.config?.delayMs ?? 1000);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadScenario();
  }, []);

  async function handleScenarioChange(next: ScenarioName) {
    setScenario(next);
    await fetch("/api/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: next, config: { delayMs } }),
    });
  }

  async function handleDelayChange(ms: number) {
    setDelayMs(ms);
    await fetch("/api/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, config: { delayMs: ms } }),
    });
  }

  async function handleReset() {
    const res = await fetch("/api/reset", { method: "POST" });
    const data = await res.json();
    setScenario(data.scenario);
    setDelayMs(1000);
    setFlow(() => ({}));
    pushToast("Scenario reset to normal", "success");
  }

  // HOME
  if (path === "/" || path === "") {
    return (
      <HomePage
        flow={flow}
        setFlow={setFlow}
        navigate={navigate}
        scenario={scenario}
        delayMs={delayMs}
        toasts={toasts}
        setToasts={setToasts}
        pushToast={pushToast}
        handleScenarioChange={handleScenarioChange}
        handleDelayChange={handleDelayChange}
        handleReset={handleReset}
      />
    );
  }
  if (path === "/trains") {
    return (
      <ResultsPage
        flow={flow}
        setFlow={setFlow}
        navigate={navigate}
        pushToast={pushToast}
      />
    );
  }
  if (path === "/passengers") {
    return (
      <PassengersPage
        flow={flow}
        setFlow={setFlow}
        navigate={navigate}
        pushToast={pushToast}
      />
    );
  }
  if (path === "/review") {
    return (
      <ReviewPage
        flow={flow}
        setFlow={setFlow}
        navigate={navigate}
        pushToast={pushToast}
      />
    );
  }
  if (path === "/payment") {
    return (
      <PaymentPage
        flow={flow}
        setFlow={setFlow}
        navigate={navigate}
        pushToast={pushToast}
      />
    );
  }
  if (path.startsWith("/confirmation/")) {
    const bookingId = decodeURIComponent(path.replace("/confirmation/", ""));
    return (
      <ConfirmationPage
        bookingId={bookingId}
        flow={flow}
        setFlow={setFlow}
        navigate={navigate}
      />
    );
  }
  if (path === "/bookings") {
    return <BookingsPage navigate={navigate} />;
  }
  // fallback
  return (
    <div>
      <MockEnvironmentBanner platform="RailBook Lab" />
      <div className="container">
        <p>Page not found.</p>
        <button onClick={() => navigate("/")}>Go home</button>
      </div>
    </div>
  );
}

function HomePage({
  flow,
  setFlow,
  navigate,
  scenario,
  delayMs,
  toasts,
  setToasts,
  pushToast,
  handleScenarioChange,
  handleDelayChange,
  handleReset,
}: {
  flow: FlowState;
  setFlow: (u: (p: FlowState) => FlowState) => void;
  navigate: (to: string) => void;
  scenario: ScenarioName;
  delayMs: number;
  toasts: ToastMessage[];
  setToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>>;
  pushToast: (m: string, t?: ToastMessage["type"]) => void;
  handleScenarioChange: (s: ScenarioName) => void;
  handleDelayChange: (ms: number) => void;
  handleReset: () => void;
}) {
  const defaultFrom = IRCTC_STATIONS.find((s) => s.name === "Aurora Central") ?? IRCTC_STATIONS[0]!;
  const defaultTo = IRCTC_STATIONS.find((s) => s.name === "Boreal Junction") ?? IRCTC_STATIONS[1]!;

  const [fromText, setFromText] = useState(flow.search?.fromName ?? defaultFrom.name);
  const [fromStation, setFromStation] = useState<Station | null>(
    flow.search ? IRCTC_STATIONS.find((s) => s.code === flow.search?.fromCode) ?? null : defaultFrom,
  );
  const [toText, setToText] = useState(flow.search?.toName ?? defaultTo.name);
  const [toStation, setToStation] = useState<Station | null>(
    flow.search ? IRCTC_STATIONS.find((s) => s.code === flow.search?.toCode) ?? null : defaultTo,
  );
  const [date, setDate] = useState(flow.search?.date ?? "2026-10-30");
  const [travelClass, setTravelClass] = useState(flow.search?.travelClass ?? "ALL");
  const [quota, setQuota] = useState(flow.search?.quota ?? "GN");
  const [passengerCount, setPassengerCount] = useState(flow.search?.passengers ?? 1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!fromStation) next.from = "Select a valid origin station";
    if (!toStation) next.to = "Select a valid destination station";
    if (fromStation && toStation && fromStation.code === toStation.code) {
      next.to = "Origin and destination must differ";
    }
    if (!isFutureOrToday(date)) next.date = "Please enter a valid future date";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchError(null);
    if (!validate()) return;
    setLoading(true);
    const search: SearchParams = {
      fromName: fromStation!.name,
      fromCode: fromStation!.code,
      toName: toStation!.name,
      toCode: toStation!.code,
      date,
      travelClass,
      quota,
      passengers: Number(passengerCount),
    };
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: search.fromName,
          to: search.toName,
          date: search.date,
          travelClass: search.travelClass,
          quota: search.quota,
          passengers: search.passengers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? {});
        setSearchError(data.message ?? "Search failed");
        pushToast(data.message ?? "Search failed", "error");
        return;
      }
      setFlow((prev) => ({ ...prev, search, results: data.results ?? [], selection: undefined, passengers: undefined }));
      navigate("/trains");
    } catch {
      setSearchError("Unable to reach mock service.");
      pushToast("Unable to reach mock service.", "error");
    } finally {
      setLoading(false);
    }
  }

  function swapStations() {
    const ft = fromText;
    const fs = fromStation;
    setFromText(toText);
    setFromStation(toStation);
    setToText(ft);
    setToStation(fs);
  }

  return (
    <div>
      <MockEnvironmentBanner platform="RailBook Lab" />
      <div className="container">
        <header className="top-nav">
          <div className="brand">RailBook Lab</div>
          <nav>
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/bookings")}>Bookings</button>
          </nav>
        </header>
        <div className="simulation-banner" data-testid="simulation-banner">
          SIMULATION ONLY — NO REAL RAILWAY BOOKINGS
        </div>
        <h1>Railway Ticket Search</h1>
        <p className="muted">Simulated railway reservation experience. All data is fictional.</p>

        <div className="card">
          <form data-testid="rail-search-form" onSubmit={handleSearch} aria-label="Search trains">
            <div className="grid">
              <StationField
                label="From station"
                inputTestId="rail-from-input"
                optionTestId="rail-from-option"
                value={fromText}
                selected={fromStation}
                onInputChange={(v) => {
                  setFromText(v);
                  setFromStation(null);
                }}
                onSelect={(s) => {
                  setFromStation(s);
                  setFromText(s.name);
                }}
                error={errors.from}
              />
              <button
                type="button"
                data-testid="rail-swap-stations"
                onClick={swapStations}
                aria-label="Swap origin and destination"
                className="swap-btn"
              >
                ⇄
              </button>
              <StationField
                label="To station"
                inputTestId="rail-to-input"
                optionTestId="rail-to-option"
                value={toText}
                selected={toStation}
                onInputChange={(v) => {
                  setToText(v);
                  setToStation(null);
                }}
                onSelect={(s) => {
                  setToStation(s);
                  setToText(s.name);
                }}
                error={errors.to}
              />
              <label>
                Journey date
                <input
                  data-testid="rail-date-input"
                  type="date"
                  value={date}
                  min={todayLocalIso()}
                  onChange={(e) => setDate(e.target.value)}
                  aria-label="Journey date"
                />
                {errors.date && <span className="error" role="alert">{errors.date}</span>}
              </label>
              <label>
                Travel class
                <select
                  data-testid="rail-class-select"
                  value={travelClass}
                  onChange={(e) => setTravelClass(e.target.value)}
                  aria-label="Travel class"
                >
                  {CLASSES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quota
                <select
                  data-testid="rail-quota-select"
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  aria-label="Quota"
                >
                  {QUOTAS.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Passenger count
                <input
                  data-testid="rail-passenger-count"
                  type="number"
                  min={1}
                  max={6}
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(Number(e.target.value))}
                  aria-label="Passenger count"
                />
              </label>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button type="submit" data-testid="rail-search-submit" disabled={loading}>
                {loading ? "Searching…" : "Search Trains"}
              </button>
            </div>
            {loading && <LoadingSpinner label="Searching trains" />}
            <ErrorAlert message={searchError} />
          </form>
        </div>

        <ScenarioPanel
          platform="RailBook Lab"
          scenarios={SCENARIOS}
          current={scenario}
          delayMs={delayMs}
          onScenarioChange={handleScenarioChange}
          onDelayChange={handleDelayChange}
          onReset={handleReset}
        />
      </div>
      <Toast toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}

function ResultsPage({
  flow,
  setFlow,
  navigate,
  pushToast,
}: {
  flow: FlowState;
  setFlow: (u: (p: FlowState) => FlowState) => void;
  navigate: (to: string) => void;
  pushToast: (m: string, t?: ToastMessage["type"]) => void;
}) {
  useEffect(() => {
    if (!flow.search) navigate("/");
  }, [flow.search, navigate]);

  const [results, setResults] = useState<Train[]>(flow.results ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterClass, setFilterClass] = useState("ALL");
  const [maxFare, setMaxFare] = useState("");
  const [sortBy, setSortBy] = useState("departure");

  useEffect(() => {
    if (flow.results) setResults(flow.results);
  }, [flow.results]);

  const search = flow.search;

  const displayed = useMemo(() => {
    let list = [...results];
    if (filterPeriod !== "all") list = list.filter((t) => departurePeriod(t.departure) === filterPeriod);
    if (filterClass !== "ALL") {
      list = list.filter((t) => trainClasses(t).some((c) => c.classType === filterClass));
    }
    if (maxFare.trim() !== "") {
      const max = Number(maxFare);
      if (!Number.isNaN(max)) {
        list = list.filter((t) => Math.min(...trainClasses(t).map((c) => c.price)) <= max);
      }
    }
    list.sort((a, b) => {
      if (sortBy === "departure") return a.departure.localeCompare(b.departure);
      if (sortBy === "duration") return a.durationMinutes - b.durationMinutes;
      if (sortBy === "fare") {
        return Math.min(...trainClasses(a).map((c) => c.price)) - Math.min(...trainClasses(b).map((c) => c.price));
      }
      return 0;
    });
    return list;
  }, [results, filterPeriod, filterClass, maxFare, sortBy]);

  async function selectTrain(train: Train) {
    const cls = selectedClass[train.id];
    if (!cls) {
      pushToast("Select a class before continuing", "error");
      return;
    }
    try {
      const res = await fetch("/api/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainId: train.id, classType: cls }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast(data.message ?? "Train unavailable", "error");
        setError(data.message ?? "Train unavailable");
        return;
      }
      setFlow((prev) => ({
        ...prev,
        selection: { train, classType: cls },
      }));
      navigate("/passengers");
    } catch {
      pushToast("Unable to reach mock service.", "error");
    }
  }

  if (!search) return null;

  return (
    <div>
      <MockEnvironmentBanner platform="RailBook Lab" />
      <div className="container">
        <header className="top-nav">
          <div className="brand">RailBook Lab</div>
          <nav>
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/bookings")}>Bookings</button>
          </nav>
        </header>
        <div className="simulation-banner">SIMULATION ONLY — NO REAL RAILWAY BOOKINGS</div>
        <h1>Train Results</h1>
        <p className="muted">
          {search.fromName} → {search.toName} on {formatDate(search.date)} · {classLabel(search.travelClass)} · {quotaLabel(search.quota)}
        </p>

        <div className="card filters">
          <label>
            Departure period
            <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
              <option value="all">All</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
          </label>
          <label>
            Class
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              {CLASSES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Max fare
            <input type="number" value={maxFare} onChange={(e) => setMaxFare(e.target.value)} />
          </label>
          <label>
            Sort by
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="departure">Departure time</option>
              <option value="duration">Duration</option>
              <option value="fare">Fare</option>
            </select>
          </label>
        </div>

        {loading && <div data-testid="rail-loading">Loading…</div>}
        {!loading && displayed.length === 0 && <div data-testid="rail-no-results">No trains found for this search.</div>}

        <section data-testid="rail-results" className="results">
          {displayed.map((train) => (
            <article key={train.id} data-testid="rail-result-card" data-train-id={train.id} className="result-card">
              <div className="train-header">
                <span data-testid="rail-train-number" className="train-number">{train.number}</span>
                <span data-testid="rail-train-name" className="train-name">{train.name}</span>
              </div>
              <div className="train-route">
                {train.from} → {train.to}
              </div>
              <div className="train-times">
                <span data-testid="rail-departure-time">Departs {train.departure}</span>
                <span data-testid="rail-arrival-time">Arrives {train.arrival}</span>
                <span>Duration {durationText(train.durationMinutes)}</span>
              </div>
              <div className="train-meta">
                <span>Days: {(train.operatingDays ?? ["Daily"]).join(", ")}</span>
                <span data-testid="rail-availability-status" className={`status status-${train.status}`}>
                  {train.status}
                </span>
              </div>
              <div className="class-options">
                {trainClasses(train).map((cls) => (
                  <button
                    key={cls.classType}
                    type="button"
                    data-testid="rail-class-option"
                    className={selectedClass[train.id] === cls.classType ? "class-option selected" : "class-option"}
                    onClick={() => setSelectedClass((prev) => ({ ...prev, [train.id]: cls.classType }))}
                    disabled={cls.status === "sold-out" || cls.availableSeats <= 0}
                  >
                    {cls.classType} · {formatCurrency(cls.price, "INR")} · {cls.availableSeats} seats · {cls.status}
                  </button>
                ))}
              </div>
              <div className="card-actions">
                <button type="button" onClick={() => setExpanded((p) => ({ ...p, [train.id]: !p[train.id] }))}>
                  Details
                </button>
                <button
                  type="button"
                  data-testid="rail-select-train"
                  onClick={() => selectTrain(train)}
                  disabled={!selectedClass[train.id]}
                >
                  Select Train
                </button>
              </div>
              {expanded[train.id] && (
                <div className="train-details">
                  <p>Train {train.number} {train.name}</p>
                  <p>{train.from} to {train.to}</p>
                  <p>Departs {train.departure}, arrives {train.arrival} ({durationText(train.durationMinutes)})</p>
                  <p>Operating days: {(train.operatingDays ?? ["Daily"]).join(", ")}</p>
                </div>
              )}
              {error && <ErrorAlert message={error} />}
            </article>
          ))}
        </section>

        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={() => navigate("/")}>Back to Search</button>
        </div>
      </div>
    </div>
  );
}

function PassengersPage({
  flow,
  setFlow,
  navigate,
  pushToast,
}: {
  flow: FlowState;
  setFlow: (u: (p: FlowState) => FlowState) => void;
  navigate: (to: string) => void;
  pushToast: (m: string, t?: ToastMessage["type"]) => void;
}) {
  useEffect(() => {
    if (!flow.selection) navigate(flow.search ? "/trains" : "/");
  }, [flow.selection, flow.search, navigate]);

  const selection = flow.selection;
  const search = flow.search;

  const [passengers, setPassengers] = useState<Passenger[]>(
    flow.passengers && flow.passengers.length > 0
      ? flow.passengers
      : [{ id: "p1", name: "", age: "", gender: "", berth: "No Preference" }],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prefs, setPrefs] = useState({
    confirmOnly: false,
    alternate: true,
    contact: "9999999999",
  });

  function validatePassenger(p: Passenger): Record<string, string> {
    const e: Record<string, string> = {};
    const name = p.name.trim();
    if (name.length < 2 || name.length > 40 || !/^[A-Za-z][A-Za-z\s'-]*$/.test(name)) {
      e.name = "Enter a valid passenger name";
    }
    const age = Number(p.age);
    if (!/^\d+$/.test(p.age) || age < 1 || age > 120) {
      e.age = "Enter a valid age between 1 and 120";
    }
    if (!p.gender) e.gender = "Select gender";
    return e;
  }

  function validateAll(): boolean {
    const next: Record<string, string> = {};
    passengers.forEach((p, idx) => {
      const e = validatePassenger(p);
      Object.keys(e).forEach((k) => {
        next[`${idx}-${k}`] = e[k] ?? "";
      });
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function addPassenger() {
    if (passengers.length >= 6) return;
    setPassengers((prev) => [...prev, { id: `p${prev.length + 1}`, name: "", age: "", gender: "", berth: "No Preference" }]);
  }

  function removePassenger(idx: number) {
    if (passengers.length <= 1) return;
    setPassengers((prev) => prev.filter((_, i) => i !== idx));
  }

  function updatePassenger(idx: number, patch: Partial<Passenger>) {
    setPassengers((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  function continueReview() {
    if (!validateAll()) {
      pushToast("Please fix passenger details", "error");
      return;
    }
    setFlow((prev) => ({ ...prev, passengers, search: { ...prev.search!, ...{ contact: prefs.contact } } as any }));
    // store prefs separately in flow? keep simple
    setFlow((prev) => ({ ...prev, passengers }));
    navigate("/review");
  }

  if (!selection || !search) return null;

  return (
    <div>
      <MockEnvironmentBanner platform="RailBook Lab" />
      <div className="container">
        <header className="top-nav">
          <div className="brand">RailBook Lab</div>
          <nav>
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/bookings")}>Bookings</button>
          </nav>
        </header>
        <div className="simulation-banner">SIMULATION ONLY — NO REAL RAILWAY BOOKINGS</div>
        <h1>Passenger Details</h1>
        <p className="muted">
          {selection.train.name} ({selection.train.number}) · {selection.classType}
        </p>

        <form data-testid="rail-passenger-form" className="card" onSubmit={(e) => { e.preventDefault(); continueReview(); }}>
          {passengers.map((p, idx) => (
            <div key={p.id} data-testid="rail-passenger-card" className="passenger-card">
              <h3>Passenger {idx + 1}</h3>
              <label>
                Name
                <input
                  data-testid="rail-passenger-name"
                  value={p.name}
                  onChange={(e) => updatePassenger(idx, { name: e.target.value })}
                  aria-label={`Passenger ${idx + 1} name`}
                />
                {errors[`${idx}-name`] && <span className="error" role="alert">{errors[`${idx}-name`]}</span>}
              </label>
              <label>
                Age
                <input
                  data-testid="rail-passenger-age"
                  type="number"
                  min={1}
                  max={120}
                  value={p.age}
                  onChange={(e) => updatePassenger(idx, { age: e.target.value })}
                  aria-label={`Passenger ${idx + 1} age`}
                />
                {errors[`${idx}-age`] && <span className="error" role="alert">{errors[`${idx}-age`]}</span>}
              </label>
              <label>
                Gender
                <select
                  data-testid="rail-passenger-gender"
                  value={p.gender}
                  onChange={(e) => updatePassenger(idx, { gender: e.target.value })}
                  aria-label={`Passenger ${idx + 1} gender`}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {errors[`${idx}-gender`] && <span className="error" role="alert">{errors[`${idx}-gender`]}</span>}
              </label>
              <label>
                Berth preference
                <select
                  data-testid="rail-berth-preference"
                  value={p.berth}
                  onChange={(e) => updatePassenger(idx, { berth: e.target.value })}
                  aria-label={`Passenger ${idx + 1} berth preference`}
                >
                  {BERTHS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-testid="rail-remove-passenger"
                onClick={() => removePassenger(idx)}
                disabled={passengers.length <= 1}
              >
                Remove Passenger
              </button>
            </div>
          ))}

          <div className="prefs">
            <label>
              <input
                type="checkbox"
                checked={prefs.confirmOnly}
                onChange={(e) => setPrefs((p) => ({ ...p, confirmOnly: e.target.checked }))}
              />
              Book only if requested confirmation condition is met (simulation)
            </label>
            <label>
              <input
                type="checkbox"
                checked={prefs.alternate}
                onChange={(e) => setPrefs((p) => ({ ...p, alternate: e.target.checked }))}
              />
              Consider alternate availability (simulation)
            </label>
            <label>
              Contact number
              <input
                value={prefs.contact}
                onChange={(e) => setPrefs((p) => ({ ...p, contact: e.target.value }))}
                aria-label="Contact number"
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" data-testid="rail-add-passenger" onClick={addPassenger} disabled={passengers.length >= 6}>
              Add Passenger
            </button>
            <button type="submit" data-testid="rail-continue-review">
              Continue to Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewPage({
  flow,
  setFlow,
  navigate,
  pushToast,
}: {
  flow: FlowState;
  setFlow: (u: (p: FlowState) => FlowState) => void;
  navigate: (to: string) => void;
  pushToast: (m: string, t?: ToastMessage["type"]) => void;
}) {
  useEffect(() => {
    if (!flow.selection) navigate(flow.search ? "/trains" : "/");
  }, [flow.selection, flow.search, navigate]);

  const selection = flow.selection;
  const search = flow.search;
  const passengers = flow.passengers ?? [];

  const cls = selection ? trainClasses(selection.train).find((c) => c.classType === selection.classType) : undefined;
  const farePerPassenger = cls?.price ?? selection?.train.price ?? 0;
  const baseFare = farePerPassenger * passengers.length;
  const serviceFee = 40;
  const total = baseFare + serviceFee;

  const [revalidating, setRevalidating] = useState(false);
  const [staleError, setStaleError] = useState<string | null>(null);

  async function continuePayment() {
    if (!selection) return;
    setRevalidating(true);
    setStaleError(null);
    try {
      const res = await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainId: selection.train.id, classType: selection.classType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStaleError(data.message ?? "Selected train is no longer available");
        pushToast(data.message ?? "Selected train is no longer available", "error");
        return;
      }
      setFlow((prev) => ({ ...prev, booking: undefined }));
      navigate("/payment");
    } catch {
      pushToast("Unable to reach mock service.", "error");
    } finally {
      setRevalidating(false);
    }
  }

  if (!selection || !search) return null;

  return (
    <div>
      <MockEnvironmentBanner platform="RailBook Lab" />
      <div className="container">
        <header className="top-nav">
          <div className="brand">RailBook Lab</div>
          <nav>
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/bookings")}>Bookings</button>
          </nav>
        </header>
        <div className="simulation-banner">SIMULATION ONLY — NO REAL RAILWAY BOOKINGS</div>
        <h1>Review Booking</h1>

        <div className="card">
          <h2>Journey</h2>
          <p>{selection.train.name} ({selection.train.number})</p>
          <p>{search.fromName} → {search.toName}</p>
          <p>Date: {formatDate(search.date)}</p>
          <p>Class: {classLabel(selection.classType)} · Quota: {quotaLabel(search.quota)}</p>
          <p>Passengers: {passengers.length}</p>
        </div>

        <div className="card">
          <h2>Passengers</h2>
          {passengers.map((p, idx) => (
            <div key={p.id} className="passenger-summary">
              {idx + 1}. {p.name} · {p.age} · {p.gender} · {p.berth}
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Fare Breakdown</h2>
          <div>Fare per passenger: {formatCurrency(farePerPassenger, "INR")}</div>
          <div>Passengers: {passengers.length}</div>
          <div>Base fare: {formatCurrency(baseFare, "INR")}</div>
          <div>Service fee: {formatCurrency(serviceFee, "INR")}</div>
          <div className="total">Total amount: {formatCurrency(total, "INR")}</div>
        </div>

        {staleError && <ErrorAlert message={staleError} />}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button type="button" onClick={() => navigate("/trains")}>Back to Results</button>
          <button type="button" onClick={() => navigate("/passengers")}>Edit Passengers</button>
          <button type="button" onClick={continuePayment} disabled={revalidating}>
            {revalidating ? "Revalidating…" : "Continue to Payment"}
          </button>
        </div>
        {staleError && (
          <div style={{ marginTop: 8 }}>
            <button type="button" onClick={() => navigate("/trains")}>Return to results</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentPage({
  flow,
  setFlow,
  navigate,
  pushToast,
}: {
  flow: FlowState;
  setFlow: (u: (p: FlowState) => FlowState) => void;
  navigate: (to: string) => void;
  pushToast: (m: string, t?: ToastMessage["type"]) => void;
}) {
  useEffect(() => {
    if (!flow.selection) navigate(flow.search ? "/trains" : "/");
  }, [flow.selection, flow.search, navigate]);

  const selection = flow.selection;
  const search = flow.search;
  const passengers = flow.passengers ?? [];

  const [mode, setMode] = useState("upi");
  const [outcome, setOutcome] = useState("success");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cls = selection ? trainClasses(selection.train).find((c) => c.classType === selection.classType) : undefined;
  const farePerPassenger = cls?.price ?? selection?.train.price ?? 0;
  const baseFare = farePerPassenger * passengers.length;
  const total = baseFare + 40;

  async function simulatePayment() {
    if (!selection) return;
    setProcessing(true);
    setError(null);
    try {
      const payRes = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, outcome }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        setError(payData.message ?? "Payment failed");
        pushToast(payData.message ?? "Payment failed", "error");
        return;
      }
      // create booking
      const bookRes = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainId: selection.train.id,
          classType: selection.classType,
          passengers,
          search,
          totalAmount: total,
        }),
      });
      const bookData = await bookRes.json();
      if (!bookRes.ok) {
        setError(bookData.message ?? "Booking could not be completed");
        pushToast(bookData.message ?? "Booking could not be completed", "error");
        return;
      }
      const booking: BookingRecord = {
        bookingId: bookData.bookingId,
        pnr: bookData.pnr,
        platform: "irctc",
        status: bookData.status ?? "confirmed",
        createdAt: new Date().toISOString(),
        totalAmount: total,
        currency: "INR",
        trainId: selection.train.id,
        classType: selection.classType,
        passengers,
        search: search!,
      };
      setFlow((prev) => ({ ...prev, booking }));
      pushToast("Booking confirmed", "success");
      navigate(`/confirmation/${encodeURIComponent(booking.bookingId)}`);
    } catch {
      setError("Unable to reach mock service.");
      pushToast("Unable to reach mock service.", "error");
    } finally {
      setProcessing(false);
    }
  }

  if (!selection || !search) return null;

  return (
    <div>
      <MockEnvironmentBanner platform="RailBook Lab" />
      <div className="container">
        <header className="top-nav">
          <div className="brand">RailBook Lab</div>
          <nav>
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/bookings")}>Bookings</button>
          </nav>
        </header>
        <div className="simulation-banner">SIMULATION ONLY — NO REAL RAILWAY BOOKINGS</div>
        <h1>Simulated Payment</h1>
        <p className="muted">No real financial information is requested or processed.</p>

        <div className="card">
          <h2>Payment mode</h2>
          <label><input type="radio" name="mode" value="upi" checked={mode === "upi"} onChange={() => setMode("upi")} /> UPI simulation</label>
          <label><input type="radio" name="mode" value="card" checked={mode === "card"} onChange={() => setMode("card")} /> Card simulation</label>
          <label><input type="radio" name="mode" value="netbanking" checked={mode === "netbanking"} onChange={() => setMode("netbanking")} /> Net banking simulation</label>
        </div>

        <div className="card">
          <h2>Simulated outcome</h2>
          <select
            data-testid="rail-payment-outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            aria-label="Payment outcome"
          >
            <option value="success">Successful payment</option>
            <option value="declined">Declined payment</option>
            <option value="temporary-failure">Temporary failure</option>
          </select>
          <div style={{ marginTop: 8 }}>Amount to simulate: {formatCurrency(total, "INR")}</div>
        </div>

        {error && <ErrorAlert message={error} />}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            data-testid="rail-simulate-payment"
            onClick={simulatePayment}
            disabled={processing}
          >
            {processing ? "Processing…" : "Simulate Payment"}
          </button>
          <button type="button" onClick={() => navigate("/review")}>Cancel Payment</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmationPage({
  bookingId,
  flow,
  setFlow,
  navigate,
}: {
  bookingId: string;
  flow: FlowState;
  setFlow: (u: (p: FlowState) => FlowState) => void;
  navigate: (to: string) => void;
}) {
  const [booking, setBooking] = useState<BookingRecord | null>(flow.booking?.bookingId === bookingId ? flow.booking : null);
  const [loading, setLoading] = useState(!booking);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (booking) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`);
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.message ?? "Booking not found");
          return;
        }
        if (!cancelled) {
          setBooking(data.booking as BookingRecord);
          setFlow((prev) => ({ ...prev, booking: data.booking as BookingRecord }));
        }
      } catch {
        if (!cancelled) setError("Unable to reach mock service.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId, booking, setFlow]);

  const search = booking?.search ?? flow.search;
  const selectionTrain = flow.selection?.train;
  const train = selectionTrain && selectionTrain.id === booking?.trainId ? selectionTrain : IRCTC_TRAINS.find((t) => t.id === booking?.trainId);

  return (
    <div>
      <MockEnvironmentBanner platform="RailBook Lab" />
      <div className="container">
        <header className="top-nav">
          <div className="brand">RailBook Lab</div>
          <nav>
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/bookings")}>Bookings</button>
          </nav>
        </header>
        <div className="simulation-banner">SIMULATION ONLY — NO REAL RAILWAY BOOKINGS</div>
        <h1>Booking Confirmation</h1>
        {loading && <LoadingSpinner label="Loading booking" />}
        {error && <ErrorAlert message={error} />}
        {booking && (
          <div className="card confirmation">
            <div className="status-confirmed">SIMULATED BOOKING CONFIRMED</div>
            <div>Booking ID: {booking.bookingId}</div>
            <div>Mock PNR: {booking.pnr}</div>
            <div>Train: {train?.name ?? booking.trainId} ({train?.number ?? ""})</div>
            <div>Route: {search?.fromName} → {search?.toName}</div>
            <div>Journey date: {search ? formatDate(search.date) : ""}</div>
            <div>Class: {classLabel(booking.classType)}</div>
            <div>Passengers: {booking.passengers.length}</div>
            <div>Fare paid in simulation: {formatCurrency(booking.totalAmount, "INR")}</div>
            <div>Status: {booking.status}</div>
            <div>Created: {booking.createdAt}</div>
            <h3>Passenger list</h3>
            {booking.passengers.map((p, idx) => (
              <div key={p.id}>
                {idx + 1}. {p.name} ({p.age}, {p.gender}) · {p.berth}
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={() => navigate("/bookings")}>View Bookings</button>
          <button type="button" onClick={() => navigate("/")}>New Search</button>
        </div>
      </div>
    </div>
  );
}

function BookingsPage({ navigate }: { navigate: (to: string) => void }) {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/bookings");
        const data = await res.json();
        setBookings(data.bookings ?? []);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <MockEnvironmentBanner platform="RailBook Lab" />
      <div className="container">
        <header className="top-nav">
          <div className="brand">RailBook Lab</div>
          <nav>
            <button onClick={() => navigate("/")}>Home</button>
          </nav>
        </header>
        <div className="simulation-banner">SIMULATION ONLY — NO REAL RAILWAY BOOKINGS</div>
        <h1>Mock Bookings</h1>
        {loading && <LoadingSpinner label="Loading bookings" />}
        {!loading && bookings.length === 0 && <p>No mock bookings in this session.</p>}
        {bookings.map((b) => (
          <div key={b.bookingId} className="card">
            <div>{b.bookingId} · {b.pnr} · {b.status}</div>
            <div>{b.search?.fromName} → {b.search?.toName} · {b.search ? formatDate(b.search.date) : ""}</div>
            <div>{formatCurrency(b.totalAmount, "INR")}</div>
            <button type="button" onClick={() => navigate(`/confirmation/${encodeURIComponent(b.bookingId)}`)}>
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
