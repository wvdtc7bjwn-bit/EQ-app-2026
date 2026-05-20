import {
  getIntensityColor
} from "./earthquake.js";

let panelToggleInitialized = false;

let earthquakeTsunamiStatus = {
  text: "津波情報：調査中",
  background: "#31486d"
};

export function setEarthquakeTsunamiStatus(data) {
  earthquakeTsunamiStatus = buildTsunamiStatus(data);
  renderEarthquakeTsunamiStatus();
}

function buildTsunamiStatus(data) {
  if (!data) {
    return {
      text: "津波情報：調査中",
      background: "#31486d"
    };
  }

  if (data.isCanceled) {
    return {
      text: "津波情報：解除・取消",
      background: "#475569"
    };
  }

  const areas = Array.isArray(data.areas)
    ? data.areas
    : [];

  const observations = Array.isArray(data.observations)
    ? data.observations
    : [];

  const estimations = Array.isArray(data.estimations)
    ? data.estimations
    : [];

  if (
    areas.length === 0 &&
    observations.length === 0 &&
    estimations.length === 0
  ) {
    return {
      text: "津波情報：発表なし",
      background: "#33445f"
    };
  }

  const topKind = getTopTsunamiKind(areas);

  if (topKind.includes("大津波警報")) {
    return {
      text: "津波情報：大津波警報",
      background: "linear-gradient(180deg, #7f1d1d 0%, #450a0a 100%)"
    };
  }

  if (topKind.includes("津波警報")) {
    return {
      text: "津波情報：津波警報",
      background: "linear-gradient(180deg, #dc2626 0%, #991b1b 100%)"
    };
  }

  if (topKind.includes("津波注意報")) {
    return {
      text: "津波情報：津波注意報",
      background: "linear-gradient(180deg, #f59e0b 0%, #b45309 100%)"
    };
  }

  if (topKind.includes("津波予報")) {
    return {
      text: "津波情報：津波予報",
      background: "linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)"
    };
  }

  if (observations.length > 0) {
    return {
      text: "津波情報：津波観測あり",
      background: "linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)"
    };
  }

  return {
    text: "津波情報：発表中",
    background: "linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)"
  };
}

function getTopTsunamiKind(areas) {
  if (areas.some(area => area.kind?.includes("大津波警報"))) {
    return "大津波警報";
  }

  if (areas.some(area =>
    !area.kind?.includes("大津波警報") &&
    area.kind?.includes("津波警報")
  )) {
    return "津波警報";
  }

  if (areas.some(area => area.kind?.includes("津波注意報"))) {
    return "津波注意報";
  }

  if (areas.some(area =>
    area.kind?.includes("津波予報") ||
    area.kind?.includes("若干")
  )) {
    return "津波予報";
  }

  return "津波情報";
}

function renderEarthquakeTsunamiStatus() {
  const tsunamiBox = document.getElementById("tsunami-box");

  if (!tsunamiBox) {
    return;
  }

  tsunamiBox.textContent = earthquakeTsunamiStatus.text;
  tsunamiBox.style.background = earthquakeTsunamiStatus.background;
}

