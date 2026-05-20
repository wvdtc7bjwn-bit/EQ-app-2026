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
  loadEarthquakeHistory
} from "./historyLoader.js";

import {
  setupMainTabs,
  updateMainTabUI
} from "./mainTabs.js";


import {
  setLeftPanelTab,
  setLatestEarthquakeInfo,
  setLatestEewInfo,
  clearLatestEewInfo,
  setLatestTsunamiInfo
} from "./leftPanelController.js";

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

let eewEndTimer = null;
let eewTimeoutTimer = null;
let temporaryInfoTimer = null;
let latestEewData = null;

const latestEarthquakeByEventId = new Map();

function getEarthquakeCacheKey(data) {
  return (
    data.eventId ??
    data.time ??
    "latest"
  );
}

function hasValidIntensity(data) {
  return (
    data &&
    data.intensity !== null &&
    data.intensity !== undefined &&
    data.intensity !== "" &&
    data.intensity !== "-"
  );
}

function mergeEarthquakeInfo(data) {
  const key = getEarthquakeCacheKey(data);
  const previous = latestEarthquakeByEventId.get(key);

  const merged = {
    ...(previous ?? {}),
    ...data
  };

  if (!hasValidIntensity(data) && hasValidIntensity(previous)) {
    merged.intensity = previous.intensity;
    merged.scale = previous.scale;
    merged.longPeriodIntensity = previous.longPeriodIntensity;
  }

  if (
    (!data.points || data.points.length === 0) &&
    previous?.points?.length > 0
  ) {
    merged.points = previous.points;
  }

  if (!data.scaleList && previous?.scaleList) {
    merged.scaleList = previous.scaleList;
  }

  latestEarthquakeByEventId.set(key, merged);

  return merged;
}

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

  clearLatestEewInfo();
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

  setLeftPanelTab(tab);

  if (tab === "earthquake") {
    setMainMode("earthquake");
    setKyoshinDisplayMode("active-only");
  }
  else if (tab === "kyoshin") {
    setKyoshinDisplayMode("normal");
  }
  else if (tab === "tsunami") {
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
  const mergedData = mergeEarthquakeInfo(data);

  if (temporaryInfoTimer) {
    clearTimeout(temporaryInfoTimer);
    temporaryInfoTimer = null;
  }

  applyMainTab("earthquake");

  setMainMode("earthquake");

  setLatestEarthquakeInfo(mergedData);

  updateCurrentInfo(mergedData);
  updateTime();

  updatePoints(
    mergedData.points,
    mergedData.scaleList
  );

  updateSvgIntensityPoints(
    mergedData.points,
    mergedData.scaleList
  );

  if (hasCoordinate(mergedData)) {
    updateSvgHypocenter(
      mergedData.latitude,
      mergedData.longitude
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
updateTime();

setupMainTabs(tab => {
  applyMainTab(tab);
});

applyMainTab("earthquake");
loadEarthquakeHistory(11);

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

  const mergedData = mergeEarthquakeInfo(data);

  if (mergedData.telegramType === "VXSE53") {
    endEewMode("vxse53");
  }

  applyMainTab("earthquake");

  setLatestEarthquakeInfo(mergedData);

  updateSvgIntensityPoints(
    mergedData.points,
    mergedData.scaleList
  );

  updateIntensityAreas(
    mergedData.regions ?? []
  );

  if (hasCoordinate(mergedData)) {
    updateSvgHypocenter(
      mergedData.latitude,
      mergedData.longitude
    );
  }
});

socket.on("eew", (data) => {
  console.log("EEWデータ受信:");
  console.log(data);

  applyMainTab("kyoshin");

  latestEewData = data;

  setLatestEewInfo(data);

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

  setLatestTsunamiInfo(data);

  applyMainTab("tsunami");

  updateTsunamiAreas(
    data.areas ?? []
  );
});

socket.on("dmdata-telegram", (telegram) => {
  console.log("その他dmdata受信:");
  console.log(telegram);
});