import {
  jma2001TravelTime
} from "./data/jma2001TravelTime.js";

export function getDistanceFromTravelTime(
  waveType,
  elapsedSec
) {
  if (
    elapsedSec === null ||
    elapsedSec === undefined ||
    elapsedSec < 0
  ) {
    return 0;
  }

  const timeKey =
    waveType === "S"
      ? "sTime"
      : "pTime";

  const table =
    jma2001TravelTime;

  if (elapsedSec <= table[0][timeKey]) {
    return table[0].distanceKm;
  }

  for (let i = 0; i < table.length - 1; i++) {
    const current =
      table[i];

    const next =
      table[i + 1];

    const t1 =
      current[timeKey];

    const t2 =
      next[timeKey];

    if (
      elapsedSec >= t1 &&
      elapsedSec <= t2
    ) {
      const ratio =
        (elapsedSec - t1) /
        (t2 - t1);

      return (
        current.distanceKm +
        ratio *
          (
            next.distanceKm -
            current.distanceKm
          )
      );
    }
  }

  return table[
    table.length - 1
  ].distanceKm;
}