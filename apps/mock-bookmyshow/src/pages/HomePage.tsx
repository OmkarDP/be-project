import React from "react";
import MovieDiscovery from "../components/MovieDiscovery";

export default function HomePage() {
  return (
    <div>
      <div className="card">
        <h1>MovieSeat Lab</h1>
        <p>Fictional movie ticket booking simulation. No real tickets, no real payments.</p>
      </div>
      <MovieDiscovery />
    </div>
  );
}
