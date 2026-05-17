const zlib = require("zlib");

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
      const buffer =
        Buffer.from(body, "base64");

      const decoded =
        zlib.gunzipSync(buffer).toString("utf-8");

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

function convertDmdataIntensityText(maxInt) {
  const value =
    getIntensityValue(maxInt);

  const list = {
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
  const value =
    getIntensityValue(maxInt);

  const list = {
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
      value.from ??
      value.to ??
      value.max ??
      null
    );
  }

  return value;
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
      value.longitude
    );
  }

  const number =
    Number(value);

  return Number.isNaN(number)
    ? null
    : number;
}

function getEventId(telegram, earthquake) {
  return (
    earthquake?.eventId ??
    telegram.xmlReport?.head?.eventId ??
    telegram.head?.eventId ??
    telegram.head?.time ??
    new Date().toISOString()
  );
}

function getLongPeriodIntensity(intensity) {
  return (
    intensity?.maxLgInt ??
    intensity?.maxLongPeriodIntensity ??
    intensity?.maxLgIntensity ??
    intensity?.lgCategory ??
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

function normalizeStationPoint(station) {
  const coordinate =
    station?.coordinate ??
    station?.point?.coordinate ??
    station?.location?.coordinate ??
    station?.position ??
    null;

  const latitude =
    getNumberValue(
      station?.latitude ??
      station?.lat ??
      coordinate?.latitude ??
      coordinate?.lat
    );

  const longitude =
    getNumberValue(
      station?.longitude ??
      station?.lng ??
      station?.lon ??
      coordinate?.longitude ??
      coordinate?.lng ??
      coordinate?.lon
    );

  const rawIntensity =
    station?.intensity ??
    station?.maxInt ??
    station?.scale ??
    station?.kind?.code ??
    null;

  const scale =
    typeof rawIntensity === "number"
      ? rawIntensity
      : convertDmdataIntensityToScale(rawIntensity);

  return {
    code:
      station?.code ?? null,

    name:
      station?.name ??
      station?.addr ??
      station?.address ??
      "観測点",

    latitude,

    longitude,

    scale,

    intensity:
      convertDmdataIntensityText(rawIntensity),

    raw:
      station
  };
}

function normalizeStations(intensity) {
  const stations =
    intensity?.stations ??
    intensity?.points ??
    intensity?.observation?.stations ??
    [];

  if (!Array.isArray(stations)) {
    return [];
  }

  return stations.map(
    normalizeStationPoint
  );
}

function parseDmdataEarthquake(telegram) {
  const body =
    normalizeBody(telegram.body, telegram);

  const earthquake =
    body?.earthquake;

  const hypocenter =
    earthquake?.hypocenter;

  const coordinate =
    getHypocenterCoordinate(hypocenter);

  const intensity =
    body?.intensity;

  const maxInt =
    intensity?.maxInt;

  return {
    eventId:
      getEventId(telegram, earthquake),

    place:
      hypocenter?.name ?? "震源調査中",

    scale:
      convertDmdataIntensityToScale(maxInt),

    intensity:
      convertDmdataIntensityText(maxInt),

    longPeriodIntensity:
      getLongPeriodIntensity(intensity),

    magnitude:
      getMagnitudeValue(earthquake, hypocenter),

    depth:
      getDepthValue(hypocenter),

    latitude:
      getNumberValue(
        coordinate?.latitude
      ),

    longitude:
      getNumberValue(
        coordinate?.longitude
      ),

    time:
      earthquake?.originTime ??
      earthquake?.arrivalTime ??
      telegram.xmlReport?.head?.targetDateTime ??
      telegram.head?.time ??
      new Date().toISOString(),

    points:
      normalizeStations(intensity),

    scaleList:
      getScaleList()
  };
}

function parseVXSE51(telegram) {
  const body =
    normalizeBody(telegram.body, telegram);

  const intensity =
    body?.intensity;

  const maxInt =
    intensity?.maxInt;

  return {
    eventId:
      getEventId(telegram, body?.earthquake),

    place:
      "震源調査中",

    scale:
      convertDmdataIntensityToScale(maxInt),

    intensity:
      convertDmdataIntensityText(maxInt),

    longPeriodIntensity:
      getLongPeriodIntensity(intensity),

    magnitude:
      "-",

    depth:
      "-",

    latitude:
      null,

    longitude:
      null,

    time:
      body?.pressDateTime ??
      telegram.xmlReport?.head?.targetDateTime ??
      telegram.head?.time ??
      new Date().toISOString(),

    points:
      normalizeStations(intensity),

    scaleList:
      getScaleList()
  };
}

function parseVXSE52(telegram) {
  const body =
    normalizeBody(telegram.body, telegram);

  const earthquake =
    body?.earthquake;

  const hypocenter =
    earthquake?.hypocenter;

  const coordinate =
    getHypocenterCoordinate(hypocenter);

  return {
    eventId:
      getEventId(telegram, earthquake),

    place:
      hypocenter?.name ?? "震源調査中",

    scale:
      0,

    intensity:
      "-",

    longPeriodIntensity:
      null,

    magnitude:
      getMagnitudeValue(earthquake, hypocenter),

    depth:
      getDepthValue(hypocenter),

    latitude:
      getNumberValue(
        coordinate?.latitude
      ),

    longitude:
      getNumberValue(
        coordinate?.longitude
      ),

    time:
      earthquake?.originTime ??
      earthquake?.arrivalTime ??
      telegram.xmlReport?.head?.targetDateTime ??
      telegram.head?.time ??
      new Date().toISOString(),

    points:
      [],

    scaleList:
      getScaleList()
  };
}

function parseDmdataEew(telegram) {
  const body =
    normalizeBody(telegram.body, telegram);

  const earthquake =
    body?.earthquake;

  const hypocenter =
    earthquake?.hypocenter;

  const coordinate =
    getHypocenterCoordinate(hypocenter);

  const intensity =
    body?.intensity;

  const maxInt =
    intensity?.forecastMaxInt ??
    intensity?.maxInt ??
    body?.forecastMaxInt ??
    body?.maxInt;

  const isWarning =
    body?.isWarning === true;

  return {
    eventId:
      getEventId(telegram, earthquake),

    type:
      telegram.head?.type,

    isWarning,

    reportNumber:
      telegram.xmlReport?.head?.serial ??
      telegram.head?.serial ??
      body?.serial ??
      body?.serialNo ??
      null,

    place:
      hypocenter?.name ?? "震源調査中",

    scale:
      convertDmdataIntensityToScale(maxInt),

    intensity:
      convertDmdataIntensityText(maxInt),

    longPeriodIntensity:
      getLongPeriodIntensity(intensity),

    magnitude:
      getMagnitudeValue(earthquake, hypocenter),

    depth:
      getDepthValue(hypocenter),

    latitude:
      getNumberValue(
        coordinate?.latitude
      ),

    longitude:
      getNumberValue(
        coordinate?.longitude
      ),

    time:
      earthquake?.originTime ??
      earthquake?.arrivalTime ??
      telegram.xmlReport?.head?.targetDateTime ??
      telegram.head?.time ??
      new Date().toISOString()
  };
}

module.exports = {
  parseDmdataEarthquake,
  parseVXSE51,
  parseVXSE52,
  parseDmdataEew
};