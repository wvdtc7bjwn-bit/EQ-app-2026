const zlib = require("zlib");

const {
  findStationCoordinate
} = require("./data/jmaStationCoordinates.js");

function normalizeBody(body, telegram = {}) {
  if (!body) {
    return null;
  }

  if (typeof body !== "string") {
    return body;
  }

  try {
    if (
      telegram.encoding === "base64" &&
      telegram.compression === "gzip"
    ) {
      const buffer = Buffer.from(body, "base64");
      const decoded = zlib.gunzipSync(buffer).toString("utf-8");
      return JSON.parse(decoded);
    }

    return JSON.parse(body);
  }
  catch (error) {
    console.log("body decode error:");
    console.log(error.message);
    return null;
  }
}

function getReportAndBody(telegram) {
  const report = normalizeBody(telegram.body, telegram);

  return {
    report,
    body: report?.body ?? report ?? null
  };
}

function getScaleList() {
  return {
    10: "1",
    20: "2",
    30: "3",
    40: "4",
    45: "5弱",
    50: "5強",
    55: "6弱",
    60: "6強",
    70: "7"
  };
}

function getIntensityValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "object") {
    return (
      value.value ??
      value.to ??
      value.from ??
      value.max ??
      value.maxInt ??
      value.intensity ??
      null
    );
  }

  return value;
}

function convertDmdataIntensityText(maxInt) {
  const value = getIntensityValue(maxInt);

  const list = {
    "0": "0",
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5-": "5弱",
    "5+": "5強",
    "6-": "6弱",
    "6+": "6強",
    "7": "7",
    "不明": "-"
  };

  return list[value] ?? "-";
}

function convertDmdataIntensityToScale(maxInt) {
  const value = getIntensityValue(maxInt);

  const list = {
    "0": 0,
    "1": 10,
    "2": 20,
    "3": 30,
    "4": 40,
    "5-": 45,
    "5+": 50,
    "6-": 55,
    "6+": 60,
    "7": 70
  };

  return list[value] ?? 0;
}

function formatLongPeriodIntensity(value) {
  const raw = getIntensityValue(value);

  if (
    raw === null ||
    raw === undefined ||
    raw === "" ||
    raw === "0"
  ) {
    return null;
  }

  return `階級${raw}`;
}

function getLongPeriodIntensity(intensity) {
  return (
    formatLongPeriodIntensity(intensity?.maxLgInt) ??
    formatLongPeriodIntensity(intensity?.forecastMaxLgInt) ??
    formatLongPeriodIntensity(intensity?.maxLongPeriodIntensity) ??
    formatLongPeriodIntensity(intensity?.maxLgIntensity) ??
    formatLongPeriodIntensity(intensity?.lgCategory) ??
    null
  );
}

function getNumberValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "object") {
    return getNumberValue(
      value.value ??
      value.latitude ??
      value.longitude ??
      value.lat ??
      value.lng ??
      value.lon
    );
  }

  const number = Number(value);

  return Number.isNaN(number) ? null : number;
}

function getEventId(telegram, report, earthquake) {
  return (
    earthquake?.eventId ??
    report?.eventId ??
    telegram.xmlReport?.head?.eventId ??
    telegram.head?.eventId ??
    telegram.head?.time ??
    new Date().toISOString()
  );
}

function getReportNumber(telegram, report, body) {
  return (
    report?.serialNo ??
    telegram.xmlReport?.head?.serial ??
    telegram.head?.serial ??
    body?.serial ??
    body?.serialNo ??
    null
  );
}

function getMagnitudeValue(earthquake, hypocenter) {
  return (
    earthquake?.magnitude?.value ??
    earthquake?.magnitude?.jmaMagnitude ??
    hypocenter?.magnitude?.value ??
    "-"
  );
}

function getDepthValue(hypocenter) {
  return (
    hypocenter?.depth?.value ??
    hypocenter?.depth ??
    "-"
  );
}

function getHypocenterCoordinate(hypocenter) {
  return (
    hypocenter?.coordinate ??
    hypocenter?.coordinates ??
    null
  );
}

