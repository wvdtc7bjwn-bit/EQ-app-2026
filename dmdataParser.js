function normalizeBody(body) {
  if (typeof body !== "string") {
    return body;
  }

  try {
    return JSON.parse(body);
  }
  catch {
    return body;
  }
}

function convertDmdataIntensityText(maxInt) {
  const value =
    typeof maxInt === "object"
      ? maxInt?.value ?? maxInt?.from ?? maxInt?.to
      : maxInt;

  const list = {
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5-": "5弱",
    "5+": "5強",
    "6-": "6弱",
    "6+": "6強",
    "7": "7"
  };

  return list[value] ?? "-";
}

function convertDmdataIntensityToScale(maxInt) {
  const value =
    typeof maxInt === "object"
      ? maxInt?.value ?? maxInt?.from ?? maxInt?.to
      : maxInt;

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

function getEventId(telegram, earthquake) {
  return (
    earthquake?.eventId ??
    telegram.head?.eventId ??
    telegram.head?.serial ??
    telegram.head?.time ??
    new Date().toISOString()
  );
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

function getNumberValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "object") {
    return getNumberValue(value.value);
  }

  const number =
    Number(value);

  return Number.isNaN(number)
    ? null
    : number;
}

function parseDmdataEarthquake(telegram) {
  const body =
    normalizeBody(telegram.body);

  const earthquake =
    body?.earthquake;

  const hypocenter =
    earthquake?.hypocenter;

  const coordinate =
    hypocenter?.coordinate;

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

    magnitude:
      hypocenter?.magnitude?.value ?? "-",

    depth:
      hypocenter?.depth?.value ?? "-",

    latitude:
      getNumberValue(coordinate?.latitude),

    longitude:
      getNumberValue(coordinate?.longitude),

    time:
      earthquake?.originTime ??
      earthquake?.arrivalTime ??
      telegram.head?.time ??
      new Date().toISOString(),

    points:
      intensity?.stations ?? [],

    scaleList:
      getScaleList()
  };
}

function parseVXSE51(telegram) {
  const body =
    normalizeBody(telegram.body);

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
      telegram.head?.time ??
      new Date().toISOString(),

    points:
      [],

    scaleList:
      getScaleList()
  };
}

function parseVXSE52(telegram) {
  const body =
    normalizeBody(telegram.body);

  const earthquake =
    body?.earthquake;

  const hypocenter =
    earthquake?.hypocenter;

  const coordinate =
    hypocenter?.coordinate;

  return {
    eventId:
      getEventId(telegram, earthquake),

    place:
      hypocenter?.name ?? "震源調査中",

    scale:
      0,

    intensity:
      "-",

    magnitude:
      hypocenter?.magnitude?.value ?? "-",

    depth:
      hypocenter?.depth?.value ?? "-",

    latitude:
      getNumberValue(coordinate?.latitude),

    longitude:
      getNumberValue(coordinate?.longitude),

    time:
      earthquake?.originTime ??
      earthquake?.arrivalTime ??
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
    normalizeBody(telegram.body);

  const earthquake =
    body?.earthquake;

  const hypocenter =
    earthquake?.hypocenter;

  const coordinate =
    hypocenter?.coordinate;

  const intensity =
    body?.intensity;

  const maxInt =
    intensity?.forecastMaxInt ??
    intensity?.maxInt ??
    body?.forecastMaxInt ??
    body?.maxInt;

  const isWarning =
    telegram.head?.type === "VXSE43" ||
    body?.warning === true ||
    body?.isWarning === true;

  return {
    eventId:
      getEventId(telegram, earthquake),

    type:
      telegram.head?.type,

    isWarning,

    reportNumber:
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

    magnitude:
      hypocenter?.magnitude?.value ?? "-",

    depth:
      hypocenter?.depth?.value ?? "-",

    latitude:
      getNumberValue(coordinate?.latitude),

    longitude:
      getNumberValue(coordinate?.longitude),

    time:
      earthquake?.originTime ??
      earthquake?.arrivalTime ??
      telegram.head?.time ??
      new Date().toISOString(),

    raw:
      telegram
  };
}

module.exports = {
  parseDmdataEarthquake,
  parseVXSE51,
  parseVXSE52,
  parseDmdataEew
};