import React, { useEffect, useState } from "react";
import {
  MockEnvironmentBanner,
  ScenarioPanel,
  LoadingSpinner,
  ErrorAlert,
  Toast,
} from "@agentic/shared-ui";
import type { ToastMessage } from "@agentic/shared-ui";
import type { ScenarioName } from "@agentic/mock-scenarios";
import { useStore } from "./store";
import { Api } from "./api";
import HomePage from "./pages/HomePage";
import MoviesPage from "./pages/MoviesPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import ShowsPage from "./pages/ShowsPage";
import SeatsPage from "./pages/SeatsPage";
import FoodPage from "./pages/FoodPage";
import ReviewPage from "./pages/ReviewPage";
import PaymentPage from "./pages/PaymentPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import BookingsPage from "./pages/BookingsPage";

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

function useRoute() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path;
}

export function navigate(to: string) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function App() {
  const { sessionId } = useStore();
  const path = useRoute();
  const [scenario, setScenario] = useState<ScenarioName>("normal");
  const [delayMs, setDelayMs] = useState(1000);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function pushToast(message: string, type: ToastMessage["type"] = "info") {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }

  async function loadScenario() {
    try {
      const data = await Api.scenario();
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
    await Api.setScenario(next, { delayMs });
  }

  async function handleDelayChange(ms: number) {
    setDelayMs(ms);
    await Api.setScenario(scenario, { delayMs: ms });
  }

  async function handleReset() {
    const data = await Api.reset();
    setScenario(data.scenario);
    setDelayMs(1000);
    try {
      localStorage.removeItem("movieseatlab:draft");
    } catch {
      // ignore
    }
    pushToast("Scenario reset to normal", "success");
    window.location.reload();
  }

  let page: React.ReactNode = null;
  if (path === "/" || path === "") page = <HomePage />;
  else if (path === "/movies") page = <MoviesPage />;
  else if (path.startsWith("/movies/")) page = <MovieDetailPage movieId={path.split("/")[2] ?? ""} />;
  else if (path === "/shows") page = <ShowsPage />;
  else if (path === "/seats") page = <SeatsPage />;
  else if (path === "/food") page = <FoodPage />;
  else if (path === "/review") page = <ReviewPage />;
  else if (path === "/payment") page = <PaymentPage />;
  else if (path.startsWith("/confirmation/")) page = <ConfirmationPage bookingId={path.split("/")[2] ?? ""} />;
  else if (path === "/bookings") page = <BookingsPage />;
  else page = <HomePage />;

  return (
    <div>
      <MockEnvironmentBanner platform="MovieSeat Lab (BookMyShow-inspired)" />
      <div className="notice">MOCK MOVIE BOOKING — NO REAL CINEMA TICKETS — NO REAL PAYMENTS</div>
      <header className="app-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="brand">MovieSeat Lab</div>
          <nav style={{ display: "flex", gap: 12 }}>
            <button className="btn secondary" onClick={() => navigate("/")}>Home</button>
            <button className="btn secondary" onClick={() => navigate("/movies")}>Movies</button>
            <button className="btn secondary" onClick={() => navigate("/bookings")}>Bookings</button>
          </nav>
        </div>
      </header>
      <div className="container">{page}</div>
      <div className="container">
        <ScenarioPanel
          platform="BookMyShow"
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
