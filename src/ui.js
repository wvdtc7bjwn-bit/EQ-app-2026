import {
  getIntensityColor
} from "./earthquake.js";

export function updateCurrentInfo(data) {
  const intensityBox =
    document.getElementById("intensity-box");

  const intensityValue =
    document.getElementById("intensity-value");

  const quakeTime =
    document.getElementById("quake-time");

  const quakePlace =
    document.getElementById("quake-place");

  const magnitudeValue =
    document.getElementById("magnitude-value");

  const depthValue =
    document.getElementById("depth-value");

  const tsunamiBox =
    document.getElementById("tsunami-box");

  const eewArea =
    document.getElementById("eew-area");

  const lngBox =
    document.getElementById("lng-box");

  const lngValue =
    document.getElementById("lng-value");

  const intensityLabel =
    document.querySelector(".intensity-label");

  const quakeDesc =
    document.querySelector(".quake-desc");

  eewArea.classList.add("hidden");
  quakePlace.classList.remove("hidden");
  tsunamiBox.classList.remove("hidden");

  intensityLabel.textContent =
    "最大震度";

  intensityValue.textContent =
    data.intensity ?? "-";

  intensityBox.style.background =
    getIntensityColor(data.scale);

  quakeTime.textContent =
    formatTime(data.time);

  quakePlace.textContent =
    data.place ?? "震源調査中";

  magnitudeValue.textContent =
    formatMagnitude(data.magnitude);

  depthValue.textContent =
    formatDepth(data.depth);

  tsunamiBox.textContent =
    "津波情報・調査中";

  tsunamiBox.style.background =
    "#31486d";

  quakeDesc.textContent =
    "";

  quakeDesc.style.color =
    "#e2e8f0";

  updateLongPeriodBox(
    lngBox,
    lngValue,
    data.longPeriodIntensity
  );
}

export function showEEW(
  data,
  isWarning = false,
  reportNumber = null
) {
  const statusBanner =
    document.getElementById("status-banner");

  const eewArea =
    document.getElementById("eew-area");

  const quakeTime =
    document.getElementById("quake-time");

  const quakePlace =
    document.getElementById("quake-place");

  const quakeDesc =
    document.querySelector(".quake-desc");

  const intensityLabel =
    document.querySelector(".intensity-label");

  const intensityValue =
    document.getElementById("intensity-value");

  const intensityBox =
    document.getElementById("intensity-box");

  const magnitudeValue =
    document.getElementById("magnitude-value");

  const depthValue =
    document.getElementById("depth-value");

  const tsunamiBox =
    document.getElementById("tsunami-box");

  const lngBox =
    document.getElementById("lng-box");

  const lngValue =
    document.getElementById("lng-value");

  const reportText =
    reportNumber ? ` #${reportNumber}` : "";

  statusBanner.textContent =
    isWarning
      ? `緊急地震速報　警報${reportText}`
      : `緊急地震速報　予報${reportText}`;

  statusBanner.style.background =
    isWarning
      ? "linear-gradient(180deg, #dc2626 0%, #991b1b 100%)"
      : "linear-gradient(180deg, #d9c55f 0%, #b8942f 100%)";

  statusBanner.style.color =
    isWarning ? "white" : "#111";

  quakePlace.classList.add("hidden");

  eewArea.innerHTML =
    `${data.place ?? "震源調査中"} <small>で地震</small>`;

  eewArea.classList.remove("hidden");

  quakeTime.textContent =
    `${formatTime(data.time)} 発生`;

  intensityLabel.textContent =
    "推定最大震度";

  intensityValue.textContent =
    data.intensity ?? "-";

  intensityBox.style.background =
    getIntensityColor(data.scale);

  magnitudeValue.textContent =
    formatMagnitude(data.magnitude);

  depthValue.textContent =
    formatDepth(data.depth);

  tsunamiBox.classList.add("hidden");

  quakeDesc.innerHTML =
    isWarning
      ? "緊急地震速報（警報）発表<br>強い揺れに警戒してください"
      : "緊急地震速報（予報）発表<br>揺れに注意してください";

  quakeDesc.style.color =
    isWarning ? "#f5df8a" : "#e2e8f0";

  updateLongPeriodBox(
    lngBox,
    lngValue,
    data.longPeriodIntensity
  );
}

