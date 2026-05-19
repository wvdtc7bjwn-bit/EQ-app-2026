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
    case "VTSE51": {
      console.log(`津波電文受信: ${code}`);

     const forecasts =
       data.body?.tsunami
        ?.forecasts ?? [];

     const areas =
      forecasts.map(f => ({
        code: f.code,

        name: f.name,

        kind:
          f.kind?.name ?? "",

        arrivalTime:
          f.firstHeight
          ?.arrivalTime,

        condition:
          f.firstHeight
          ?.condition,

        height:
          f.maxHeight
          ?.height
          ?.value
    }));

  io.emit("tsunami", {
    type: code,
    areas
  });

  console.log(
    "津波区域:",
    areas.length
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