import {
  updateCurrentInfo,
  updateTime,
  updatePoints,
  showEEW
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

function showBottomPanel() {
  const targets = [
    document.getElementById("points-list"),
    document.getElementById("history-list"),
    document.getElementById("history-panel"),
    document.querySelector(".points-list"),
    document.querySelector(".history-list"),
    document.querySelector(".history-panel")
  ];

  targets.forEach(target => {
    if (!target) {
      return;
    }

    target.style.display = "";
  });
}

function renderKyoshinTab() {
  showEarthquakePanels();

  restoreCurrentPanel();

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

function clearBottomPanel() {
  const targets = [
    document.getElementById("points-list"),
    document.getElementById("history-list"),
    document.getElementById("history-panel"),
    document.querySelector(".points-list"),
    document.querySelector(".history-list"),
    document.querySelector(".history-panel")
  ];

  targets.forEach(target => {
    if (!target) {
      return;
    }

    target.innerHTML = "";
  });
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
  const historyPanel =
    document.getElementById("history-panel");

  const pointsPanel =
    document.getElementById("points-panel");

  const statusBanner =
    document.getElementById("status-banner");

  if (historyPanel) {
    historyPanel.style.display =
      "none";
  }

  if (pointsPanel) {
    pointsPanel.style.display =
      "none";
  }

  if (statusBanner) {
    statusBanner.style.display =
      "none";
  }
}

function showEarthquakePanels() {
  const historyPanel =
    document.getElementById("history-panel");

  const pointsPanel =
    document.getElementById("points-panel");

  const statusBanner =
    document.getElementById("status-banner");

  if (historyPanel) {
    historyPanel.style.display =
      "";
  }

  if (pointsPanel) {
    pointsPanel.style.display =
      "";
  }

  if (statusBanner) {
    statusBanner.style.display =
      "";
  }
}