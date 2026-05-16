import {
  jma2001TravelTime
} from "./data/jma2001TravelTime.js";

export function getWaveDistancesByJma2001(
  depthKm,
  elapsedSec
) {
  return {
    pDistanceKm:
      getDistanceFromTravelTime(
        "P",
        depthKm,
        elapsedSec
      ),

    sDistanceKm:
      getDistanceFromTravelTime(
        "S",
        depthKm,
        elapsedSec
      )
  };
}

function getDistanceFromTravelTime(
  waveType,
  depthKm,
  elapsedSec
) {
  if (
    elapsedSec === null ||
    elapsedSec === undefined ||
    elapsedSec <= 0
  ) {
    return 0;
  }

  const depthTable =
    getNearestDepthTable(depthKm);

  const timeKey =
    waveType === "S"
      ? "sTime"
      : "pTime";

  return lookupDistanceByTime(
    depthTable,
    timeKey,
    elapsedSec
  );
}

function getNearestDepthTable(depthKm) {
  const depth =
    normalizeDepth(depthKm);

  const depths =
    Object.keys(jma2001TravelTime)
      .map(Number)
      .sort((a, b) => a - b);

  let nearest =
    depths[0];

  depths.forEach(value => {
    if (
      Math.abs(value - depth) <
      Math.abs(nearest - depth)
    ) {
      nearest = value;
    }
  });

  return jma2001TravelTime[nearest];
}

function normalizeDepth(depthKm) {
  const value =
    Number(depthKm);

  if (Number.isNaN(value)) {
    return 10;
  }

  return Math.max(
    0,
    Math.min(
      700,
      value
    )
  );
}

function lookupDistanceByTime(
  table,
  timeKey,
  elapsedSec
) {
  if (!Array.isArray(table) || table.length === 0) {
    return 0;
  }

  if (elapsedSec <= table[0][timeKey]) {
    return table[0].distanceKm;
  }

  const last =
    table[table.length - 1];

  if (elapsedSec >= last[timeKey]) {
    return last.distanceKm;
  }

  let low = 0;
  let high =
    table.length - 1;

  while (low < high - 1) {
    const mid =
      Math.floor(
        (low + high) / 2
      );

    if (table[mid][timeKey] <= elapsedSec) {
      low = mid;
    }
    else {
      high = mid;
    }
  }

  const a =
    table[low];

  const b =
    table[high];

  const t1 =
    a[timeKey];

  const t2 =
    b[timeKey];

  const ratio =
    (elapsedSec - t1) /
    (t2 - t1);

  return (
    a.distanceKm +
    ratio *
      (
        b.distanceKm -
        a.distanceKm
      )
  );
}