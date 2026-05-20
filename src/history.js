import {
  getIntensityColor
} from "./earthquake.js";

const historyCards =
  new Map();

let latestEventId = null;

export function setLatestHistoryEvent(data) {
  const eventId = getEventId(data);

  if (!eventId) {
    return;
  }

  latestEventId = eventId;

  const latestCard = historyCards.get(eventId);

  if (latestCard) {
    latestCard.remove();
    historyCards.delete(eventId);
  }
}

export function addHistory(data) {
  const history =
    document.getElementById("history");

  if (!history) {
    return;
  }

  const eventId = getEventId(data);

  if (!eventId || eventId === latestEventId) {
    return;
  }

  let card =
    historyCards.get(eventId);

  const color =
    getIntensityColor(data.scale);

  if (!card) {
    card =
      document.createElement("div");

    card.className =
      "history-card";

    historyCards.set(
      eventId,
      card
    );

    history.prepend(card);
  }

  card.innerHTML = `
    <div class="history-intensity" style="background:${color}">
      <span>最大震度</span>
      <strong>${data.intensity ?? "-"}</strong>
    </div>

    <div class="history-info">
      <div class="history-place">${data.place ?? "震源調査中"}</div>
      <div>${formatShortTime(data.time)}</div>
      <div>深さ ${formatDepth(data.depth)}　M ${data.magnitude ?? "-"}</div>
    </div>
  `;

  while (history.children.length > 11) {
    const lastChild =
      history.lastChild;

    if (!lastChild) {
      break;
    }

    history.removeChild(lastChild);
  }
}

function getEventId(data) {
  return (
    data?.eventId ??
    data?.event_id ??
    `${data?.time ?? data?.origin_time}-${data?.place ?? ""}`
  );
}

function formatDepth(depth) {
  if (
    depth === "-" ||
    depth === null ||
    depth === undefined
  ) {
    return "調査中";
  }

  return `${depth}km`;
}

function formatShortTime(timeText) {
  if (!timeText) {
    return "--";
  }

  const date =
    new Date(timeText);

  if (Number.isNaN(date.getTime())) {
    return timeText;
  }

  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
