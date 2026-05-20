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

import {
  getIntensityColor
} from "./earthquake.js";

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

  const reportText = latestEewInfo.reportNumber
    ? ` #${latestEewInfo.reportNumber}`
    : "";

  const statusText = latestEewInfo.isWarning
    ? `緊急地震速報　警報${reportText}`
    : `緊急地震速報　予報${reportText}`;

  const statusStyle = latestEewInfo.isWarning
    ? "background: linear-gradient(180deg, #dc2626 0%, #991b1b 100%); color: white;"
    : "background: linear-gradient(180deg, #d9c55f 0%, #b8942f 100%); color: #111;";

  panel.innerHTML = `
    <div class="status-banner" style="${statusStyle}">
      ${statusText}
    </div>

    <div class="quake-info">
      <div class="kyoshin-eew-area">
        ${latestEewInfo.place ?? "震源調査中"} <small>で地震</small>
      </div>

      <div class="kyoshin-eew-time">
        ${formatDisplayTime(latestEewInfo.time)} 発生
      </div>

      <div class="kyoshin-eew-intensity-box" style="background: ${getIntensityColor(latestEewInfo.scale)};">
        <div class="intensity-label">
          推定最大震度
        </div>

        <div class="kyoshin-eew-intensity-value">
          ${latestEewInfo.intensity ?? "-"}
        </div>
      </div>

      <div class="detail-box">
        <div class="detail-row">
          <span>マグニチュード</span>
          <strong>${formatMagnitude(latestEewInfo.magnitude)}</strong>
        </div>

        <div class="detail-row">
          <span>深さ</span>
          <strong>${formatDepth(latestEewInfo.depth)}</strong>
        </div>
      </div>

      <div class="quake-desc" style="color: ${latestEewInfo.isWarning ? "#f5df8a" : "#e2e8f0"};">
        ${
          latestEewInfo.isWarning
            ? "緊急地震速報（警報）発表<br>強い揺れに警戒してください"
            : "緊急地震速報（予報）発表<br>揺れに注意してください"
        }
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

function formatMagnitude(magnitude) {
  if (
    magnitude === "-" ||
    magnitude === null ||
    magnitude === undefined
  ) {
    return "-";
  }

  return magnitude;
}

function formatDepth(depth) {
  if (
    depth === "-" ||
    depth === null ||
    depth === undefined
  ) {
    return "-";
  }

  return `${depth}km`;
}

function formatDisplayTime(timeText) {
  if (!timeText) {
    return "--";
  }

  const date = new Date(timeText);

  if (Number.isNaN(date.getTime())) {
    return timeText;
  }

  return date.toLocaleString("ja-JP");
}