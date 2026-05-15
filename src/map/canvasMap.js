import {
  japanGeoJson
} from "./data/japanGeoJson.js";

import {
  projectLatLng,
  svgMapConfig
} from "./projection.js";

let canvas = null;
let ctx = null;
let mapBounds = null;
let hypocenter = null;

export function initializeCanvasMap() {
  const mapArea =
    document.getElementById("map-area");

  const oldCanvas =
    document.getElementById("japan-canvas-map");

  if (oldCanvas) {
    oldCanvas.remove();
  }

  canvas =
    document.createElement("canvas");

  canvas.id =
    "japan-canvas-map";

  canvas.width =
    svgMapConfig.width;

  canvas.height =
    svgMapConfig.height;

  canvas.style.position =
    "absolute";

  canvas.style.top =
    "0";

  canvas.style.left =
    "0";

  canvas.style.width =
    "100%";

  canvas.style.height =
    "100%";

  canvas.style.zIndex =
    "500";

  canvas.style.pointerEvents =
    "none";

  mapArea.appendChild(canvas);

  ctx =
    canvas.getContext("2d");

  mapBounds =
    calculateProjectedBounds();

  drawMap();
}

function calculateProjectedBounds() {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  japanGeoJson.features.forEach(feature => {
    const geometry =
      feature.geometry;

    if (!geometry) return;

    const polygons =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.coordinates;

    polygons.forEach(polygon => {
      polygon.forEach(ring => {
        ring.forEach(coord => {
          const lng =
            coord[0];

          const lat =
            coord[1];

          const p =
            projectLatLng(lat, lng);

          minX =
            Math.min(minX, p.x);

          minY =
            Math.min(minY, p.y);

          maxX =
            Math.max(maxX, p.x);

          maxY =
            Math.max(maxY, p.y);
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
  const padding =
    40;

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

function drawMap() {
  if (!ctx || !mapBounds) {
    return;
  }

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle =
    "#07111d";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle =
    "#1f2f25";

  ctx.strokeStyle =
    "#dce6ff";

  ctx.lineWidth =
    0.6;

  japanGeoJson.features.forEach(feature => {
    const geometry =
      feature.geometry;

    if (!geometry) return;

    if (geometry.type === "Polygon") {
      drawPolygon(
        geometry.coordinates
      );
    }

    else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach(polygon => {
        drawPolygon(
          polygon
        );
      });
    }
  });

  drawHypocenter();
}

function drawPolygon(polygonCoordinates) {
  polygonCoordinates.forEach(ring => {
    ctx.beginPath();

    ring.forEach((coord, index) => {
      const lng =
        coord[0];

      const lat =
        coord[1];

      const projected =
        projectLatLng(lat, lng);

      const fitted =
        fitPoint(projected);

      if (index === 0) {
        ctx.moveTo(
          fitted.x,
          fitted.y
        );
      }

      else {
        ctx.lineTo(
          fitted.x,
          fitted.y
        );
      }
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

function drawHypocenter() {
  if (!hypocenter) {
    return;
  }

  const projected =
    projectLatLng(
      hypocenter.lat,
      hypocenter.lng
    );

  const fitted =
    fitPoint(projected);

  ctx.font =
    "bold 48px sans-serif";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.lineWidth =
    4;

  ctx.strokeStyle =
    "white";

  ctx.fillStyle =
    "#ff3333";

  ctx.strokeText(
    "×",
    fitted.x,
    fitted.y
  );

  ctx.fillText(
    "×",
    fitted.x,
    fitted.y
  );
}

export function updateCanvasHypocenter(lat, lng) {
  if (
    lat === null ||
    lat === undefined ||
    lng === null ||
    lng === undefined
  ) {
    hypocenter =
      null;

    drawMap();

    return;
  }

  hypocenter = {
    lat,
    lng
  };

  drawMap();
}