const {
  isDatabaseEnabled,
  query
} = require("../database");

async function saveStationIntensities(eventId, points = []) {
  if (!isDatabaseEnabled()) {
    return;
  }

  if (!eventId || !Array.isArray(points) || points.length === 0) {
    return;
  }

  for (const point of points) {
    if (!point?.code) {
      continue;
    }

    await query(
      `
        INSERT INTO station_intensities (
          event_id,
          station_code,
          station_name,
          intensity,
          scale,
          latitude,
          longitude,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, NOW()
        )
        ON CONFLICT (event_id, station_code)
        DO UPDATE SET
          station_name = COALESCE(EXCLUDED.station_name, station_intensities.station_name),
          intensity = COALESCE(EXCLUDED.intensity, station_intensities.intensity),
          scale = COALESCE(EXCLUDED.scale, station_intensities.scale),
          latitude = COALESCE(EXCLUDED.latitude, station_intensities.latitude),
          longitude = COALESCE(EXCLUDED.longitude, station_intensities.longitude),
          updated_at = NOW()
      `,
      [
        eventId,
        String(point.code),
        point.name ?? null,
        point.intensity ?? null,
        point.scale ?? null,
        point.latitude ?? null,
        point.longitude ?? null
      ]
    );
  }
}

module.exports = {
  saveStationIntensities
};