function getReportTime(telegram, report, earthquake) {
  return (
    earthquake?.originTime ??
    earthquake?.arrivalTime ??
    report?.targetDateTime ??
    report?.reportDateTime ??
    report?.pressDateTime ??
    telegram.xmlReport?.head?.targetDateTime ??
    telegram.head?.time ??
    new Date().toISOString()
  );
}

function getPointCoordinate(source) {
  return (
    source?.coordinate ??
    source?.point?.coordinate ??
    source?.location?.coordinate ??
    source?.position ??
    null
  );
}

function normalizeStationPoint(station, parent = {}) {
  const coordinate = getPointCoordinate(station);

  const stationLocation = findStationCoordinate({
    code: station?.code,
    name:
      station?.name ??
      station?.addr ??
      station?.address ??
      parent?.name
  });

  const latitude =
    getNumberValue(
      station?.latitude ??
      station?.lat ??
      coordinate?.latitude ??
      coordinate?.lat
    ) ??
    stationLocation?.latitude ??
    null;

  const longitude =
    getNumberValue(
      station?.longitude ??
      station?.lng ??
      station?.lon ??
      coordinate?.longitude ??
      coordinate?.lng ??
      coordinate?.lon
    ) ??
    stationLocation?.longitude ??
    null;

  const rawIntensity =
    station?.int ??
    station?.intensity ??
    station?.maxInt ??
    station?.scale ??
    station?.kind?.code ??
    parent?.maxInt ??
    parent?.intensity ??
    null;

  const scale =
    typeof rawIntensity === "number"
      ? rawIntensity
      : convertDmdataIntensityToScale(rawIntensity);

  return {
    code: station?.code ?? null,
    name:
      station?.name ??
      station?.addr ??
      station?.address ??
      parent?.name ??
      stationLocation?.name ??
      "観測点",
    latitude,
    longitude,
    scale,
    intensity: convertDmdataIntensityText(rawIntensity),
    raw: station
  };
}

function extractNestedStations(node, parent = {}, result = []) {
  if (!node || typeof node !== "object") {
    return result;
  }

  if (Array.isArray(node)) {
    node.forEach(item => extractNestedStations(item, parent, result));
    return result;
  }

  const currentParent = {
    ...parent,
    name: node.name ?? node.addr ?? parent.name,
    maxInt: node.maxInt ?? node.intensity ?? node.int ?? parent.maxInt
  };

  const coordinate = getPointCoordinate(node);
  const hasLatLng = getNumberValue(
    node.latitude ?? node.lat ?? coordinate?.latitude ?? coordinate?.lat
  ) !== null && getNumberValue(
    node.longitude ?? node.lng ?? node.lon ?? coordinate?.longitude ?? coordinate?.lng ?? coordinate?.lon
  ) !== null;

  const hasIntensity = getIntensityValue(
    node.int ?? node.intensity ?? node.maxInt ?? node.scale ?? node.kind?.code
  ) !== null;

  if (hasLatLng && hasIntensity) {
    result.push(normalizeStationPoint(node, currentParent));
  }

  const childKeys = [
    "stations",
    "points",
    "cities",
    "city",
    "wards",
    "areas",
    "regions",
    "prefectures",
    "items",
    "observations"
  ];

  childKeys.forEach(key => {
    if (node[key]) {
      extractNestedStations(node[key], currentParent, result);
    }
  });

  return result;
}

function normalizeStations(intensity) {
  if (!intensity) {
    return [];
  }

  const directStations =
    intensity?.stations ??
    intensity?.points ??
    intensity?.observation?.stations ??
    [];

  const result = [];

  if (Array.isArray(directStations)) {
    directStations.forEach(station => {
      result.push(normalizeStationPoint(station));
    });
  }

  extractNestedStations(intensity, {}, result);

  const unique = new Map();

  result.forEach(point => {
    if (
      point.latitude === null ||
      point.longitude === null
    ) {
      return;
    }

    const key = `${point.code ?? point.name}-${point.latitude}-${point.longitude}`;
    unique.set(key, point);
  });

  return [...unique.values()];
}

