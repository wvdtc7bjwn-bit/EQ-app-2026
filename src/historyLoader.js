import {
  addHistory
} from "./history.js";

import {
  setLatestEarthquakeInfo
} from "./leftPanelController.js";

import {
  updateSvgHypocenter,
  updateSvgIntensityPoints
} from "./map/japanSvgMap.js";

function normalizeHistoryItem(item) {
  return {
    eventId: item.event_id,
    telegramType: item.telegram_type,
    reportNumber: item.report_number,
    place: item.place ?? "震源調査中",
    time: item.origin_time ?? item.updated_at ?? item.created_at,
    magnitude: item.magnitude ?? "-",
    depth: item.depth ?? "-",
    intensity: item.max_intensity ?? "-",
    scale: item.max_scale ?? 0,
    longPeriodIntensity: item.long_period_intensity ?? null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    points: [],
    scaleList: {}
  };
}

function normalizeStationItem(item) {
  return {
    code: item.station_code,
    name: item.station_name,
    intensity: item.intensity ?? "-",
    scale: item.scale ?? 0,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null
  };
}

function hasCoordinate(data) {
  return (
    data?.latitude !== null &&
    data?.latitude !== undefined &&
    data?.longitude !== null &&
    data?.longitude !== undefined
  );
}

async function loadStationIntensities(eventId) {
  if (!eventId) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/history/${encodeURIComponent(eventId)}/stations`
    );

    if (!response.ok) {
      console.warn("観測点震度API取得失敗:", response.status);
      return [];
    }

    const data = await response.json();

    if (!data.enabled || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map(normalizeStationItem);
  }
  catch (error) {
    console.warn("観測点震度読み込み失敗:");
    console.warn(error);
    return [];
  }
}

function restoreLatestEarthquakeOnMap(latest) {
  updateSvgIntensityPoints(
    latest.points,
    latest.scaleList
  );

  if (hasCoordinate(latest)) {
    updateSvgHypocenter(
      latest.latitude,
      latest.longitude
    );
  }
}

export async function loadEarthquakeHistory(limit = 11) {
  try {
    const response = await fetch(`/api/history?limit=${limit + 1}`);

    if (!response.ok) {
      console.warn("地震履歴API取得失敗:", response.status);
      return;
    }

    const data = await response.json();

    if (!data.enabled) {
      console.log("DB履歴取得は無効です");
      return;
    }

    const items = Array.isArray(data.items)
      ? data.items.map(normalizeHistoryItem)
      : [];

    if (items.length === 0) {
      return;
    }

    const [latest, ...historyItems] = items;

    latest.points = await loadStationIntensities(latest.eventId);

    setLatestEarthquakeInfo(latest);
    restoreLatestEarthquakeOnMap(latest);

    historyItems
      .slice(0, limit)
      .reverse()
      .forEach(item => {
        addHistory(item);
      });
  }
  catch (error) {
    console.warn("地震履歴読み込み失敗:");
    console.warn(error);
  }
}
