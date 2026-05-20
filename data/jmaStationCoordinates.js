// JMA震度観測点の座標補完用データ。
// VXSE53には基本的に緯度経度が含まれないため、観測点コードまたは観測点名から座標を補完します。
//
// 今後、気象庁などの公開マスターデータから正式な観測点データを追加していきます。

const stationCoordinatesByCode = {
  // 例:
  // "123456": {
  //   name: "東京千代田区大手町",
  //   latitude: 35.6895,
  //   longitude: 139.6917
  // }
};

const stationCoordinatesByName = {
  // 例:
  // "東京千代田区大手町": {
  //   latitude: 35.6895,
  //   longitude: 139.6917
  // }
};

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

  Object.entries(stationCoordinatesByName).forEach(([name, value]) => {
    index[normalizeStationName(name)] = value;
  });

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
  stationCoordinatesByName,
  findStationCoordinate
};
