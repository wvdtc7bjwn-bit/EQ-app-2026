import {
  getIntensityColor
} from "./earthquake.js";

const historyCards =
  new Map();

export function addHistory(data) {
  const history =
    document.getElementById("history");

  const eventId =
    data.eventId ?? `${data.time}-${data.place}`;

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
      <strong>${data.intensity}</strong>
    </div>

    <div class="history-info">
      <div class="history-place">${data.place}</div>
      <div>${formatShortTime(data.time)}</div>
      <div>深さ ${formatDepth(data.depth)}　M ${data.magnitude}</div>
    </div>
  `;

  while (history.children.length > 11) {
    const lastChild =
      history.lastChild;

    history.removeChild(lastChild);
  }
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