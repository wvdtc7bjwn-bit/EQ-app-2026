let latestTsunamiData = null;

function getTsunamiView() {
  return document.getElementById("tsunami-view");
}

function getEarthquakeView() {
  return document.getElementById("earthquake-view");
}

function getKyoshinView() {
  return document.getElementById("kyoshin-view");
}

export function showNoTsunamiPanel() {
  const tsunamiView = getTsunamiView();

  if (!tsunamiView) {
    console.warn("津波パネル表示先が見つかりません");
    return;
  }

  tsunamiView.innerHTML = `
    <div class="tsunami-panel tsunami-empty-panel">
      <div class="tsunami-header forecast">
        津波情報
      </div>

      <div class="tsunami-empty-body">
        <div class="tsunami-empty-icon">
          ~
        </div>

        <div class="tsunami-empty-title">
          津波情報は<br>現在発表されていません
        </div>
      </div>
    </div>
  `;
}

export function showTsunamiPanel(data) {
  latestTsunamiData = data;

  const tsunamiView = getTsunamiView();

  if (!tsunamiView) {
    console.warn("津波パネル表示先が見つかりません");
    return;
  }

  tsunamiView.innerHTML = buildTsunamiPanelHtml(data);
}

export function showTsunamiView() {
  const earthquakeView = getEarthquakeView();
  const kyoshinView = getKyoshinView();
  const tsunamiView = getTsunamiView();

  if (earthquakeView) earthquakeView.classList.add("hidden");
  if (kyoshinView) kyoshinView.classList.add("hidden");
  if (tsunamiView) tsunamiView.classList.remove("hidden");
}

export function showEarthquakeView() {
  const earthquakeView = getEarthquakeView();
  const kyoshinView = getKyoshinView();
  const tsunamiView = getTsunamiView();

  if (earthquakeView) earthquakeView.classList.remove("hidden");
  if (kyoshinView) kyoshinView.classList.add("hidden");
  if (tsunamiView) tsunamiView.classList.add("hidden");
}

export function showKyoshinView() {
  const earthquakeView = getEarthquakeView();
  const kyoshinView = getKyoshinView();
  const tsunamiView = getTsunamiView();

  if (earthquakeView) earthquakeView.classList.add("hidden");
  if (kyoshinView) kyoshinView.classList.remove("hidden");
  if (tsunamiView) tsunamiView.classList.add("hidden");
}

export function restoreCurrentPanel() {
  showEarthquakeView();
}

function buildTsunamiPanelHtml(data) {
  const areas = data.areas ?? [];
  const earthquake = data.earthquake ?? {};
  const grouped = groupTsunamiAreas(areas);
  const topKind = getTopTsunamiKind(areas);

  return `
    <div class="tsunami-panel">
      <div class="tsunami-header ${getKindClass(topKind)}">
        ${topKind || "津波情報"}
      </div>

      <div class="tsunami-origin">
        <div class="tsunami-time">
          ${formatTime(data.reportTime ?? data.time)}
        </div>

        <div class="tsunami-place">
          ${earthquake.name ?? data.epicenter ?? "震源調査中"}
        </div>

        <div class="tsunami-quake-box">
          <div>
            <span>マグニチュード</span>
            <strong>${earthquake.magnitude ?? data.magnitude ?? "-"}</strong>
          </div>

          <div>
            <span>深さ</span>
            <strong>${formatDepth(earthquake.depth ?? data.depth)}</strong>
          </div>
        </div>
      </div>

      ${renderSection("major", "大津波警報", "10m", grouped.major)}
      ${renderSection("warning", "津波警報", "3m", grouped.warning)}
      ${renderSection("advisory", "津波注意報", "1m", grouped.advisory)}
      ${renderSection("forecast", "若干の海面変動", "", grouped.forecast)}
      ${renderObservationSection(data.observations ?? [])}
    </div>
  `;
}

function renderSection(type, title, badge, areas) {
  if (!areas || areas.length === 0) {
    return "";
  }

  return `
    <section class="tsunami-section ${type}">
      <div class="tsunami-section-title">
        <span class="tsunami-badge ${type}">${badge}</span>
        <span>${title}</span>
      </div>

      <div class="tsunami-section-body">
        ${areas.map(area => renderAreaItem(area, type)).join("")}
      </div>
    </section>
  `;
}

function renderAreaItem(area, type) {
  const statusText = getAreaStatusText(area);
  const heightText = getAreaHeightText(area);

  return `
    <div class="tsunami-area-row ${type}">
      <div class="tsunami-area-name">
        ${area.name ?? area.code ?? "-"}
      </div>

      <div class="tsunami-area-status">
        ${statusText}
        ${heightText ? `<span>${heightText}</span>` : ""}
      </div>

      ${area.stations?.length ? renderForecastStationList(area.stations) : ""}
    </div>
  `;
}

