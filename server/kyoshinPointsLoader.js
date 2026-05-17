const fs = require("fs");
const path = require("path");

const POINTS_PATH =
  path.join(
    __dirname,
    "../server-data/kyoshinStations.json"
  );

function normalizePoint(point) {
  return {
    code:
      point.code ??
      point.id ??
      point.name,

    name:
      point.name ??
      point.code ??
      "観測点",

    lat:
      Number(
        point.lat ??
        point.latitude
      ),

    lon:
      Number(
        point.lon ??
        point.lng ??
        point.longitude
      ),

    pixelX:
      Number(
        point.pixelX ??
        point.x ??
        point.point?.x
      ),

    pixelY:
      Number(
        point.pixelY ??
        point.y ??
        point.point?.y
      )
  };
}

function loadKyoshinStations() {
  if (!fs.existsSync(POINTS_PATH)) {
    console.log(
      "強震モニタ観測点マスターがありません:",
      POINTS_PATH
    );

    return [];
  }

  const raw =
    fs.readFileSync(
      POINTS_PATH,
      "utf-8"
    );

  const json =
    JSON.parse(raw);

  const list =
    Array.isArray(json)
      ? json
      : json.points ?? json.items ?? [];

  const points =
    list
      .map(normalizePoint)
      .filter(point =>
        Number.isFinite(point.lat) &&
        Number.isFinite(point.lon) &&
        Number.isFinite(point.pixelX) &&
        Number.isFinite(point.pixelY)
      );

  console.log(
    `強震モニタ観測点ロード: ${points.length}点`
  );

  return points;
}

module.exports = {
  loadKyoshinStations
};