const {
  parseDmdataEarthquake,
  parseVXSE51,
  parseVXSE52,
  parseDmdataEew
} = require("./dmdataParser");

function routeTelegram(data, io) {
  const code =
    data?.head?.type;

  if (!code) {
    console.log("電文コードなし:", data);
    return;
  }

  console.log(`受信電文: ${code}`);

  switch (code) {
    case "VXSE53": {
      console.log("震源・震度情報 VXSE53 受信");

      const parsed =
        parseDmdataEarthquake(data);

      console.log("UI変換後:");
      console.log(parsed);

      io.emit("earthquake", parsed);

      break;
    }

    case "VXSE51": {
      console.log("震度速報 VXSE51 受信");

      const parsed =
        parseVXSE51(data);

      console.log("UI変換後:");
      console.log(parsed);

      io.emit("earthquake", parsed);

      break;
    }

    case "VXSE52": {
      console.log("震源情報 VXSE52 受信");

      const parsed =
        parseVXSE52(data);

      console.log("UI変換後:");
      console.log(parsed);

      io.emit("earthquake", parsed);

      break;
    }

    case "VXSE45":
    case "VXSE43": {
      console.log(`EEW受信: ${code}`);

      const parsed =
        parseDmdataEew(data);

      console.log("EEW UI変換後:");
      console.log(parsed);

      io.emit("eew", parsed);

      break;
    }

    case "VTSE41":
    case "VTSE51":
    case "VTSE52": {
      console.log(`津波電文受信: ${code}`);

      const tsunamiData =
        normalizeTsunamiTelegram(
          data,
          code
    );

  io.emit(
    "tsunami",
    tsunamiData
  );

     console.log(
      "津波区域:",
       tsunamiData.areas.length,
      "観測:",
       tsunamiData.observations.length,
      "推定:",
       tsunamiData.estimations.length
  );

  break;
}

    case "VXSE61": {
      console.log("顕著地震受信");

      io.emit("dmdata-telegram", data);

      break;
    }

    default: {
      console.log(`未対応電文: ${code}`);

      io.emit("dmdata-telegram", data);

      break;
    }
  }
}

function handleTsunamiInfo(telegram, io) {
  const forecasts =
    telegram.body?.tsunami?.forecasts ?? [];

  const areas =
    forecasts.map(f => ({
      code: f.code,
      name: f.name,
      kind: f.kind?.name ?? "",
      arrivalTime: f.firstHeight?.arrivalTime,
      condition: f.firstHeight?.condition,
      height: f.maxHeight?.height?.value
    }));

  io.emit("tsunami", {
    type: telegram.head?.type,
    areas
  });

  console.log("津波情報配信:", areas.length);
}

module.exports = {
  routeTelegram
};

function normalizeTsunamiTelegram(
  data,
  code
) {
  const body =
    data.body ?? {};

  const tsunami =
    body.tsunami ?? {};

  const earthquakes =
    body.earthquakes ?? [];

  const areas =
    normalizeTsunamiForecasts(
      tsunami.forecasts ?? []
    );

  const observations =
    normalizeTsunamiObservations(
      tsunami.observations ?? []
    );

  const estimations =
    normalizeTsunamiEstimations(
      tsunami.estimations ?? []
    );

  return {
    type: code,

    reportTime:
      data.head?.time ??
      data.head?.reportDateTime ??
      data.reportTime ??
      null,

    validTime:
      data.head?.validDateTime ??
      null,

    title:
      data.head?.title ??
      data.head?.type ??
      code,

    status:
      data.head?.status ??
      null,

    infoType:
      data.head?.infoType ??
      null,

    isCanceled:
      Boolean(
        body.text &&
        !tsunami.forecasts &&
        !tsunami.observations &&
        !tsunami.estimations
      ),

    text:
      body.text ?? "",

    comments:
      {
        free:
          body.comments?.free ?? "",

        warning:
          body.comments?.warning?.text ?? ""
      },

    earthquake:
      normalizeTsunamiEarthquake(
        earthquakes[0]
      ),

    earthquakes:
      earthquakes.map(
        normalizeTsunamiEarthquake
      ),

    areas,

    observations,

    estimations
  };
}

