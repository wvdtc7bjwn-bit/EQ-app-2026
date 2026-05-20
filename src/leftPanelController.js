import {
  updateCurrentInfo,
  updateTime,
  updatePoints,
  showEEW,
  setupPanelToggle
} from "./ui.js";

import {
  addHistory
} from "./history.js";

import {
  showTsunamiPanel,
  showNoTsunamiPanel,
  restoreCurrentPanel,
  showTsunamiView,
  showEarthquakeView,
  showKyoshinView
} from "./tsunamiPanel.js";

let currentTab = "earthquake";

let latestEarthquakeInfo = null;
let latestEewInfo = null;
let latestTsunamiInfo = null;

export function setLeftPanelTab(tab) {
  currentTab = tab;
  renderLeftPanel();
}

export function setLatestEarthquakeInfo(data) {
  latestEarthquakeInfo = data;
  addHistory(data);

  if (currentTab === "earthquake") {
    renderEarthquakeTab();
  }
}

export function setLatestEewInfo(data) {
  latestEewInfo = data;

  if (
    currentTab === "earthquake" ||
    currentTab === "kyoshin"
  ) {
    renderLeftPanel();
  }
}

export function clearLatestEewInfo() {
  latestEewInfo = null;

  if (
    currentTab === "earthquake" ||
    currentTab === "kyoshin"
  ) {
    renderLeftPanel();
  }
}

export function setLatestTsunamiInfo(data) {
  latestTsunamiInfo = data;

  if (currentTab === "tsunami") {
    renderTsunamiTab();
  }
}

export function renderLeftPanel() {
  if (currentTab === "earthquake") {
    renderEarthquakeTab();
    return;
  }

  if (currentTab === "kyoshin") {
    renderKyoshinTab();
    return;
  }

  if (currentTab === "tsunami") {
    renderTsunamiTab();
  }
}

function renderEarthquakeTab() {
  showEarthquakePanels();
  showEarthquakeView();

  restoreCurrentPanel();
  setupPanelToggle();

  if (latestEewInfo) {
    showEEW(
      latestEewInfo,
      latestEewInfo.isWarning,
      latestEewInfo.reportNumber
    );

    return;
  }

  if (latestEarthquakeInfo) {
    updateCurrentInfo(latestEarthquakeInfo);
    updateTime();

    updatePoints(
      latestEarthquakeInfo.points,
      latestEarthquakeInfo.scaleList
    );
  }
}

function renderKyoshinTab() {
  hideEarthquakePanels();
  showKyoshinView();

  renderKyoshinEEWPanel();
  showKyoshinDetectPlaceholder();
}

function renderKyoshinEEWPanel() {
  const panel = document.getElementById("kyoshin-eew-panel");

  if (!panel) {
    return;
  }

  if (!latestEewInfo) {
    panel.innerHTML = `
      <div class="kyoshin-empty-message">
        緊急地震速報は<br>
        現在発表されていません
      </div>
    `;

    return;
  }

  panel.innerHTML = `
    <div class="detail-box">
      <div style="font-size: 18px; font-weight: 800; margin-bottom: 12px; color: #f5df8a;">
        ${latestEewInfo.isWarning ? "緊急地震速報（警報）" : "緊急地震速報（予報）"}
      </div>

      <div style="font-size: 28px; font-weight: 800; line-height: 1.4; margin-bottom: 12px;">
        ${latestEewInfo.place ?? "震源調査中"}
      </div>

      <div style="color: #cbd5e0; font-size: 16px; font-weight: 700; line-height: 1.8;">
        最大震度 ${latestEewInfo.intensity ?? "-"}<br>
        M${latestEewInfo.magnitude ?? "-"}<br>
        深さ ${latestEewInfo.depth ?? "-"}km
      </div>
    </div>
  `;
}

function renderTsunamiTab() {
  hideEarthquakePanels();
  showTsunamiView();

  if (
    latestTsunamiInfo &&
    Array.isArray(latestTsunamiInfo.areas) &&
    latestTsunamiInfo.areas.length > 0
  ) {
    showTsunamiPanel(latestTsunamiInfo);
  }
  else {
    showNoTsunamiPanel();
  }
}

function showKyoshinDetectPlaceholder() {
  const panel = document.getElementById("kyoshin-detect-panel");

  if (!panel) {
    return;
  }

  panel.classList.remove("hidden");
}

function hideEarthquakePanels() {
  const historyPanel = document.getElementById("history-panel");
  const pointsPanel = document.getElementById("points-panel");
  const kyoshinPanel = document.getElementById("kyoshin-detect-panel");

  if (historyPanel) {
    historyPanel.style.display = "none";
  }

  if (pointsPanel) {
    pointsPanel.style.display = "none";
    pointsPanel.classList.add("hidden");
  }

  if (kyoshinPanel) {
    kyoshinPanel.classList.add("hidden");
  }
}

function showEarthquakePanels() {
  const historyPanel = document.getElementById("history-panel");
  const pointsPanel = document.getElementById("points-panel");
  const statusBanner = document.getElementById("status-banner");
  const kyoshinPanel = document.getElementById("kyoshin-detect-panel");

  if (historyPanel) {
    historyPanel.style.display = "";
  }

  if (pointsPanel) {
    pointsPanel.style.display = "";
  }

  if (statusBanner) {
    statusBanner.style.display = "";
  }

  if (kyoshinPanel) {
    kyoshinPanel.classList.add("hidden");
  }
}