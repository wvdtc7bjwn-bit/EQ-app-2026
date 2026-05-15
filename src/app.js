import {
  socket
} from "./socket.js";

import {
  updateCurrentInfo,
  updateTime,
  updatePoints,
  setupPanelToggle,
  setMainMode,
  setSubPanel,
  showEEW
} from "./ui.js";

import {
  addHistory
} from "./history.js";

import {
  updateHypocenter
} from "./map.js";

import {
  initializeSvgMap,
  updateSvgHypocenter
} from "./map/japanSvgMap.js";

initializeSvgMap();
setupPanelToggle();

socket.on("earthquake", (data) => {
  setMainMode("earthquake");
  setSubPanel("history");

  console.log("地震データ受信:");
  console.log(data);

  updateCurrentInfo(data);

  updateTime();

  updatePoints(
    data.points,
    data.scaleList
  );

  addHistory(data);

  if (data.latitude && data.longitude) {
  updateHypocenter(
    data.latitude,
    data.longitude
  );

  updateSvgHypocenter(
    data.latitude,
    data.longitude
  );
}

socket.on("dmdata-telegram", (telegram) => {
  console.log("ブラウザでdmdata受信:");
  console.log(telegram);

  if (telegram.type === "VXSE45") {
    const isWarning =
      telegram.raw?.body?.warning ??
      false;

    const reportNumber =
      telegram.raw?.head?.serial ??
      telegram.raw?.body?.serial ??
      null;

    if (isWarning) {
      setMainMode("eew-warning");
    }

    else {
      setMainMode("eew-forecast");
    }

    showEEW(
      {
        intensity: "5弱",
        scale: 45,
        place: "十勝地方南部",
        magnitude: "6.2",
        depth: "90",
        time: new Date().toISOString()
      },
      isWarning,
      reportNumber
    );
  }
});