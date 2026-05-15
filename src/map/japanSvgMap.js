import {
  japanGeoJson
} from "./data/japanGeoJson.js";

import {
  projectLatLng,
  svgMapConfig
} from "./projection.js";

let svgRoot = null;
let hypocenterLayer = null;
let mapBounds = null;
let viewBox = {
  x: 0,
  y: 0,
  width: svgMapConfig.width,
  height: svgMapConfig.height
};

let isDragging = false;
let dragStart = null;

export function initializeSvgMap() {
  const mapArea =
    document.getElementById("map-area");

  const oldSvg =
    document.getElementById("japan-svg-map");

  if (oldSvg) {
    oldSvg.remove();
  }

  svgRoot =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );

  svgRoot.setAttribute("id", "japan-svg-map");
  svgRoot.setAttribute(
    "viewBox",
    `0 0 ${svgMapConfig.width} ${svgMapConfig.height}`
  );

  svgRoot.style.position = "absolute";
  svgRoot.style.top = "0";
  svgRoot.style.left = "0";
  svgRoot.style.width = "100%";
  svgRoot.style.height = "100%";
  svgRoot.style.pointerEvents = "auto";
  svgRoot.style.cursor = "grab";
  svgRoot.style.zIndex = "500";

  mapArea.appendChild(svgRoot);

  setupSvgInteractions();

  mapBounds = calculateProjectedBounds();

  drawGeoJsonMap();

  hypocenterLayer =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

  svgRoot.appendChild(hypocenterLayer);
}

function calculateProjectedBounds() {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  japanGeoJson.features.forEach(feature => {
    const geometry = feature.geometry;

    if (!geometry) return;

    const polygons =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.coordinates;

    polygons.forEach(polygon => {
      polygon.forEach(ring => {
        ring.forEach(coord => {
          const lng = coord[0];
          const lat = coord[1];

          const p =
            projectLatLng(lat, lng);

          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });
      });
    });
  });

  return {
    minX,
    minY,
    maxX,
    maxY
  };
}

function fitPoint(point) {
  const padding = 40;

  const width =
    svgMapConfig.width - padding * 2;

  const height =
    svgMapConfig.height - padding * 2;

  const scaleX =
    width / (mapBounds.maxX - mapBounds.minX);

  const scaleY =
    height / (mapBounds.maxY - mapBounds.minY);

  const scale =
    Math.min(scaleX, scaleY);

  return {
    x:
      padding +
      (point.x - mapBounds.minX) * scale,

    y:
      padding +
      (point.y - mapBounds.minY) * scale
  };
}

function drawGeoJsonMap() {
  const group =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

  group.setAttribute("id", "geojson-layer");

  japanGeoJson.features.forEach(feature => {
    const geometry =
      feature.geometry;

    if (!geometry) return;

    if (geometry.type === "Polygon") {
      drawPolygon(group, geometry.coordinates);
    }

    if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach(polygon => {
        drawPolygon(group, polygon);
      });
    }
  });

  svgRoot.appendChild(group);
}

function drawPolygon(group, polygonCoordinates) {
  polygonCoordinates.forEach(ring => {
    let pathData = "";

    ring.forEach((coord, index) => {
      const lng = coord[0];
      const lat = coord[1];

      const projected =
        projectLatLng(lat, lng);

      const fitted =
        fitPoint(projected);

      if (index === 0) {
        pathData += `M ${fitted.x} ${fitted.y}`;
      }
      else {
        pathData += ` L ${fitted.x} ${fitted.y}`;
      }
    });

    pathData += " Z";

    const path =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );

    path.setAttribute("d", pathData);
    path.setAttribute("fill", "#233225");
    path.setAttribute("stroke", "#dce6ff");
    path.setAttribute("stroke-width", "0.8");

    group.appendChild(path);
  });
}

export function updateSvgHypocenter(lat, lng) {
  if (!svgRoot || !mapBounds) {
    return;
  }

  hypocenterLayer.innerHTML = "";

  const projected =
    projectLatLng(lat, lng);

  const fitted =
    fitPoint(projected);

  const cross =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );

  cross.setAttribute("x", fitted.x);
  cross.setAttribute("y", fitted.y);
  cross.setAttribute("fill", "#ff3b3b");
  cross.setAttribute("stroke", "white");
  cross.setAttribute("stroke-width", "2");
  cross.setAttribute("font-size", "48");
  cross.setAttribute("font-weight", "900");
  cross.setAttribute("text-anchor", "middle");
  cross.setAttribute("dominant-baseline", "middle");

  cross.textContent = "×";

  hypocenterLayer.appendChild(cross);
}

function updateViewBox() {
  svgRoot.setAttribute(
    "viewBox",
    `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
  );
}

function setupSvgInteractions() {
  updateViewBox();

  svgRoot.addEventListener("wheel", (event) => {
    event.preventDefault();

    const zoomFactor =
      event.deltaY < 0 ? 0.9 : 1.1;

    const rect =
      svgRoot.getBoundingClientRect();

    const mouseX =
      viewBox.x +
      (event.clientX - rect.left) / rect.width * viewBox.width;

    const mouseY =
      viewBox.y +
      (event.clientY - rect.top) / rect.height * viewBox.height;

    const newWidth =
      viewBox.width * zoomFactor;

    const newHeight =
      viewBox.height * zoomFactor;

    viewBox.x =
      mouseX - (mouseX - viewBox.x) * zoomFactor;

    viewBox.y =
      mouseY - (mouseY - viewBox.y) * zoomFactor;

    viewBox.width =
      newWidth;

    viewBox.height =
      newHeight;

    updateViewBox();
  });

  svgRoot.addEventListener("mousedown", (event) => {
    isDragging = true;

    svgRoot.style.cursor =
      "grabbing";

    dragStart = {
      x: event.clientX,
      y: event.clientY,
      viewBoxX: viewBox.x,
      viewBoxY: viewBox.y
    };
  });

  window.addEventListener("mousemove", (event) => {
    if (!isDragging || !dragStart) {
      return;
    }

    const rect =
      svgRoot.getBoundingClientRect();

    const dx =
      (event.clientX - dragStart.x) / rect.width * viewBox.width;

    const dy =
      (event.clientY - dragStart.y) / rect.height * viewBox.height;

    viewBox.x =
      dragStart.viewBoxX - dx;

    viewBox.y =
      dragStart.viewBoxY - dy;

    updateViewBox();
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;

    svgRoot.style.cursor =
      "grab";
  });
}