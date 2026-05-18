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
  initializeSvgMap,
  updateSvgHypocenter,
  updateSvgIntensityPoints,
  updateSvgEewWaves,
  clearSvgEewWaves,
  updateKyoshinDots
} from "./map/japanSvgMap.js";

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

function restoreEewView() {
  if (!latestEewData) {
    return;
  }

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

socket.on("dmdata-telegram", (telegram) => {
  console.log("その他dmdata受信:");
  console.log(telegram);
});