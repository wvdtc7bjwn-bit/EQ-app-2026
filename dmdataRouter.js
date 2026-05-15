const {
  parseDmdataEarthquake,
  parseVXSE51,
  parseVXSE52
} = require("./dmdataParser");

function routeTelegram(data, io) {
  const type =
    data.head?.type;

  if (!type) {
    console.log("電文コードなし:", data);
    return;
  }

  console.log("受信電文:", type);

  switch (type) {
    case "VXSE42":
      console.log("緊急地震速報テスト：基本無視");
      break;

    case "VXSE43":
      console.log("VXSE43：今回は補助扱い");

      io.emit("dmdata-telegram", {
        type,
        label: "EEW警報",
        raw: data
      });

      break;

    case "VXSE45":
      console.log("VXSE45：EEWメイン処理");

      io.emit("dmdata-telegram", {
        type,
        label: "EEW地震動予報",
        raw: data
      });

      break;

    case "VXSE47":
      console.log("リアルタイム震度");

      io.emit("dmdata-telegram", {
        type,
        label: "リアルタイム震度",
        raw: data
      });

      break;

    case "VXSE51": {
      console.log("震度速報 VXSE51 受信");

      const parsed51 =
        parseVXSE51(data);

      console.log("速報UI変換:");
      console.log(parsed51);

      io.emit("earthquake", parsed51);

      break;
    }

    case "VXSE52": {
      console.log("震源情報 VXSE52 受信");

      const parsed52 =
        parseVXSE52(data);

      console.log("震源UI変換:");
      console.log(parsed52);

      io.emit("earthquake", parsed52);

      break;
    }

    case "VXSE53": {
      console.log("震源・震度情報 VXSE53 受信");

      console.log("head:");
      console.log(data.head);

      console.log("body keys:");
      console.log(Object.keys(data.body ?? {}));

      const parsed =
        parseDmdataEarthquake(data);

      console.log("UI変換後:");
      console.log(parsed);

      io.emit("earthquake", parsed);

      break;
    }

    case "VXSE56":
      console.log("地震活動状況");

      io.emit("dmdata-telegram", {
        type,
        label: "地震活動状況",
        raw: data
      });

      break;

    case "VXSE60":
      console.log("地震回数情報");

      io.emit("dmdata-telegram", {
        type,
        label: "地震回数情報",
        raw: data
      });

      break;

    case "VXSE61":
      console.log("震源要素更新");

      io.emit("dmdata-telegram", {
        type,
        label: "震源要素更新",
        raw: data
      });

      break;

    case "VXSE62":
      console.log("長周期地震動");

      io.emit("dmdata-telegram", {
        type,
        label: "長周期地震動",
        raw: data
      });

      break;

    case "VTSE41":
      console.log("津波警報・注意報・予報");

      io.emit("dmdata-telegram", {
        type,
        label: "津波警報・注意報・予報",
        raw: data
      });

      break;

    case "VTSE51":
      console.log("津波情報");

      io.emit("dmdata-telegram", {
        type,
        label: "津波情報",
        raw: data
      });

      break;

    default:
      console.log("未対応電文:", type);
      console.log(data);

      io.emit("dmdata-telegram", {
        type,
        label: "未対応電文",
        raw: data
      });

      break;
  }
}

module.exports = {
  routeTelegram
};