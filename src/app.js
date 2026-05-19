import {
  socket
} from "./socket.js";

import {
  updateCurrentInfo,
  updateTime,
  updatePoints,
  setupPanelToggle,
  setMainMode,
  setSubPanel,
  showEEW
} from "./ui.js";

import {
  addHistory
} from "./history.js";

import {
  setupMainTabs,
  updateMainTabUI
} from "./mainTabs.js";

import {
  showTsunamiPanel,
  showNoTsunamiPanel,
  restoreCurrentPanel
} from "./tsunamiPanel.js";

import {
  initializeSvgMap,
  updateSvgHypocenter,
  updateSvgIntensityPoints,
  updateIntensityAreas,
  updateSvgEewWaves,
  clearSvgEewWaves,
  updateKyoshinDots,
  setKyoshinDisplayMode,
  updateTsunamiAreas
} from "./map/japanSvgMap.js";

let currentMainTab = "earthquake";

let latestTsunamiInfo = null;
let eewEndTimer = null;
let eewTimeoutTimer = null;
let temporaryInfoTimer = null;
let latestEewData = null;

function clearEewTimers() {
  if (eewEndTimer) {
    clearTimeout(eewEndTimer);
    eewEndTimer = null;
  }

  if (eewTimeoutTimer) {
    clearTimeout(eewTimeoutTimer);
    eewTimeoutTimer = null;
  }
}

function endEewMode(reason = "unknown") {
  console.log("EEW終了:", reason);

  clearEewTimers();
  clearSvgEewWaves();

  latestEewData = null;
}

function hasCoordinate(data) {
  return (
    data.latitude !== null &&
    data.latitude !== undefined &&
    data.longitude !== null &&
    data.longitude !== undefined
  );
}

function applyMainTab(tab) {
  currentMainTab = tab;

  updateMainTabUI(tab);

  console.log("タブ切替:", tab);

  if (tab === "earthquake") {
  restoreCurrentPanel();

  setMainMode("earthquake");

  setKyoshinDisplayMode("active-only");
 }
  else if (tab === "kyoshin") {
  restoreCurrentPanel();

  setKyoshinDisplayMode("normal");
  }
  else if (tab === "tsunami") {
  restoreCurrentPanel();

    setKyoshinDisplayMode("active-only");
  }
}

function restoreEewView() {
  if (!latestEewData) {
    return;
  }

  applyMainTab("kyoshin");

  if (latestEewData.isWarning) {
    setMainMode("eew-warning");
  }
  else {
    setMainMode("eew-forecast");
  }

  showEEW(
    latestEewData,
    latestEewData.isWarning,
    latestEewData.reportNumber
  );
}

function showTemporaryEarthquakeInfo(data) {
  if (temporaryInfoTimer) {
    clearTimeout(temporaryInfoTimer);
    temporaryInfoTimer = null;
  }

  applyMainTab("earthquake");

  setMainMode("earthquake");

  updateCurrentInfo(data);
  updateTime();

  updatePoints(
    data.points,
    data.scaleList
  );

  updateSvgIntensityPoints(
    data.points,
    data.scaleList
  );

  if (hasCoordinate(data)) {
    updateSvgHypocenter(
      data.latitude,
      data.longitude
    );
  }

  temporaryInfoTimer =
    setTimeout(() => {
      restoreEewView();
      temporaryInfoTimer = null;
    }, 5000);
}

initializeSvgMap();
setupPanelToggle();

setupMainTabs(tab => {
  applyMainTab(tab);

  if (tab === "tsunami") {
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
});

applyMainTab("earthquake");

socket.on("earthquake", (data) => {
  console.log("地震データ受信:");
  console.log(data);

  if (
    data.telegramType === "VXSE51" ||
    data.telegramType === "VXSE52"
  ) {
    showTemporaryEarthquakeInfo(data);
    return;
  }

  if (data.telegramType === "VXSE53") {
    endEewMode("vxse53");
  }

  applyMainTab("earthquake");

  setMainMode("earthquake");
  setSubPanel("history");

  updateCurrentInfo(data);
  updateTime();

  updatePoints(
    data.points,
    data.scaleList
  );

  updateSvgIntensityPoints(
    data.points,
    data.scaleList
  );

  updateIntensityAreas(
  data.regions ?? []
  );
  
  addHistory(data);

  if (hasCoordinate(data)) {
    updateSvgHypocenter(
      data.latitude,
      data.longitude
    );
  }
});

socket.on("eew", (data) => {
  console.log("EEWデータ受信:");
  console.log(data);

  applyMainTab("kyoshin");

  latestEewData = data;

  clearEewTimers();

  if (data.isCanceled) {
    endEewMode("cancel");
    return;
  }

  if (data.isWarning) {
    setMainMode("eew-warning");
  }
  else {
    setMainMode("eew-forecast");
  }

  showEEW(
    data,
    data.isWarning,
    data.reportNumber
  );

  if (hasCoordinate(data)) {
    updateSvgHypocenter(
      data.latitude,
      data.longitude
    );

    updateSvgEewWaves(
      data,
      {
        replay:
          data.isReplay === true
      }
    );
  }

  if (data.isLastInfo) {
    eewEndTimer =
      setTimeout(() => {
        endEewMode("last-info-timeout");
      }, 60000);
  }
  else {
    eewTimeoutTimer =
      setTimeout(() => {
        endEewMode("no-update-timeout");
      }, 120000);
  }
});

socket.on("kyoshin", (data) => {
  console.log(
    "強震モニタ受信:",
    data.time,
    data.imageSize,
    data.points?.length
  );

  updateKyoshinDots(
    data.points
  );
});

socket.on("tsunami", data => {
  console.log("津波情報受信:", data);

  latestTsunamiInfo = data;

  applyMainTab("tsunami");

  setMainMode("tsunami");

  showTsunamiPanel(data);

  updateTsunamiAreas(
    data.areas ?? []
  );
});

socket.on("dmdata-telegram", (telegram) => {
  console.log("その他dmdata受信:");
  console.log(telegram);
});