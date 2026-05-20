const {
  isDatabaseEnabled,
  query
} = require("../database");

async function initDatabase() {
  if (!isDatabaseEnabled()) {
    console.log("DATABASE_URL未設定のためDB初期化をスキップします");
    return;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS earthquake_events (
      event_id TEXT PRIMARY KEY,
      telegram_type TEXT,
      report_number TEXT,
      place TEXT,
      origin_time TIMESTAMPTZ,
      magnitude TEXT,
      depth TEXT,
      max_intensity TEXT,
      max_scale INTEGER,
      long_period_intensity TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS station_intensities (
      event_id TEXT NOT NULL,
      station_code TEXT NOT NULL,
      station_name TEXT,
      intensity TEXT,
      scale INTEGER,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (event_id, station_code)
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_earthquake_events_origin_time
    ON earthquake_events(origin_time DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_station_intensities_event_id
    ON station_intensities(event_id)
  `);

  console.log("DB初期化完了");
}

module.exports = {
  initDatabase
};