function getAreaStatusText(area) {
  if (area.condition) return area.condition;
  if (area.arrivalTime) return `${formatShortDateTime(area.arrivalTime)} 到達予想`;
  if (area.arrivalRevise) return `到達予想 ${area.arrivalRevise}`;
  if (area.heightCondition) return area.heightCondition;
  if (area.maxHeightCondition) return area.maxHeightCondition;
  if (area.heightRevise) return `高さ ${area.heightRevise}`;

  if (
    area.kind?.includes("津波予報") ||
    area.kind?.includes("若干")
  ) {
    return "若干の海面変動";
  }

  return "情報発表中";
}

function getAreaHeightText(area) {
  if (area.heightCondition) return area.heightCondition;

  if (
    area.height === null ||
    area.height === undefined ||
    area.height === ""
  ) {
    return "";
  }

  const over = area.heightOver ? "超" : "";
  const unit = area.heightUnit ?? "m";

  return `${area.height}${unit}${over}`;
}

function renderForecastStationList(stations) {
  return `
    <div class="tsunami-station-list">
      ${stations.slice(0, 3).map(st => `
        <div class="tsunami-station-row">
          <span>${st.name}</span>
          <small>
            ${
              st.condition ||
              (
                st.arrivalTime
                  ? `${formatShortDateTime(st.arrivalTime)} 到達予想`
                  : ""
              )
            }
          </small>
        </div>
      `).join("")}
    </div>
  `;
}

function formatShortDateTime(time) {
  if (!time) return "";

  const date = new Date(time);

  if (Number.isNaN(date.getTime())) {
    return time;
  }

  const day = date.getDate();
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");

  return `${day}日${h}:${m}`;
}

function groupTsunamiAreas(areas) {
  return {
    major: areas.filter(a => a.kind?.includes("大津波警報")),
    warning: areas.filter(a =>
      !a.kind?.includes("大津波警報") &&
      a.kind?.includes("津波警報")
    ),
    advisory: areas.filter(a => a.kind?.includes("津波注意報")),
    forecast: areas.filter(a =>
      a.kind?.includes("津波予報") ||
      a.kind?.includes("若干")
    )
  };
}

function getTopTsunamiKind(areas) {
  if (areas.some(a => a.kind?.includes("大津波警報"))) return "大津波警報";

  if (areas.some(a =>
    !a.kind?.includes("大津波警報") &&
    a.kind?.includes("津波警報")
  )) {
    return "津波警報";
  }

  if (areas.some(a => a.kind?.includes("津波注意報"))) return "津波注意報";

  if (areas.some(a =>
    a.kind?.includes("津波予報") ||
    a.kind?.includes("若干")
  )) {
    return "津波予報";
  }

  return "津波情報";
}

function getKindClass(kind) {
  if (kind?.includes("大津波警報")) return "major";
  if (kind?.includes("津波警報")) return "warning";
  if (kind?.includes("津波注意報")) return "advisory";
  return "forecast";
}

function formatDepth(depth) {
  if (
    depth === null ||
    depth === undefined ||
    depth === ""
  ) {
    return "-";
  }

  return `${depth}km`;
}

function formatTime(time) {
  if (!time) return "--";

  const date = new Date(time);

  if (Number.isNaN(date.getTime())) {
    return time;
  }

  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}ごろ`;
}

function renderObservationSection(observations) {
  const stations = observations.flatMap(obs =>
    (obs.stations ?? []).map(st => ({
      areaName: obs.name,
      ...st
    }))
  );

  if (stations.length === 0) {
    return "";
  }

  return `
    <section class="tsunami-observation-section">
      <div class="tsunami-observation-title">
        津波観測
      </div>

      ${stations.slice(0, 8).map(st => `
        <div class="tsunami-observation-row">
          <div class="tsunami-area-name">
            ${st.name}
          </div>

          <div class="tsunami-area-status">
            ${getObservedStatusText(st)}
          </div>
        </div>
      `).join("")}
    </section>
  `;
}

function getObservedStatusText(st) {
  if (st.maxStatus) return st.maxStatus;
  if (st.maxCondition) return st.maxCondition;

  if (st.maxHeight) {
    const over = st.maxHeightOver ? "超" : "";
    const time = st.maxDateTime ? `${formatShortDateTime(st.maxDateTime)} ` : "";

    return `最大波 ${time}${st.maxHeight}${st.maxHeightUnit ?? "m"}${over}`;
  }

  if (st.firstCondition) return st.firstCondition;
  if (st.firstArrivalTime) return `第1波 ${formatShortDateTime(st.firstArrivalTime)}`;
  if (st.firstStatus) return st.firstStatus;

  return "観測中";
}