function normalizeTsunamiForecasts(
  forecasts
) {
  return forecasts.map(f => {
    const height =
      f.maxHeight?.height ?? null;

    return {
      code:
        String(f.code ?? ""),

      name:
        f.name ?? "",

      kindCode:
        f.kind?.code ?? "",

      kind:
        f.kind?.name ?? "",

      lastKindCode:
        f.kind?.lastKind?.code ?? "",

      lastKind:
        f.kind?.lastKind?.name ?? "",

      arrivalTime:
        f.firstHeight?.arrivalTime ?? null,

      condition:
        f.firstHeight?.condition ?? "",

      arrivalRevise:
        f.firstHeight?.revise ?? "",

      height:
        height?.value ?? null,

      heightUnit:
        height?.unit ?? "m",

      heightOver:
        height?.over === true,

      heightCondition:
        height?.condition ?? "",

      maxHeightCondition:
        f.maxHeight?.condition ?? "",

      heightRevise:
        f.maxHeight?.revise ?? "",

      stations:
        normalizeForecastStations(
          f.stations ?? []
        )
    };
  });
}

function normalizeForecastStations(
  stations
) {
  return stations.map(st => ({
    code:
      String(st.code ?? ""),

    name:
      st.name ?? "",

    highTideDateTime:
      st.highTideDateTime ?? null,

    arrivalTime:
      st.firstHeight?.arrivalTime ?? null,

    condition:
      st.firstHeight?.condition ?? "",

    revise:
      st.firstHeight?.revise ?? ""
  }));
}

function normalizeTsunamiObservations(
  observations
) {
  return observations.map(obs => ({
    code:
      obs.code === null ||
      obs.code === undefined
        ? null
        : String(obs.code),

    name:
      obs.name ?? null,

    stations:
      (obs.stations ?? []).map(st => ({
        code:
          String(st.code ?? ""),

        name:
          st.name ?? "",

        sensor:
          st.sensor ?? "",

        firstArrivalTime:
          st.firstHeight?.arrivalTime ?? null,

        firstInitial:
          st.firstHeight?.initial ?? "",

        firstCondition:
          st.firstHeight?.condition ?? "",

        firstRevise:
          st.firstHeight?.revise ?? "",

        firstStatus:
          st.firstHeight?.status ?? "",

        maxDateTime:
          st.maxHeight?.dateTime ?? null,

        maxHeight:
          st.maxHeight?.height?.value ?? null,

        maxHeightUnit:
          st.maxHeight?.height?.unit ?? "m",

        maxHeightOver:
          st.maxHeight?.height?.over === true,

        maxHeightCondition:
          st.maxHeight?.height?.condition ?? "",

        maxCondition:
          st.maxHeight?.condition ?? "",

        maxRevise:
          st.maxHeight?.revise ?? "",

        maxStatus:
          st.maxHeight?.status ?? ""
      }))
  }));
}

function normalizeTsunamiEstimations(
  estimations
) {
  return estimations.map(est => {
    const height =
      est.maxHeight?.height ?? null;

    return {
      code:
        String(est.code ?? ""),

      name:
        est.name ?? "",

      arrivalTime:
        est.firstHeight?.arrivalTime ?? null,

      condition:
        est.firstHeight?.condition ?? "",

      arrivalRevise:
        est.firstHeight?.revise ?? "",

      estimatedDateTime:
        est.maxHeight?.dateTime ?? null,

      height:
        height?.value ?? null,

      heightUnit:
        height?.unit ?? "m",

      heightOver:
        height?.over === true,

      heightCondition:
        height?.condition ?? "",

      maxCondition:
        est.maxHeight?.condition ?? "",

      heightRevise:
        est.maxHeight?.revise ?? ""
    };
  });
}

function normalizeTsunamiEarthquake(
  eq
) {
  if (!eq) {
    return null;
  }

  return {
    name:
      eq.hypocenter?.name ??
      eq.hypocenter?.area?.name ??
      eq.name ??
      "震源調査中",

    magnitude:
      eq.magnitude?.value ??
      eq.magnitude ??
      null,

    magnitudeCondition:
      eq.magnitude?.condition ?? "",

    depth:
      eq.hypocenter?.depth?.value ??
      eq.depth?.value ??
      eq.depth ??
      null,

    depthCondition:
      eq.hypocenter?.depth?.condition ??
      eq.depth?.condition ??
      "",

    originTime:
      eq.originTime ??
      eq.arrivalTime ??
      null,

    latitude:
      eq.hypocenter?.coordinate?.latitude?.value ??
      eq.hypocenter?.coordinate?.lat ??
      null,

    longitude:
      eq.hypocenter?.coordinate?.longitude?.value ??
      eq.hypocenter?.coordinate?.lon ??
      null
  };
}