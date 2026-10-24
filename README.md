# ⚡ Agentic Booking Platform — Phase 1 Multi-Platform Automation Hub

[![Playwright Tests](https://img.shields.io/badge/playwright-v1.49-green.svg)](https://playwright.dev/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-blue.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-v12-orange.svg)](https://pnpm.io/)
[![Status](https://img.shields.io/badge/phase_1-complete-brightgreen.svg)](#)

A centralized, form-driven multi-platform browser automation system powered by **Playwright**, featuring real-time visual mouse animations, dummy UPI QR code payments with real human user validation, and live ticket downloads.

---

## 🤖 Context for AI Assistants & LLM Agents

> This section provides full architectural and domain context for LLMs, coding agents (Cursor, Copilot, Antigravity, Claude, etc.), and future NLP pipelines building upon this codebase.

### Project Mission & High-Level Objective
The end goal of this project is to build an **autonomous agentic travel and entertainment concierge**. A user provides a natural language query (e.g. *"Book two tickets for Neon in Pune tomorrow"* or *"Find a bus from Lucknow to Faizabad on Nov 15th for Omkar"*), and an AI model classifies the intent, extracts structured parameters, and automates the multi-step browser booking journey end-to-end on target platforms.

### Project Roadmap & Phases
- **Phase 1 (Completed & Current Codebase)**:
  - Manual platform selection via a centralized dashboard (`http://localhost:4000`).
  - Strict parameter forms with immediate trigger via `Enter` key or button.
  - Deterministic Playwright runners for **BookMyShow** (`:3003`) and **RedBus** (`:3002`).
  - IRCTC mock (`:3001`) is intentionally kept paused during Phase 1.
  - Visible virtual mouse pointer animation (`installVirtualCursor`) with smooth movement and click ripples.
  - Interactive payment checkpoint: Virtual mouse pauses on the payment page showing a dummy UPI QR Code; the **real human user** clicks `Payment Successful` or `Payment Failed`, steering the next steps.
  - Ticket confirmation screen stays open for 120 seconds for user inspection & print/download.
- **Phase 2 (Upcoming)**:
  - Natural Language Processing (NLP) prompt listener on the dashboard.
  - Few-shot intent classification (BookMyShow vs. RedBus vs. IRCTC).
  - Entity extraction (origin, destination, travel dates, passenger details, seat category).
  - Direct parameter mapping to the Phase 1 Playwright runner functions.
- **Phase 3**:
  - Live external platform adaptation, captcha resolution hooks, and real-time payment gateway webhooks.

### Key Monorepo Packages & Services
1. **`apps/automation-hub`** (`http://localhost:4000`):
   - Express server (`server.ts`) + WebSockets (`ws`).
   - Serves the glassmorphic frontend UI from `public/`.
   - Endpoint `POST /api/run` receives `{ platform: "bookmyshow" | "redbus", params: { ... } }` and streams progress back over WebSocket.
2. **`apps/mock-bookmyshow`** (`http://localhost:3003`):
   - Vite + React + Express server (`server/index.ts`).
   - In-memory movies, cinemas, showtimes, seat layout with lock/hold API (`server/inventory.ts`).
3. **`apps/mock-redbus`** (`http://localhost:3002`):
   - Cloned Create-React-App frontend (`front-end-redbus/`).
   - Network API mocked via Playwright network interceptors (`page.route("**/v1/api/**")`).
   - Redux store probe injected into window (`installStoreProbe`) to bypass dead Heroku/Google OAuth backends.
4. **`playwright/automation/`**:
   - `bookmyshow.ts`: Parametrized BookMyShow execution pipeline.
   - `redbus.ts`: Parametrized RedBus execution pipeline.
5. **`playwright/helpers/`**:
   - `virtualCursor.ts`: Injects glowing animated SVG cursor with realistic human typing delays (`humanClick`, `humanType`).
   - `redbus.ts`: Network route mocks, demo customer fixtures, and store dispatcher.
   - `urls.ts`: Port dictionary (`3001`: IRCTC, `3002`: RedBus, `3003`: BookMyShow).

---

> ## ⚡ Quick Start: How to Run the Project
>
> Follow these steps to start all mock platforms and the **Playwright Automation Hub**:
>
> ### 1. Install Dependencies
> ```bash
> pnpm install
> ```
>
> ### 2. Start the 3 Servers (in 3 separate terminals)
>
> - **Terminal 1: BookMyShow Mock (:3003)**
>   ```bash
>   pnpm run dev:bookmyshow
>   ```
>   *Direct URL: [http://localhost:3003](http://localhost:3003)*
>
> - **Terminal 2: RedBus Mock (:3002)**
>   ```bash
>   pnpm run dev:redbus
>   ```
>   *Direct URL: [http://localhost:3002](http://localhost:3002)*
>
> - **Terminal 3: Automation Hub Dashboard (:4000)**
>   ```bash
>   pnpm run dev:hub
>   ```
>   *Direct URL: [http://localhost:4000](http://localhost:4000)*
>
> > **Note on `EADDRINUSE`:** If you see *"address already in use"*, the server is already active in a background terminal. You can directly access [http://localhost:4000](http://localhost:4000).
>
> ---
>
> ### 3. Open the Automation Hub
> Open **[http://localhost:4000](http://localhost:4000)** in your browser.
>
> ### 4. Run the Visible Browser Automation
> 1. Select target platform: **BookMyShow** or **RedBus**.
> 2. Fill the booking parameters (or use default values).
> 3. Keep **"Show Browser Window (Headed Mode)"** checked.
> 4. Hit **`Enter` ↵** or click **"Execute Playwright Automation"**.
>
> ### 5. What Happens During Execution
> - **🖥️ Foreground Window**: A maximized Chromium browser window pops up directly in front of your eyes (`chromium.launchPersistentContext`).
> - **🖱️ Glowing Red Virtual Cursor**: An animated red mouse pointer glides smoothly across the screen, triggers visual click ripples, and types out characters with realistic human cadence.
> - **📱 Dummy UPI QR Code**: Once seats are picked and details entered, the browser navigates to the payment screen with a dummy UPI QR code with dynamic booking fare.
> - **👤 Real Human User Decision (Virtual Mouse Pauses)**:
>   The virtual mouse **stops** and waits for **YOU** (the real user) to click:
>   - **`✅ Payment Successful`** ➡️ Validates the transaction and generates the official confirmed ticket.
>   - **`❌ Payment Failed / Cancel`** ➡️ Cancels transaction and presents failure state.
> - **🎟️ Real-Time Ticket Download & Inspection**:
>   - The browser window **does NOT close immediately**. It stays open for **2 full minutes (120s)**.
>   - You can review the booking ID, travel dates, seats, and click **`📥 Download / Print Ticket`** in real time!

---

## 🛠️ Project Structure

```text
├── apps/
│   ├── automation-hub/         # Phase 1 UI Dashboard & Express/WS Server (:4000)
│   │   ├── public/             # Glassmorphic frontend (index.html, style.css, app.js)
│   │   └── server.ts           # Runner trigger endpoint & WebSocket log stream
│   ├── mock-bookmyshow/        # Vite + Express movie booking mock app (:3003)
│   │   ├── server/             # Express API (inventory, showtimes, seats, holds)
│   │   └── src/pages/          # PaymentPage (QR code) & ConfirmationPage
│   ├── mock-redbus/            # Create-React-App bus booking mock app (:3002)
│   │   └── front-end-redbus/   # RedBus clone with QR code payment & MyTrips
│   └── mock-irctc/             # Train booking mock app (reserved for Phase 2)
├── playwright/
│   ├── automation/             # Production automation pipelines (BMS & RedBus)
│   ├── helpers/                # Virtual cursor, store probes, and URL helpers
│   └── fixtures/               # Test fixtures and shared mocks
├── tests/                      # Playwright test specs
├── docs/                       # Project workflows and documentation
└── package.json                # Workspace configuration and scripts
```