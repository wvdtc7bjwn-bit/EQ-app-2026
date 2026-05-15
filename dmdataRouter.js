const {
  parseDmdataEarthquake,
  parseVXSE51,
  parseVXSE52
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

    // =========================
    // 震源・震度情報
    // =========================

    case "VXSE53": {
      console.log("震源・震度情報 VXSE53 受信");

      const parsed =
        parseDmdataEarthquake(data);

      console.log("UI変換後:");
      console.log(parsed);

      io.emit(
        "earthquake",
        parsed
      );

      break;
    }

    // =========================
    // 震度速報
    // =========================

    case "VXSE51": {
      console.log("震度速報 VXSE51 受信");

      const parsed =
        parseVXSE51(data);

      console.log("UI変換後:");
      console.log(parsed);

      io.emit(
        "earthquake",
        parsed
      );

      break;
    }

    // =========================
    // 震源情報
    // =========================

    case "VXSE52": {
      console.log("震源情報 VXSE52 受信");

      const parsed =
        parseVXSE52(data);

      console.log("UI変換後:");
      console.log(parsed);

      io.emit(
        "earthquake",
        parsed
      );

      break;
    }

    // =========================
    // EEW
    // =========================

    case "VXSE45":
    case "VXSE43": {
      console.log(`EEW受信: ${code}`);

      io.emit(
        "dmdata-telegram",
        data
      );

      break;
    }

    // =========================
    // 津波
    // =========================

    case "VTSE41":
    case "VTSE51": {
      console.log(`津波電文受信: ${code}`);

      io.emit(
        "tsunami",
        data
      );

      break;
    }

    // =========================
    // 顕著地震
    // =========================

    case "VXSE61": {
      console.log("顕著地震受信");

      break;
    }

    // =========================
    // 未対応
    // =========================

    default: {
      console.log(
        `未対応電文: ${code}`
      );

      break;
    }
  }
}

module.exports = {
  routeTelegram
};