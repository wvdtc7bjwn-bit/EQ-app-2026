// JMA震度観測点の座標補完用データ。
// VXSE53には基本的に緯度経度が含まれないため、観測点コードまたは観測点名から座標を補完します。

let stationCoordinatesByCode = {};

try {
  stationCoordinatesByCode = require("../local-data/stations.compact.json");
}
catch (error) {
  console.warn(
    "stations.compact.json が読み込めません。観測点座標補完は無効です。",
    error.message
  );
}

function normalizeStationName(name) {
  if (!name) {
    return "";
  }

  return String(name)
    .replace(/\s+/g, "")
    .replace(/[　]/g, "")
    .trim();
}

function buildNormalizedNameIndex() {
  const index = {};

  Object.values(stationCoordinatesByCode).forEach(value => {
    if (value?.name) {
      index[normalizeStationName(value.name)] = value;
    }
  });

  return index;
}

const normalizedStationCoordinatesByName = buildNormalizedNameIndex();

function findStationCoordinate({ code, name }) {
  if (code) {
    const byCode = stationCoordinatesByCode[String(code)];

    if (byCode) {
      return byCode;
    }
  }

  const normalizedName = normalizeStationName(name);

  if (normalizedName) {
    const byName = normalizedStationCoordinatesByName[normalizedName];

    if (byName) {
      return byName;
    }
  }

  return null;
}

module.exports = {
  stationCoordinatesByCode,
  findStationCoordinate
};
