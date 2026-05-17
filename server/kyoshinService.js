const sharp = require("sharp");

const {
  loadKyoshinStations
} = require("./kyoshinPointsLoader");

const UPDATE_INTERVAL_MS = 1000;
const IMAGE_DELAY_MS = 3000;
const RETRY_SECONDS = 5;

let timer = null;
let stations = [];

function formatJstDate(date) {
  const jst =
    new Date(
      date.getTime() +
        9 * 60 * 60 * 1000
    );

  const yyyy =
    jst.getUTCFullYear();

  const mm =
    String(jst.getUTCMonth() + 1)
      .padStart(2, "0");

  const dd =
    String(jst.getUTCDate())
      .padStart(2, "0");

  const hh =
    String(jst.getUTCHours())
      .padStart(2, "0");

  const mi =
    String(jst.getUTCMinutes())
      .padStart(2, "0");

  const ss =
    String(jst.getUTCSeconds())
      .padStart(2, "0");

  return {
    ymd: `${yyyy}${mm}${dd}`,
    ymdhms:
      `${yyyy}${mm}${dd}${hh}${mi}${ss}`
  };
}

function buildKyoshinUrl(
  date,
  dataType = "jma",
  underground = false
) {
  const {
    ymd,
    ymdhms
  } = formatJstDate(date);

  const layer =
    underground ? "b" : "s";

  return (
    "http://www.kmoni.bosai.go.jp" +
    `/data/map_img/RealTimeImg/${dataType}_${layer}` +
    `/${ymd}/${ymdhms}.${dataType}_${layer}.gif`
  );
}

async function fetchImageBuffer(url) {
  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
}

async function fetchLatestImage() {
  const baseTime =
    Date.now() - IMAGE_DELAY_MS;

  let lastError = null;

  for (let i = 0; i <= RETRY_SECONDS; i++) {
    const targetTime =
      new Date(
        baseTime - i * 1000
      );

    const url =
      buildKyoshinUrl(
        targetTime,
        "jma",
        false
      );

    try {
      const buffer =
        await fetchImageBuffer(url);

      return {
        buffer,
        url,
        targetTime
      };
    }
    catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function isInvalidColor(r, g, b, a) {
  if (a === 0) {
    return true;
  }

  // 黒背景・ほぼ黒を除外
  if (
    r < 8 &&
    g < 8 &&
    b < 8
  ) {
    return true;
  }

  // 完全白系ノイズを除外したい場合
  // 地図境界線などを拾う場合の保険
  if (
    r > 248 &&
    g > 248 &&
    b > 248
  ) {
    return true;
  }

  return false;
}

async function parseKyoshinImage(buffer) {
  const image =
    sharp(buffer, {
      animated: false
    });

  const metadata =
    await image.metadata();

  const raw =
    await image
      .ensureAlpha()
      .raw()
      .toBuffer();

  const points =
    stations
      .map(station => {
        const x =
          Math.round(
            station.pixelX
          );

        const y =
          Math.round(
            station.pixelY
          );

        if (
          x < 0 ||
          y < 0 ||
          x >= metadata.width ||
          y >= metadata.height
        ) {
          return null;
        }

        const index =
          (
            y * metadata.width +
            x
          ) * 4;

        const r = raw[index];
        const g = raw[index + 1];
        const b = raw[index + 2];
        const a = raw[index + 3];

        if (
          isInvalidColor(
            r,
            g,
            b,
            a
          )
        ) {
          return null;
        }

        return {
          code:
            station.code,

          name:
            station.name,

          latitude:
            station.lat,

          longitude:
            station.lon,

          color:
            `rgb(${r}, ${g}, ${b})`,

          rgb:
            [r, g, b],

          pixelX:
            x,

          pixelY:
            y
        };
      })
      .filter(Boolean);

  return {
    width: metadata.width,
    height: metadata.height,
    points
  };
}

async function updateKyoshin(io) {
  if (stations.length === 0) {
    return;
  }

  try {
    const {
      buffer,
      url,
      targetTime
    } = await fetchLatestImage();

    const result =
      await parseKyoshinImage(buffer);

    io.emit("kyoshin", {
      time:
        targetTime.toISOString(),

      url,

      imageSize: {
        width:
          result.width,

        height:
          result.height
      },

      points:
        result.points
    });

    console.log(
      `強震モニタ更新: ${result.points.length}点 / ${stations.length}点`
    );
  }
  catch (error) {
    console.log(
      "強震モニタ取得失敗:",
      error.message
    );
  }
}

function startKyoshinMonitor(io) {
  if (timer) {
    return;
  }

  stations =
    loadKyoshinStations();

  console.log(
    "強震モニタ監視開始"
  );

  updateKyoshin(io);

  timer =
    setInterval(() => {
      updateKyoshin(io);
    }, UPDATE_INTERVAL_MS);
}

function stopKyoshinMonitor() {
  if (!timer) {
    return;
  }

  clearInterval(timer);
  timer = null;
}

module.exports = {
  startKyoshinMonitor,
  stopKyoshinMonitor
};