function updateLongPeriodBox(
  lngBox,
  lngValue,
  longPeriodIntensity
) {
  if (!lngBox || !lngValue) {
    return;
  }

  if (
    longPeriodIntensity !== null &&
    longPeriodIntensity !== undefined &&
    longPeriodIntensity !== "-" &&
    longPeriodIntensity !== ""
  ) {
    lngBox.classList.remove("hidden");

    lngValue.textContent =
      longPeriodIntensity;
  }
  else {
    lngBox.classList.add("hidden");
  }
}

export function updateTime() {
  const updateTime =
    document.getElementById("update-time");

  const now =
    new Date();

  updateTime.textContent =
    `${now.toLocaleString("ja-JP")} 更新`;
}

export function updatePoints(points, scaleList) {
  const pointsDiv =
    document.getElementById("points");

  pointsDiv.innerHTML = "";

  if (!points || points.length === 0) {
    pointsDiv.textContent =
      "観測点情報なし";

    return;
  }

  points.forEach(point => {
    const div =
      document.createElement("div");

    const intensity =
      scaleList?.[point.scale] ??
      point.intensity ??
      "-";

    div.textContent =
      `${point.name ?? point.addr ?? "観測点"}　震度 ${intensity}`;

    div.style.background =
      getIntensityColor(point.scale);

    pointsDiv.appendChild(div);
  });
}

export function setMainMode(mode) {
  const statusBanner =
    document.getElementById("status-banner");

  const currentPanel =
    document.getElementById("current-panel");

  if (mode === "eew-warning") {
    statusBanner.textContent =
      "緊急地震速報　警報";

    statusBanner.style.background =
      "linear-gradient(180deg, #dc2626 0%, #991b1b 100%)";

    statusBanner.style.color =
      "white";

    currentPanel.style.boxShadow =
      "0 0 28px rgba(255, 60, 60, 0.65)";
  }

  else if (mode === "eew-forecast") {
    statusBanner.textContent =
      "緊急地震速報　予報";

    statusBanner.style.background =
      "linear-gradient(180deg, #d9c55f 0%, #b8942f 100%)";

    statusBanner.style.color =
      "#111";

    currentPanel.style.boxShadow =
      "0 0 24px rgba(255, 220, 80, 0.45)";
  }

  else {
    statusBanner.textContent =
      "地震情報";

    statusBanner.style.background =
      "linear-gradient(180deg, #33445f 0%, #26354d 100%)";

    statusBanner.style.color =
      "white";

    currentPanel.style.boxShadow =
      "";
  }
}

export function setSubPanel(mode) {
  const pointsPanel =
    document.getElementById("points-panel");

  const historyPanel =
    document.getElementById("history-panel");

  if (mode === "points") {
    pointsPanel.classList.remove("hidden");
    historyPanel.classList.add("hidden");
  }

  else {
    pointsPanel.classList.add("hidden");
    historyPanel.classList.remove("hidden");
  }
}

function formatMagnitude(magnitude) {
  if (
    magnitude === "-" ||
    magnitude === null ||
    magnitude === undefined
  ) {
    return "-";
  }

  return magnitude;
}

function formatDepth(depth) {
  if (
    depth === "-" ||
    depth === null ||
    depth === undefined
  ) {
    return "-";
  }

  return `${depth}km`;
}

function formatTime(timeText) {
  if (!timeText) {
    return "--";
  }

  const date =
    new Date(timeText);

  if (Number.isNaN(date.getTime())) {
    return timeText;
  }

  return date.toLocaleString("ja-JP");
}

export function setupPanelToggle() {
  const currentPanel =
    document.getElementById("current-panel");

  const pointsPanel =
    document.getElementById("points-panel");

  const historyPanel =
    document.getElementById("history-panel");

  currentPanel.addEventListener("click", () => {
    pointsPanel.classList.toggle("hidden");
    historyPanel.classList.toggle("hidden");
  });
}