function parseDmdataEarthquake(telegram) {
  const { report, body } = getReportAndBody(telegram);

  const earthquake = body?.earthquake;
  const hypocenter = earthquake?.hypocenter;
  const coordinate = getHypocenterCoordinate(hypocenter);
  const intensity = body?.intensity;
  const maxInt = intensity?.maxInt;

  return {
    eventId: getEventId(telegram, report, earthquake),
    reportNumber: getReportNumber(telegram, report, body),
    place: hypocenter?.name ?? "震源調査中",
    scale: convertDmdataIntensityToScale(maxInt),
    intensity: convertDmdataIntensityText(maxInt),
    longPeriodIntensity: getLongPeriodIntensity(intensity),
    magnitude: getMagnitudeValue(earthquake, hypocenter),
    depth: getDepthValue(hypocenter),
    latitude: getNumberValue(coordinate?.latitude),
    longitude: getNumberValue(coordinate?.longitude),
    time: getReportTime(telegram, report, earthquake),
    points: normalizeStations(intensity),
    scaleList: getScaleList(),
    telegramType: telegram.head?.type ?? "VXSE53"
  };
}

function parseVXSE51(telegram) {
  const { report, body } = getReportAndBody(telegram);
  const intensity = body?.intensity;
  const maxInt = intensity?.maxInt;

  return {
    eventId: getEventId(telegram, report, body?.earthquake),
    reportNumber: getReportNumber(telegram, report, body),
    place: "震源調査中",
    scale: convertDmdataIntensityToScale(maxInt),
    intensity: convertDmdataIntensityText(maxInt),
    longPeriodIntensity: getLongPeriodIntensity(intensity),
    magnitude: "-",
    depth: "-",
    latitude: null,
    longitude: null,
    time: body?.pressDateTime ?? getReportTime(telegram, report, body?.earthquake),
    points: normalizeStations(intensity),
    scaleList: getScaleList(),
    telegramType: "VXSE51"
  };
}

function parseVXSE52(telegram) {
  const { report, body } = getReportAndBody(telegram);
  const earthquake = body?.earthquake;
  const hypocenter = earthquake?.hypocenter;
  const coordinate = getHypocenterCoordinate(hypocenter);

  return {
    eventId: getEventId(telegram, report, earthquake),
    reportNumber: getReportNumber(telegram, report, body),
    place: hypocenter?.name ?? "震源調査中",
    scale: 0,
    intensity: "-",
    longPeriodIntensity: null,
    magnitude: getMagnitudeValue(earthquake, hypocenter),
    depth: getDepthValue(hypocenter),
    latitude: getNumberValue(coordinate?.latitude),
    longitude: getNumberValue(coordinate?.longitude),
    time: getReportTime(telegram, report, earthquake),
    points: [],
    scaleList: getScaleList(),
    telegramType: "VXSE52"
  };
}

function parseDmdataEew(telegram) {
  const { report, body } = getReportAndBody(telegram);
  const earthquake = body?.earthquake;
  const hypocenter = earthquake?.hypocenter;
  const coordinate = getHypocenterCoordinate(hypocenter);
  const intensity = body?.intensity;

  const maxInt =
    intensity?.forecastMaxInt ??
    intensity?.maxInt ??
    body?.forecastMaxInt ??
    body?.maxInt;

  return {
    eventId: getEventId(telegram, report, earthquake),
    type: telegram.head?.type,
    telegramType: telegram.head?.type ?? "VXSE45",
    isReplay: telegram.__replay === true,
    isWarning: body?.isWarning === true,
    isLastInfo: body?.isLastInfo === true,
    isCanceled: body?.isCanceled === true,
    reportNumber: getReportNumber(telegram, report, body),
    place: hypocenter?.name ?? "震源調査中",
    scale: convertDmdataIntensityToScale(maxInt),
    intensity: convertDmdataIntensityText(maxInt),
    longPeriodIntensity: getLongPeriodIntensity(intensity),
    magnitude: getMagnitudeValue(earthquake, hypocenter),
    depth: getDepthValue(hypocenter),
    latitude: getNumberValue(coordinate?.latitude),
    longitude: getNumberValue(coordinate?.longitude),
    time: getReportTime(telegram, report, earthquake),
    regions: intensity?.regions ?? body?.regions ?? []
  };
}

module.exports = {
  parseDmdataEarthquake,
  parseVXSE51,
  parseVXSE52,
  parseDmdataEew
};