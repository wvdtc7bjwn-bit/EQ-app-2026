import {
  updateCurrentInfo,
  updateTime,
  updatePoints,
  showEEW,
  setupPanelToggle,
  renderEEWCard
} from "./ui.js";

import {
  addHistory,
  setLatestHistoryEvent
} from "./history.js";

import {
  showTsunamiPanel,
  showNoTsunamiPanel,
  restoreCurrentPanel,
  showTsunamiView,
  showEarthquakeView,
  showKyoshinView
} from "./tsunamiPanel.js";

const TAB = {
  EARTHQUAKE: "earthquake",
  KYOSHIN: "kyoshin",
  TSUNAMI: "tsunami"
};

let currentTab = TAB.EARTHQUAKE;

let latestEarthquakeInfo = null;
let latestEewInfo = null;
let latestTsunamiInfo = null;

export function setLeftPanelTab(tab) {
  currentTab = tab;
  renderLeftPanel();
}

export function setLatestEarthquakeInfo(data) {
  if (latestEarthquakeInfo) {
    addHistory(latestEarthquakeInfo);
  }

  latestEarthquakeInfo = data;

  setLatestHistoryEvent(data);

  if (currentTab === TAB.EARTHQUAKE) {
    renderEarthquakeTab();
  }
}

export function setLatestEewInfo(data) {
  latestEewInfo = data;

  if (isEewVisibleTab()) {
    renderLeftPanel();
  }
}

export function clearLatestEewInfo() {
  latestEewInfo = null;

  if (isEewVisibleTab()) {
    renderLeftPanel();
  }
}

export function setLatestTsunamiInfo(data) {
  latestTsunamiInfo = data;

  if (currentTab === TAB.TSUNAMI) {
    renderTsunamiTab();
  }
}

export function renderLeftPanel() {
  switch (currentTab) {
    case TAB.EARTHQUAKE:
      renderEarthquakeTab();
      break;

    case TAB.KYOSHIN:
      renderKyoshinTab();
      break;

    case TAB.TSUNAMI:
      renderTsunamiTab();
      break;

    default:
      renderEarthquakeTab();
      break;
  }
}

function renderEarthquakeTab() {
  setBottomPanels({
    history: true,
    points: true,
    kyoshinDetect: false
  });

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

  renderLatestEarthquakeInfo();
}

function renderKyoshinTab() {
  setBottomPanels({
    history: false,
    points: false,
    kyoshinDetect: true
  });

  showKyoshinView();
  renderKyoshinEEWPanel();
}

function renderTsunamiTab() {
  setBottomPanels({
    history: false,
    points: false,
    kyoshinDetect: false
  });

  showTsunamiView();
  renderTsunamiInfo();
}

function renderLatestEarthquakeInfo() {
  if (!latestEarthquakeInfo) {
    return;
  }

  updateCurrentInfo(latestEarthquakeInfo);
  updateTime();

  updatePoints(
    latestEarthquakeInfo.points,
    latestEarthquakeInfo.scaleList
  );
}

function renderKyoshinEEWPanel() {
  const panel = document.getElementById("kyoshin-eew-panel");

  if (!panel) {
    return;
  }

  panel.innerHTML = renderEEWCard(
    latestEewInfo,
    {
      isWarning: latestEewInfo?.isWarning,
      reportNumber: latestEewInfo?.reportNumber
    }
  );
}

function renderTsunamiInfo() {
  if (!latestTsunamiInfo) {
    showNoTsunamiPanel();
    return;
  }

  const hasAreas =
    Array.isArray(latestTsunamiInfo.areas) &&
    latestTsunamiInfo.areas.length > 0;

  const hasObservations =
    Array.isArray(latestTsunamiInfo.observations) &&
    latestTsunamiInfo.observations.length > 0;

  const hasEstimations =
    Array.isArray(latestTsunamiInfo.estimations) &&
    latestTsunamiInfo.estimations.length > 0;

  if (
    hasAreas ||
    hasObservations ||
    hasEstimations
  ) {
    showTsunamiPanel(latestTsunamiInfo);
  }
  else {
    showNoTsunamiPanel();
  }
}

function setBottomPanels({
  history = false,
  points = false,
  kyoshinDetect = false
}) {
  setPanelVisible("history-panel", history);
  setPanelVisible("points-panel", points);
  setPanelVisible("kyoshin-detect-panel", kyoshinDetect);

  if (!points) {
    document.getElementById("points-panel")?.classList.add("hidden");
  }
}

function setPanelVisible(id, visible) {
  const panel = document.getElementById(id);

  if (!panel) {
    return;
  }

  panel.style.display = visible ? "" : "none";

  if (visible) {
    panel.classList.remove("hidden");
  }
  else {
    panel.classList.add("hidden");
  }
}

function isEewVisibleTab() {
  return (
    currentTab === TAB.EARTHQUAKE ||
    currentTab === TAB.KYOSHIN
  );
}