export function updateCurrentInfo(data) {
  const intensityBox = document.getElementById("intensity-box");
  const intensityValue = document.getElementById("intensity-value");
  const quakeTime = document.getElementById("quake-time");
  const quakePlace = document.getElementById("quake-place");
  const magnitudeValue = document.getElementById("magnitude-value");
  const depthValue = document.getElementById("depth-value");
  const tsunamiBox = document.getElementById("tsunami-box");
  const eewArea = document.getElementById("eew-area");
  const lngBox = document.getElementById("lng-box");
  const lngValue = document.getElementById("lng-value");
  const intensityLabel = document.querySelector(".intensity-label");
  const quakeDesc = document.querySelector(".quake-desc");

  if (
    !intensityBox ||
    !intensityValue ||
    !quakeTime ||
    !quakePlace ||
    !magnitudeValue ||
    !depthValue ||
    !tsunamiBox ||
    !eewArea ||
    !intensityLabel ||
    !quakeDesc
  ) {
    console.warn("updateCurrentInfo: 必要なDOMが見つかりません");
    return;
  }

  eewArea.classList.add("hidden");
  quakePlace.classList.remove("hidden");
  tsunamiBox.classList.remove("hidden");

  intensityLabel.textContent = "最大震度";
  intensityValue.textContent = data.intensity ?? "-";
  intensityBox.style.background = getIntensityColor(data.scale);
  quakeTime.textContent = formatTime(data.time);
  quakePlace.textContent = data.place ?? "震源調査中";
  magnitudeValue.textContent = formatMagnitude(data.magnitude);
  depthValue.textContent = formatDepth(data.depth);
  renderEarthquakeTsunamiStatus();
  quakeDesc.textContent = "";
  quakeDesc.style.color = "#e2e8f0";

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
  const statusBanner = document.getElementById("status-banner");
  const eewArea = document.getElementById("eew-area");
  const quakeTime = document.getElementById("quake-time");
  const quakePlace = document.getElementById("quake-place");
  const quakeDesc = document.querySelector(".quake-desc");
  const intensityLabel = document.querySelector(".intensity-label");
  const intensityValue = document.getElementById("intensity-value");
  const intensityBox = document.getElementById("intensity-box");
  const magnitudeValue = document.getElementById("magnitude-value");
  const depthValue = document.getElementById("depth-value");
  const tsunamiBox = document.getElementById("tsunami-box");
  const lngBox = document.getElementById("lng-box");
  const lngValue = document.getElementById("lng-value");

  if (
    !statusBanner ||
    !eewArea ||
    !quakeTime ||
    !quakePlace ||
    !quakeDesc ||
    !intensityLabel ||
    !intensityValue ||
    !intensityBox ||
    !magnitudeValue ||
    !depthValue ||
    !tsunamiBox
  ) {
    console.warn("showEEW: 必要なDOMが見つかりません");
    return;
  }

  const reportText = reportNumber ? ` #${reportNumber}` : "";

  statusBanner.textContent = isWarning
    ? `緊急地震速報　警報${reportText}`
    : `緊急地震速報　予報${reportText}`;

  statusBanner.style.background = isWarning
    ? "linear-gradient(180deg, #dc2626 0%, #991b1b 100%)"
    : "linear-gradient(180deg, #d9c55f 0%, #b8942f 100%)";

  statusBanner.style.color = isWarning ? "white" : "#111";

  quakePlace.classList.add("hidden");
  eewArea.innerHTML = `${data.place ?? "震源調査中"} <small>で地震</small>`;
  eewArea.classList.remove("hidden");
  quakeTime.textContent = `${formatTime(data.time)} 発生`;
  intensityLabel.textContent = "推定最大震度";
  intensityValue.textContent = data.intensity ?? "-";
  intensityBox.style.background = getIntensityColor(data.scale);
  magnitudeValue.textContent = formatMagnitude(data.magnitude);
  depthValue.textContent = formatDepth(data.depth);
  tsunamiBox.classList.add("hidden");

  quakeDesc.innerHTML = isWarning
    ? "緊急地震速報（警報）発表<br>強い揺れに警戒してください"
    : "緊急地震速報（予報）発表<br>揺れに注意してください";

  quakeDesc.style.color = isWarning ? "#f5df8a" : "#e2e8f0";

  updateLongPeriodBox(
    lngBox,
    lngValue,
    data.longPeriodIntensity
  );
}

export function renderEEWCard(data, options = {}) {
  const isWarning = options.isWarning ?? data?.isWarning ?? false;
  const reportNumber = options.reportNumber ?? data?.reportNumber ?? null;
  const reportText = reportNumber ? ` #${reportNumber}` : "";

  if (!data) {
    return `
      <div class="kyoshin-empty-message">
        緊急地震速報は<br>
        現在発表されていません
      </div>
    `;
  }

  const statusText = isWarning
    ? `緊急地震速報　警報${reportText}`
    : `緊急地震速報　予報${reportText}`;

  const statusStyle = isWarning
    ? "background: linear-gradient(180deg, #dc2626 0%, #991b1b 100%); color: white;"
    : "background: linear-gradient(180deg, #d9c55f 0%, #b8942f 100%); color: #111;";

  const descText = isWarning
    ? "緊急地震速報（警報）発表<br>強い揺れに警戒してください"
    : "緊急地震速報（予報）発表<br>揺れに注意してください";

  return `
    <div class="status-banner" style="${statusStyle}">
      ${statusText}
    </div>

    <div class="quake-info">
      <div id="eew-area">
        ${data.place ?? "震源調査中"} <small>で地震</small>
      </div>

      <div id="quake-time">
        ${formatTime(data.time)} 発生
      </div>

      <div id="intensity-box" style="background: ${getIntensityColor(data.scale)};">
        <div class="intensity-label">
          推定最大震度
        </div>

        <div id="intensity-value">
          ${data.intensity ?? "-"}
        </div>
      </div>

      ${renderLongPeriodHtml(data.longPeriodIntensity)}

      <div class="detail-box">
        <div class="detail-row">
          <span>マグニチュード</span>
          <strong>${formatMagnitude(data.magnitude)}</strong>
        </div>

        <div class="detail-row">
          <span>深さ</span>
          <strong>${formatDepth(data.depth)}</strong>
        </div>
      </div>

      <div class="quake-desc" style="color: ${isWarning ? "#f5df8a" : "#e2e8f0"};">
        ${descText}
      </div>
    </div>
  `;
}

