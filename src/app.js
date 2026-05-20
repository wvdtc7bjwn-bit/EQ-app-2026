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
  setHistorySelectHandler
} from "./history.js";

import {
  setupMainTabs,
  updateMainTabUI
} from "./mainTabs.js";

import {
  enableExtendedMapInteractions
} from "./map/mapInteractionEnhancer.js";

import {
  initializeMapRenderTweaks
} from "./map/mapRenderTweaks.js";


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
  updateTsunamiAreas,
  setEarthquakeMarkerVisible
} from "./map/japanSvgMap.js";

let currentMainTab = "earthquake";

let eewEndTimer = null;
let eewTimeoutTimer = null;
let temporaryInfoTimer = null;
let latestEewData = null;
let latestEarthquakeData = null;
let previewHistoryEventId = null;

const latestEarthquakeByEventId = new Map();

function getEarthquakeCacheKey(data) {
  return (
    data.eventId ??
    data.event_id ??
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

function getEventId(data) {
  return (
    data?.eventId ??
    data?.event_id ??
    `${data?.time ?? data?.origin_time}-${data?.place ?? ""}`
  );
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
    data?.latitude !== null &&
    data?.latitude !== undefined &&
    data?.longitude !== null &&
    data?.longitude !== undefined
  );
}

function showEarthquakeOnMap(data) {
  updateSvgIntensityPoints(
    data?.points ?? [],
    data?.scaleList ?? {}
  );

  if (hasCoordinate(data)) {
    updateSvgHypocenter(
      data.latitude,
      data.longitude
    );
  }
}

function showLatestEarthquakeOnMap() {
  if (!latestEarthquakeData) {
    return;
  }

  showEarthquakeOnMap(latestEarthquakeData);
}

async function ensureStationPoints(data) {
  if (!data) {
    return data;
  }

  if (Array.isArray(data.points) && data.points.length > 0) {
    return data;
  }

  const eventId = getEventId(data);

  if (!eventId) {
    return data;
  }

  try {
    const response = await fetch(
      `/api/history/${encodeURIComponent(eventId)}/stations`
    );

    if (!response.ok) {
      console.warn("履歴観測点震度API取得失敗:", response.status);
      return data;
    }

    const stationData = await response.json();

    if (!stationData.enabled || !Array.isArray(stationData.items)) {
      return data;
    }

    const points = stationData.items.map(item => ({
      code: item.station_code,
      name: item.station_name,
      intensity: item.intensity ?? "-",
      scale: item.scale ?? 0,
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null
    }));

    const merged = {
      ...data,
      points
    };

    latestEarthquakeByEventId.set(eventId, merged);

    return merged;
  }
  catch (error) {
    console.warn("履歴観測点震度読み込み失敗:");
    console.warn(error);
    return data;
  }
}

async function handleHistorySelect(data) {
  if (currentMainTab !== "earthquake") {
    applyMainTab("earthquake");
  }

  const eventId = getEventId(data);

  if (previewHistoryEventId === eventId) {
    previewHistoryEventId = null;
    showLatestEarthquakeOnMap();
    return;
  }

  const previewData = await ensureStationPoints(data);

  previewHistoryEventId = eventId;
  showEarthquakeOnMap(previewData);
}

function applyMainTab(tab) {
  currentMainTab = tab;

  updateMainTabUI(tab);

  console.log("タブ切替:", tab);

  setLeftPanelTab(tab);

  if (tab === "earthquake") {
    setMainMode("earthquake");
    setKyoshinDisplayMode("active-only");
    setEarthquakeMarkerVisible(true);
  }
  else if (tab === "kyoshin") {
    setKyoshinDisplayMode("normal");
    setEarthquakeMarkerVisible(false);
  }
  else if (tab === "tsunami") {
    setKyoshinDisplayMode("active-only");
    setEarthquakeMarkerVisible(false);
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

  latestEarthquakeData = mergedData;
  previewHistoryEventId = null;

  setLatestEarthquakeInfo(mergedData);

  updateCurrentInfo(mergedData);
  updateTime();

  updatePoints(
    mergedData.points,
    mergedData.scaleList
  );

  showEarthquakeOnMap(mergedData);

  temporaryInfoTimer =
    setTimeout(() => {
      restoreEewView();
      temporaryInfoTimer = null;
    }, 5000);
}

initializeSvgMap();
enableExtendedMapInteractions();
initializeMapRenderTweaks();
setupPanelToggle();
updateTime();
setHistorySelectHandler(handleHistorySelect);

setupMainTabs(tab => {
  applyMainTab(tab);
});

applyMainTab("earthquake");
loadEarthquakeHistory(11).then(latest => {
  if (latest) {
    latestEarthquakeData = latest;
  }
});

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

  latestEarthquakeData = mergedData;
  previewHistoryEventId = null;

  setLatestEarthquakeInfo(mergedData);

  showEarthquakeOnMap(mergedData);

  updateIntensityAreas(
    mergedData.regions ?? []
  );
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