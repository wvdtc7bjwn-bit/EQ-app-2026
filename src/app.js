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
  initializeSvgMap,
  updateSvgHypocenter,
  updateSvgIntensityPoints,
  updateSvgEewWaves,
  updateKyoshinDots
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

  updateSvgIntensityPoints(
    data.points,
    data.scaleList
  );

  addHistory(data);

  if (
    data.latitude !== null &&
    data.latitude !== undefined &&
    data.longitude !== null &&
    data.longitude !== undefined
  ) {
    updateSvgHypocenter(
      data.latitude,
      data.longitude
    );
  }
});

socket.on("eew", (data) => {
  console.log("EEWデータ受信:");
  console.log(data);

  if (data.isWarning) {
    setMainMode("eew-warning");
  }
  else {
    setMainMode("eew-forecast");
  }

  showEEW(
    data,
    data.isWarning,
    data.reportNumber
  );

  if (
    data.latitude !== null &&
    data.latitude !== undefined &&
    data.longitude !== null &&
    data.longitude !== undefined
  ) {
    updateSvgHypocenter(
      data.latitude,
      data.longitude
    );

    updateSvgEewWaves(
      data,
      {
        replay:
          data.isReplay === true
      }
    );
  }
});

socket.on("kyoshin", (data) => {
  console.log(
    "強震モニタ受信:",
    data.time,
    data.imageSize,
    data.points?.length
  );

  updateKyoshinDots(
    data.points
  );
});

socket.on("dmdata-telegram", (telegram) => {
  console.log("その他dmdata受信:");
  console.log(telegram);
});