const express = require("express");

const {
  isDatabaseEnabled,
  query
} = require("../database");

const router = express.Router();

router.get("/history", async (req, res) => {
  if (!isDatabaseEnabled()) {
    res.json({
      enabled: false,
      items: []
    });
    return;
  }

  const limit = Math.min(
    Number(req.query.limit) || 20,
    100
  );

  try {
    const result = await query(
      `
        SELECT
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
          updated_at,
          created_at
        FROM earthquake_events
        ORDER BY origin_time DESC NULLS LAST, updated_at DESC
        LIMIT $1
      `,
      [limit]
    );

    res.json({
      enabled: true,
      items: result.rows
    });
  }
  catch (error) {
    console.error("地震履歴APIエラー:");
    console.error(error);

    res.status(500).json({
      enabled: true,
      error: "history_query_failed",
      items: []
    });
  }
});

router.get("/history/:eventId/stations", async (req, res) => {
  if (!isDatabaseEnabled()) {
    res.json({
      enabled: false,
      items: []
    });
    return;
  }

  try {
    const result = await query(
      `
        SELECT
          event_id,
          station_code,
          station_name,
          intensity,
          scale,
          latitude,
          longitude,
          updated_at
        FROM station_intensities
        WHERE event_id = $1
        ORDER BY scale DESC NULLS LAST, station_code ASC
      `,
      [req.params.eventId]
    );

    res.json({
      enabled: true,
      eventId: req.params.eventId,
      items: result.rows
    });
  }
  catch (error) {
    console.error("観測点震度履歴APIエラー:");
    console.error(error);

    res.status(500).json({
      enabled: true,
      error: "station_query_failed",
      items: []
    });
  }
});

module.exports = router;
