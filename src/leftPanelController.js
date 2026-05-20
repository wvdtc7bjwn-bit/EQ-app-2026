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
  restoreCurrentPanel
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
  showEarthquakePanels();

  restoreCurrentPanel();
  setupPanelToggle();

  if (latestEewInfo) {
    showEEW(
      latestEewInfo,
      latestEewInfo.isWarning,
      latestEewInfo.reportNumber
    );
  }
  else {
    hideCurrentPanel();
  }

  showKyoshinDetectPlaceholder();
}

function renderTsunamiTab() {
  hideEarthquakePanels();

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

function hideCurrentPanel() {
  const currentPanel =
    document.querySelector(".current-panel") ||
    document.getElementById("current-panel");

  if (!currentPanel) {
    return;
  }

  currentPanel.innerHTML = "";
}

function showKyoshinDetectPlaceholder() {
  const pointsList =
    document.getElementById("points-list");

  if (!pointsList) {
    return;
  }

  pointsList.innerHTML = `
    <div class="kyoshin-detect-empty">
      <div class="kyoshin-detect-title">
        揺れ検知情報
      </div>

      <div class="kyoshin-detect-message">
        現在、強い揺れは検知されていません
      </div>
    </div>
  `;
}

function hideEarthquakePanels() {
  const currentPanel =
    document.getElementById("current-panel");

  const historyPanel =
    document.getElementById("history-panel");

  const pointsPanel =
    document.getElementById("points-panel");

  if (currentPanel) {
    currentPanel.style.display = "";
  }

  if (historyPanel) {
    historyPanel.style.display = "none";
  }

  if (pointsPanel) {
    pointsPanel.style.display = "none";
    pointsPanel.classList.add("hidden");
  }
}

function showEarthquakePanels() {
  const currentPanel =
    document.getElementById("current-panel");

  const historyPanel =
    document.getElementById("history-panel");

  const pointsPanel =
    document.getElementById("points-panel");

  const statusBanner =
    document.getElementById("status-banner");

  if (currentPanel) {
    currentPanel.style.display = "";
  }

  if (historyPanel) {
    historyPanel.style.display = "";
  }

  if (pointsPanel) {
    pointsPanel.style.display = "";
  }

  if (statusBanner) {
    statusBanner.style.display = "";
  }
}