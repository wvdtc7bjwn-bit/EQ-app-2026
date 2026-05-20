const {
  isDatabaseEnabled,
  query
} = require("../database");

function toDateOrNull(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

async function saveEarthquakeEvent(data) {
  if (!isDatabaseEnabled()) {
    return;
  }

  if (!data?.eventId) {
    return;
  }

  await query(
    `
      INSERT INTO earthquake_events (
        event_id,
        telegram_type,
        report_number,
        place,
        origin_time,
        magnitude,
        depth,
        max_intensity,
        max_scale,
        long_period_intensity,
        latitude,
        longitude,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, NOW()
      )
      ON CONFLICT (event_id)
      DO UPDATE SET
        telegram_type = EXCLUDED.telegram_type,
        report_number = EXCLUDED.report_number,
        place = COALESCE(EXCLUDED.place, earthquake_events.place),
        origin_time = COALESCE(EXCLUDED.origin_time, earthquake_events.origin_time),
        magnitude = COALESCE(EXCLUDED.magnitude, earthquake_events.magnitude),
        depth = COALESCE(EXCLUDED.depth, earthquake_events.depth),
        max_intensity = COALESCE(EXCLUDED.max_intensity, earthquake_events.max_intensity),
        max_scale = COALESCE(EXCLUDED.max_scale, earthquake_events.max_scale),
        long_period_intensity = COALESCE(EXCLUDED.long_period_intensity, earthquake_events.long_period_intensity),
        latitude = COALESCE(EXCLUDED.latitude, earthquake_events.latitude),
        longitude = COALESCE(EXCLUDED.longitude, earthquake_events.longitude),
        updated_at = NOW()
    `,
    [
      data.eventId,
      data.telegramType ?? null,
      data.reportNumber === null || data.reportNumber === undefined
        ? null
        : String(data.reportNumber),
      data.place ?? null,
      toDateOrNull(data.time),
      data.magnitude === null || data.magnitude === undefined
        ? null
        : String(data.magnitude),
      data.depth === null || data.depth === undefined
        ? null
        : String(data.depth),
      data.intensity ?? null,
      data.scale ?? null,
      data.longPeriodIntensity ?? null,
      data.latitude ?? null,
      data.longitude ?? null
    ]
  );
}

module.exports = {
  saveEarthquakeEvent
};
