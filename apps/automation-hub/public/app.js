let currentPlatform = "bookmyshow";
let isRunning = false;
let socket = null;

const tabBMS = document.getElementById("tabBMS");
const tabRedBus = document.getElementById("tabRedBus");
const formBMS = document.getElementById("formBMS");
const formRedBus = document.getElementById("formRedBus");
const btnExecute = document.getElementById("btnExecute");
const btnClearLogs = document.getElementById("btnClearLogs");
const terminalBody = document.getElementById("terminalBody");
const statusPill = document.getElementById("statusPill");
const statusText = document.getElementById("statusText");
const headedCheckbox = document.getElementById("headedCheckbox");

// Platform Switch
tabBMS.addEventListener("click", () => setPlatform("bookmyshow"));
tabRedBus.addEventListener("click", () => setPlatform("redbus"));

function setPlatform(platform) {
  if (isRunning) return;
  currentPlatform = platform;
  if (platform === "bookmyshow") {
    tabBMS.classList.add("active");
    tabRedBus.classList.remove("active");
    formBMS.classList.add("active");
    formRedBus.classList.remove("active");
    appendLog(`Switched platform: BookMyShow (:3003)`, "info");
  } else {
    tabRedBus.classList.add("active");
    tabBMS.classList.remove("active");
    formRedBus.classList.add("active");
    formBMS.classList.remove("active");
    appendLog(`Switched platform: RedBus (:3002)`, "info");
  }
}

// Logs helper
function appendLog(message, level = "info", timestamp = null) {
  const time = timestamp || new Date().toLocaleTimeString();
  const line = document.createElement("div");
  line.className = `log-line ${level}`;
  line.innerHTML = `
    <span class="log-time">${time}</span>
    <span class="log-msg">${escapeHtml(message)}</span>
  `;
  terminalBody.appendChild(line);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

btnClearLogs.addEventListener("click", () => {
  terminalBody.innerHTML = "";
  appendLog("Console logs cleared.", "info");
});

// WebSocket Setup
function initWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    appendLog("WebSocket connection established.", "info");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleSocketMessage(data);
    } catch (e) {
      console.error("Failed to parse websocket message", e);
    }
  };

  socket.onclose = () => {
    setTimeout(initWebSocket, 2000);
  };
}

function handleSocketMessage(data) {
  if (data.type === "connected") {
    // initial hello
  } else if (data.type === "start") {
    setRunningState(true);
    appendLog(data.message, "info", data.timestamp);
  } else if (data.type === "log") {
    appendLog(data.text, data.level, data.timestamp);
  } else if (data.type === "finish") {
    setRunningState(false);
    if (data.status === "success") {
      appendLog(data.result?.message || "Automation completed successfully!", "success", data.timestamp);
    } else {
      appendLog(`Automation failed: ${data.error}`, "error", data.timestamp);
    }
  }
}

function setRunningState(running) {
  isRunning = running;
  if (running) {
    statusPill.classList.add("running");
    statusText.textContent = "Running Automation...";
    btnExecute.disabled = true;
    btnExecute.querySelector(".btn-text").textContent = "Executing Playwright...";
  } else {
    statusPill.classList.remove("running");
    statusText.textContent = "Ready";
    btnExecute.disabled = false;
    btnExecute.querySelector(".btn-text").textContent = "Execute Playwright Automation";
  }
}

// Execution trigger
async function triggerAutomation() {
  if (isRunning) return;

  const isHeaded = headedCheckbox.checked;
  let params = { headless: !isHeaded };

  if (currentPlatform === "bookmyshow") {
    params.city = document.getElementById("bmsCity").value.trim();
    params.movieQuery = document.getElementById("bmsMovie").value.trim();
    params.ticketCount = parseInt(document.getElementById("bmsTickets").value, 10);
  } else if (currentPlatform === "redbus") {
    params.source = document.getElementById("rbSource").value.trim();
    params.destination = document.getElementById("rbDestination").value.trim();
    params.travelDate = document.getElementById("rbDate").value;
    params.passengerName = document.getElementById("rbName").value.trim();
    params.age = parseInt(document.getElementById("rbAge").value, 10);
    params.gender = document.getElementById("rbGender").value;
    params.email = document.getElementById("rbEmail").value.trim();
    params.phone = document.getElementById("rbPhone").value.trim();
  }

  appendLog(`Submitting request to trigger ${currentPlatform.toUpperCase()}...`, "info");

  try {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: currentPlatform, params }),
    });

    if (!res.ok) {
      const err = await res.json();
      appendLog(`Error: ${err.error || "Failed to trigger automation"}`, "error");
    }
  } catch (err) {
    appendLog(`Network error: ${err.message}`, "error");
    setRunningState(false);
  }
}

btnExecute.addEventListener("click", triggerAutomation);

// Listen to Enter key anywhere inside the active form inputs
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "SELECT")) {
      e.preventDefault();
      triggerAutomation();
    }
  }
});

// Initialize
initWebSocket();
