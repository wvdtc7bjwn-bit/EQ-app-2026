export const map =
  L.map("map", {
    zoomControl: false,
    attributionControl: false
  }).setView([37.5, 137], 4.6);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
  {
    attribution:
      "&copy; OpenStreetMap contributors"
  }
).addTo(map);

let hypocenterMarker =
  null;

export function updateHypocenter(lat, lng) {
  if (!lat || !lng) {
    return;
  }

  if (hypocenterMarker) {
    map.removeLayer(hypocenterMarker);
  }

  const icon =
    L.divIcon({
      className: "hypocenter-icon",
      html: "×",
      iconSize: [40, 40]
    });

  hypocenterMarker =
    L.marker(
      [lat, lng],
      { icon }
    ).addTo(map);

  map.setView(
    [lat, lng],
    6
  );
}