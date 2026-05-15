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

let cachedPolygons = [];
let hypocenter = null;

let view = {
  scale: 1,
  offsetX: 0,
  offsetY: 0
};

let isDragging = false;
let dragStart = null;
let animationFrameId = null;

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

  canvas.style.cursor =
    "grab";

  mapArea.appendChild(canvas);

  ctx =
    canvas.getContext("2d");

  mapBounds =
    calculateProjectedBounds();

  buildPolygonCache();

  setupCanvasInteractions();

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
          const p =
            projectLatLng(
              coord[1],
              coord[0]
            );

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

function fitProjectedPoint(point) {
  const padding =
    40;

  const width =
    svgMapConfig.width -
    padding * 2;

  const height =
    svgMapConfig.height -
    padding * 2;

  const scaleX =
    width /
    (mapBounds.maxX - mapBounds.minX);

  const scaleY =
    height /
    (mapBounds.maxY - mapBounds.minY);

  const baseScale =
    Math.min(scaleX, scaleY);

  return {
    x:
      padding +
      (point.x - mapBounds.minX) *
        baseScale,

    y:
      padding +
      (point.y - mapBounds.minY) *
        baseScale
  };
}

function buildPolygonCache() {
  cachedPolygons = [];

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
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        const points =
          ring.map(coord => {
            const projected =
              projectLatLng(
                coord[1],
                coord[0]
              );

            const fitted =
              fitProjectedPoint(projected);

            minX =
              Math.min(minX, fitted.x);

            minY =
              Math.min(minY, fitted.y);

            maxX =
              Math.max(maxX, fitted.x);

            maxY =
              Math.max(maxY, fitted.y);

            return fitted;
          });

        cachedPolygons.push({
          points,
          bounds: {
            minX,
            minY,
            maxX,
            maxY
          }
        });
      });
    });
  });

  console.log(
    `cached polygons: ${cachedPolygons.length}`
  );
}

function applyView(point) {
  return {
    x:
      point.x * view.scale +
      view.offsetX,

    y:
      point.y * view.scale +
      view.offsetY
  };
}

function getScreenBounds(bounds) {
  return {
    minX:
      bounds.minX * view.scale +
      view.offsetX,

    minY:
      bounds.minY * view.scale +
      view.offsetY,

    maxX:
      bounds.maxX * view.scale +
      view.offsetX,

    maxY:
      bounds.maxY * view.scale +
      view.offsetY
  };
}

function isVisible(bounds) {
  const screenBounds =
    getScreenBounds(bounds);

  return !(
    screenBounds.maxX < 0 ||
    screenBounds.minX > canvas.width ||
    screenBounds.maxY < 0 ||
    screenBounds.minY > canvas.height
  );
}

function requestDraw() {
  if (animationFrameId) {
    return;
  }

  animationFrameId =
    requestAnimationFrame(() => {
      animationFrameId =
        null;

      drawMap();
    });
}

function drawMap() {
  if (!ctx) {
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
    Math.max(
      0.35,
      0.6 / view.scale
    );

  cachedPolygons.forEach(polygon => {
    if (!isVisible(polygon.bounds)) {
      return;
    }

    ctx.beginPath();

    polygon.points.forEach((point, index) => {
      const p =
        applyView(point);

      if (index === 0) {
        ctx.moveTo(
          p.x,
          p.y
        );
      }

      else {
        ctx.lineTo(
          p.x,
          p.y
        );
      }
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  drawHypocenter();
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
    fitProjectedPoint(projected);

  const p =
    applyView(fitted);

  ctx.font =
    `bold ${
      Math.max(
        24,
        48 / view.scale
      )
    }px sans-serif`;

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.lineWidth =
    Math.max(
      2,
      4 / view.scale
    );

  ctx.strokeStyle =
    "white";

  ctx.fillStyle =
    "#ff3333";

  ctx.strokeText(
    "×",
    p.x,
    p.y
  );

  ctx.fillText(
    "×",
    p.x,
    p.y
  );
}

function setupCanvasInteractions() {
  canvas.addEventListener("wheel", event => {
    event.preventDefault();

    const rect =
      canvas.getBoundingClientRect();

    const mouseX =
      (event.clientX - rect.left) *
      (canvas.width / rect.width);

    const mouseY =
      (event.clientY - rect.top) *
      (canvas.height / rect.height);

    const zoomFactor =
      event.deltaY < 0
        ? 1.15
        : 0.87;

    const newScale =
      Math.min(
        12,
        Math.max(
          0.8,
          view.scale *
            zoomFactor
        )
      );

    const scaleChange =
      newScale / view.scale;

    view.offsetX =
      mouseX -
      (mouseX - view.offsetX) *
        scaleChange;

    view.offsetY =
      mouseY -
      (mouseY - view.offsetY) *
        scaleChange;

    view.scale =
      newScale;

    requestDraw();
  });

  canvas.addEventListener("mousedown", event => {
    isDragging =
      true;

    canvas.style.cursor =
      "grabbing";

    dragStart = {
      x: event.clientX,
      y: event.clientY,
      offsetX:
        view.offsetX,
      offsetY:
        view.offsetY
    };
  });

  window.addEventListener("mousemove", event => {
    if (
      !isDragging ||
      !dragStart
    ) {
      return;
    }

    const rect =
      canvas.getBoundingClientRect();

    const dx =
      (event.clientX -
        dragStart.x) *
      (canvas.width /
        rect.width);

    const dy =
      (event.clientY -
        dragStart.y) *
      (canvas.height /
        rect.height);

    view.offsetX =
      dragStart.offsetX +
      dx;

    view.offsetY =
      dragStart.offsetY +
      dy;

    requestDraw();
  });

  window.addEventListener("mouseup", () => {
    isDragging =
      false;

    canvas.style.cursor =
      "grab";
  });
}

export function updateCanvasHypocenter(
  lat,
  lng
) {
  if (
    lat === null ||
    lat === undefined ||
    lng === null ||
    lng === undefined
  ) {
    hypocenter =
      null;

    requestDraw();

    return;
  }

  hypocenter = {
    lat,
    lng
  };

  requestDraw();
}