function renderLongPeriodHtml(longPeriodIntensity) {
  if (
    longPeriodIntensity === null ||
    longPeriodIntensity === undefined ||
    longPeriodIntensity === "-" ||
    longPeriodIntensity === ""
  ) {
    return "";
  }

  return `
    <div id="lng-box">
      <div>
        <div class="lng-top">推定</div>
        <div class="lng-bottom">
          最大長周期<br>
          地震動階級
        </div>
      </div>

      <div id="lng-value">${longPeriodIntensity}</div>
    </div>
  `;
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
    lngValue.textContent = longPeriodIntensity;
  }
  else {
    lngBox.classList.add("hidden");
  }
}

export function updateTime() {
  const updateTime = document.getElementById("update-time");

  if (!updateTime) {
    return;
  }

  const now = new Date();
  updateTime.textContent = `${now.toLocaleString("ja-JP")} 更新`;
}

export function updatePoints(points, scaleList) {
  const pointsDiv = document.getElementById("points");

  if (!pointsDiv) {
    return;
  }

  pointsDiv.innerHTML = "";

  if (!points || points.length === 0) {
    pointsDiv.textContent = "観測点情報なし";
    return;
  }

  points.forEach(point => {
    const div = document.createElement("div");

    const intensity =
      scaleList?.[point.scale] ??
      point.intensity ??
      "-";

    div.textContent = `${point.name ?? point.addr ?? "観測点"}　震度 ${intensity}`;
    div.style.background = getIntensityColor(point.scale);

    pointsDiv.appendChild(div);
  });
}

export function setMainMode(mode) {
  const currentPanel = document.getElementById("current-panel");

  if (!currentPanel) {
    return;
  }

  const statusBanner = document.getElementById("status-banner");

  if (!statusBanner) {
    return;
  }

  if (mode === "eew-warning") {
    statusBanner.textContent = "緊急地震速報　警報";
    statusBanner.style.background = "linear-gradient(180deg, #dc2626 0%, #991b1b 100%)";
    statusBanner.style.color = "white";
    currentPanel.style.boxShadow = "0 0 28px rgba(255, 60, 60, 0.65)";
  }
  else if (mode === "eew-forecast") {
    statusBanner.textContent = "緊急地震速報　予報";
    statusBanner.style.background = "linear-gradient(180deg, #d9c55f 0%, #b8942f 100%)";
    statusBanner.style.color = "#111";
    currentPanel.style.boxShadow = "0 0 24px rgba(255, 220, 80, 0.45)";
  }
  else {
    statusBanner.textContent = "地震情報";
    statusBanner.style.background = "linear-gradient(180deg, #33445f 0%, #26354d 100%)";
    statusBanner.style.color = "white";
    currentPanel.style.boxShadow = "";
  }
}

export function setSubPanel(mode) {
  const pointsPanel = document.getElementById("points-panel");
  const historyPanel = document.getElementById("history-panel");

  if (!pointsPanel || !historyPanel) {
    return;
  }

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

  const date = new Date(timeText);

  if (Number.isNaN(date.getTime())) {
    return timeText;
  }

  return date.toLocaleString("ja-JP");
}

export function setupPanelToggle() {
  if (panelToggleInitialized) {
    return;
  }

  const currentPanel = document.getElementById("current-panel");
  const pointsPanel = document.getElementById("points-panel");
  const historyPanel = document.getElementById("history-panel");

  if (!currentPanel || !pointsPanel || !historyPanel) {
    return;
  }

  pointsPanel.classList.add("hidden");
  historyPanel.classList.remove("hidden");

  currentPanel.addEventListener("click", event => {
    if (event.target.closest("#tsunami-view")) {
      return;
    }

    if (
      document.getElementById("earthquake-view")?.classList.contains("hidden")
    ) {
      return;
    }

    pointsPanel.classList.remove("hidden");
    historyPanel.classList.add("hidden");
  });

  panelToggleInitialized = true;
}
