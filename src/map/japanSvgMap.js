import {
  japanGeoJson
} from "./data/japanGeoJson.js";

import {
  projectLatLng,
  svgMapConfig
} from "./projection.js";

import {
  getWaveDistancesByJma2001
} from "./travelTime.js";

let svgRoot = null;
let mapLayer = null;
let intensityLayer = null;
let hypocenterLayer = null;
let mapBounds = null;
let eewWaveLayer = null;
let activeEewWave = null;
let eewAnimationId = null;
let kyoshinDisplayMode = "normal";
let intensityLabelLayer = null;

let viewBox = {
  x: 0,
  y: 0,
  width: svgMapConfig.width,
  height: svgMapConfig.height
};

let targetViewBox = {
  x: 0,
  y: 0,
  width: svgMapConfig.width,
  height: svgMapConfig.height
};

let zoomAnimationId = null;

let isDragging = false;
let dragStart = null;
let kyoshinLayer = null;

const intensityColors = {
  10: "#01aff9",
  20: "#13b605",
  30: "#f5e904",
  40: "#f8b304",
  45: "#f93904",
  50: "#f50404",
  55: "#c50886",
  60: "#9e07cb",
  70: "#420092"
};

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

  svgRoot.setAttribute(
    "id",
    "japan-svg-map"
  );

  svgRoot.setAttribute(
    "viewBox",
    `0 0 ${svgMapConfig.width} ${svgMapConfig.height}`
  );

  svgRoot.style.position =
    "absolute";

  svgRoot.style.top =
    "0";

  svgRoot.style.left =
    "0";

  svgRoot.style.width =
    "100%";

  svgRoot.style.height =
    "100%";

  svgRoot.style.zIndex =
    "500";

  svgRoot.style.cursor =
    "grab";

  svgRoot.style.background =
    "#07111d";

  svgRoot.style.pointerEvents =
    "auto";

  mapArea.appendChild(svgRoot);

  mapBounds =
    calculateProjectedBounds();

buildMapLayer();
buildIntensityLabelLayer();
buildEewWaveLayer();
buildKyoshinLayer();
buildIntensityLayer();
buildHypocenterLayer();

setupSvgInteractions();

  updateViewBox();
}

function calculateProjectedBounds() {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  japanGeoJson.features.forEach(feature => {
    const geometry =
      feature.geometry;

    if (!geometry) {
      return;
    }

    const polygons =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.coordinates;

    polygons.forEach(polygon => {
      polygon.forEach(ring => {
        ring.forEach(coord => {
          const projected =
            projectLatLng(
              coord[1],
              coord[0]
            );

          minX =
            Math.min(
              minX,
              projected.x
            );

          minY =
            Math.min(
              minY,
              projected.y
            );

          maxX =
            Math.max(
              maxX,
              projected.x
            );

          maxY =
            Math.max(
              maxY,
              projected.y
            );
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

  const scale =
    Math.min(
      scaleX,
      scaleY
    );

  return {
    x:
      padding +
      (point.x - mapBounds.minX) *
        scale,

    y:
      padding +
      (point.y - mapBounds.minY) *
        scale
  };
}

function projectAndFit(lat, lng) {
  const projected =
    projectLatLng(
      lat,
      lng
    );

  return fitProjectedPoint(
    projected
  );
}

function buildMapLayer() {
  mapLayer =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

  mapLayer.setAttribute(
    "id",
    "geojson-layer"
  );

  const fragment =
    document.createDocumentFragment();

  japanGeoJson.features.forEach(feature => {
    const path =
      createFeaturePath(feature);

    if (path) {
      fragment.appendChild(path);
    }
  });

  mapLayer.appendChild(fragment);

  svgRoot.appendChild(mapLayer);
}

function createFeaturePath(feature) {
  const geometry =
    feature.geometry;

  if (!geometry) {
    return null;
  }

  let pathData = "";

  if (geometry.type === "Polygon") {
    pathData +=
      createPolygonPathData(
        geometry.coordinates
      );
  }

  else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach(polygon => {
      pathData +=
        createPolygonPathData(
          polygon
        );
    });
  }

  if (!pathData) {
    return null;
  }

  const path =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

  path.setAttribute(
    "d",
    pathData
  );

  path.setAttribute(
    "fill",
    "#1f2f25"
  );

  path.setAttribute(
    "stroke",
    "#dce6ff"
  );

  path.setAttribute(
    "stroke-width",
    "0.45"
  );

  path.setAttribute(
    "vector-effect",
    "non-scaling-stroke"
  );

  path.setAttribute(
    "shape-rendering",
    "geometricPrecision"
  );

  path.dataset.code =
   feature.properties?.code ?? "";

  path.dataset.name =
   feature.properties?.name ?? "";

  return path;
}

function createPolygonPathData(
  polygonCoordinates
) {
  let pathData = "";

  polygonCoordinates.forEach(ring => {
    ring.forEach((coord, index) => {
      const fitted =
        projectAndFit(
          coord[1],
          coord[0]
        );

      if (index === 0) {
        pathData +=
          `M ${fitted.x.toFixed(2)} ${fitted.y.toFixed(2)}`;
      }

      else {
        pathData +=
          ` L ${fitted.x.toFixed(2)} ${fitted.y.toFixed(2)}`;
      }
    });

    pathData += " Z ";
  });

  return pathData;
}

function buildEewWaveLayer() {
  eewWaveLayer =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

  eewWaveLayer.setAttribute(
    "id",
    "eew-wave-layer"
  );

  svgRoot.appendChild(
    eewWaveLayer
  );
}

function buildIntensityLabelLayer() {
  intensityLabelLayer =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

  intensityLabelLayer.setAttribute(
    "id",
    "intensity-label-layer"
  );

  svgRoot.appendChild(
    intensityLabelLayer
  );
}

function buildKyoshinLayer() {
  kyoshinLayer =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

  kyoshinLayer.setAttribute(
    "id",
    "kyoshin-layer"
  );

  svgRoot.appendChild(
    kyoshinLayer
  );
}

function buildIntensityLayer() {
  intensityLayer =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

  intensityLayer.setAttribute(
    "id",
    "intensity-layer"
  );

  svgRoot.appendChild(
    intensityLayer
  );
}

function buildHypocenterLayer() {
  hypocenterLayer =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

  hypocenterLayer.setAttribute(
    "id",
    "hypocenter-layer"
  );

  svgRoot.appendChild(
    hypocenterLayer
  );
}

export function updateSvgIntensityPoints(
  points,
  scaleList
) {
  if (!intensityLayer || !mapBounds) {
    return;
  }

  intensityLayer.innerHTML =
    "";

  if (
    !Array.isArray(points) ||
    points.length === 0
  ) {
    return;
  }

  const fragment =
    document.createDocumentFragment();

  points.forEach(point => {
    const lat =
      getPointLatitude(point);

    const lng =
      getPointLongitude(point);

    if (
      lat === null ||
      lng === null
    ) {
      return;
    }

    const scale =
      getPointScale(point);

    const fitted =
      projectAndFit(
        lat,
        lng
      );

    const circle =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );

    circle.setAttribute(
      "cx",
      fitted.x
    );

    circle.setAttribute(
      "cy",
      fitted.y
    );

    circle.setAttribute(
      "r",
      getPointRadius(scale)
    );

    circle.setAttribute(
      "fill",
      getIntensityColor(scale)
    );

    circle.setAttribute(
      "stroke",
      "#ffffff"
    );

    circle.setAttribute(
      "stroke-width",
      "0.7"
    );

    circle.setAttribute(
      "vector-effect",
      "non-scaling-stroke"
    );

    const title =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "title"
      );

    const intensityText =
      scaleList?.[scale] ??
      point.intensity ??
      point.maxInt ??
      "-";

    title.textContent =
      `${point.name ?? point.addr ?? "観測点"} 震度 ${intensityText}`;

    circle.appendChild(title);

    fragment.appendChild(circle);
  });

  intensityLayer.appendChild(fragment);
}

export function updateIntensityAreas(
  regions = []
) {
  if (!mapLayer) {
    return;
  }

  if (intensityLabelLayer) {
    intensityLabelLayer.innerHTML = "";
  }

  const paths =
    mapLayer.querySelectorAll("path");

  paths.forEach(path => {
    path.setAttribute("fill", "#1f2f25");
    path.setAttribute("fill-opacity", "1");
  });

  regions.forEach(region => {
    const code =
      String(region.code);

    const intensity =
      region.maxInt;

    const target =
      mapLayer.querySelector(
        `path[data-code="${code}"]`
      );

    if (!target) {
      return;
    }

    target.setAttribute(
      "fill",
      getAreaIntensityColor(intensity)
    );

    target.setAttribute(
      "fill-opacity",
      "0.92"
    );

    drawIntensityAreaLabel(
      target,
      intensity
    );
  });
}

function drawIntensityAreaLabel(
  path,
  intensity
) {
  if (!intensityLabelLayer) {
    return;
  }

  const bbox =
    path.getBBox();

  if (
    bbox.width < 4 ||
    bbox.height < 4
  ) {
    return;
  }

  const x =
    bbox.x + bbox.width / 2;

  const y =
    bbox.y + bbox.height / 2;

  const group =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

  const rect =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );

  rect.setAttribute("x", x - 10);
  rect.setAttribute("y", y - 10);
  rect.setAttribute("width", "20");
  rect.setAttribute("height", "20");
  rect.setAttribute("rx", "4");
  rect.setAttribute("ry", "4");
  rect.setAttribute("fill", "rgba(0,0,0,0.22)");
  rect.setAttribute("stroke", "rgba(255,255,255,0.25)");
  rect.setAttribute("stroke-width", "0.5");
  rect.setAttribute("vector-effect", "non-scaling-stroke");

  const text =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );

  text.setAttribute("x", x);
  text.setAttribute("y", y + 0.5);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");
  text.setAttribute("font-size", "13");
  text.setAttribute("font-weight", "900");
  text.setAttribute("fill", "#111827");
  text.setAttribute("stroke", "rgba(255,255,255,0.45)");
  text.setAttribute("stroke-width", "0.45");
  text.setAttribute("paint-order", "stroke");
  text.setAttribute("vector-effect", "non-scaling-stroke");

  text.textContent =
    formatIntensityLabel(intensity);

  group.appendChild(rect);
  group.appendChild(text);

  intensityLabelLayer.appendChild(group);
}

function formatIntensityLabel(intensity) {
  const table = {
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5-": "5−",
    "5弱": "5−",
    "5+": "5+",
    "5強": "5+",
    "6-": "6−",
    "6弱": "6−",
    "6+": "6+",
    "6強": "6+",
    "7": "7"
  };

  return table[intensity] ?? String(intensity ?? "");
}

export function updateSvgHypocenter(
  lat,
  lng
) {
  if (
    !svgRoot ||
    !mapBounds ||
    !hypocenterLayer
  ) {
    return;
  }

  hypocenterLayer.innerHTML =
    "";

  if (
    lat === null ||
    lat === undefined ||
    lng === null ||
    lng === undefined
  ) {
    return;
  }

  const fitted =
    projectAndFit(
      lat,
      lng
    );

  const cross =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );

  cross.setAttribute(
    "x",
    fitted.x
  );

  cross.setAttribute(
    "y",
    fitted.y
  );

  cross.setAttribute(
    "fill",
    "#ff3333"
  );

  cross.setAttribute(
    "stroke",
    "white"
  );

  cross.setAttribute(
    "stroke-width",
    "2"
  );

  cross.setAttribute(
    "font-size",
    "48"
  );

  cross.setAttribute(
    "font-weight",
    "900"
  );

  cross.setAttribute(
    "text-anchor",
    "middle"
  );

  cross.setAttribute(
    "dominant-baseline",
    "middle"
  );

  cross.setAttribute(
    "vector-effect",
    "non-scaling-stroke"
  );

  cross.textContent =
    "×";

  hypocenterLayer.appendChild(
    cross
  );
}

function getPointLatitude(point) {
  return getNumberValue(
    point.latitude ??
    point.lat ??
    point.coordinate?.latitude ??
    point.position?.lat
  );
}

function getPointLongitude(point) {
  return getNumberValue(
    point.longitude ??
    point.lng ??
    point.lon ??
    point.coordinate?.longitude ??
    point.position?.lng
  );
}

function getPointScale(point) {
  return (
    point.scale ??
    convertIntensityToScale(
      point.intensity ??
      point.maxInt
    )
  );
}

function getNumberValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "object") {
    return getNumberValue(
      value.value
    );
  }

  const number =
    Number(value);

  return Number.isNaN(number)
    ? null
    : number;
}

function convertIntensityToScale(value) {
  const list = {
    "1": 10,
    "2": 20,
    "3": 30,
    "4": 40,
    "5-": 45,
    "5弱": 45,
    "5+": 50,
    "5強": 50,
    "6-": 55,
    "6弱": 55,
    "6+": 60,
    "6強": 60,
    "7": 70
  };

  return list[value] ?? 0;
}

function getIntensityColor(scale) {
  return (
    intensityColors[scale] ??
    "#4b5563"
  );
}

function getAreaIntensityColor(
  intensity
) {
  const table = {
    "1": "#01aff9",
    "2": "#13b605",
    "3": "#f5e904",
    "4": "#f8b304",
    "5-": "#f93904",
    "5弱": "#f93904",
    "5+": "#f50404",
    "5強": "#f50404",
    "6-": "#c50886",
    "6弱": "#c50886",
    "6+": "#9e07cb",
    "6強": "#9e07cb",
    "7": "#420092"
  };

  return (
    table[intensity] ??
    "#1f2f25"
  );
}

function getPointRadius(scale) {
  if (scale >= 60) {
    return 6.5;
  }

  if (scale >= 50) {
    return 5.8;
  }

  if (scale >= 45) {
    return 5.2;
  }

  if (scale >= 40) {
    return 4.6;
  }

  if (scale >= 30) {
    return 4;
  }

  return 3.5;
}

function updateViewBox() {
  if (!svgRoot) {
    return;
  }

  svgRoot.setAttribute(
    "viewBox",
    `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
  );
}

function animateViewBox() {
  const ease =
    0.22;

  viewBox.x +=
    (targetViewBox.x - viewBox.x) *
    ease;

  viewBox.y +=
    (targetViewBox.y - viewBox.y) *
    ease;

  viewBox.width +=
    (targetViewBox.width - viewBox.width) *
    ease;

  viewBox.height +=
    (targetViewBox.height - viewBox.height) *
    ease;

  updateViewBox();

  const diff =
    Math.abs(targetViewBox.x - viewBox.x) +
    Math.abs(targetViewBox.y - viewBox.y) +
    Math.abs(targetViewBox.width - viewBox.width) +
    Math.abs(targetViewBox.height - viewBox.height);

  if (diff > 0.05) {
    zoomAnimationId =
      requestAnimationFrame(
        animateViewBox
      );
  }
  else {
    viewBox = {
      ...targetViewBox
    };

    updateViewBox();

    zoomAnimationId =
      null;
  }
}

function startViewBoxAnimation() {
  if (zoomAnimationId) {
    return;
  }

  zoomAnimationId =
    requestAnimationFrame(
      animateViewBox
    );
}

function setupSvgInteractions() {
    svgRoot.addEventListener(
    "wheel",
    event => {
      event.preventDefault();

      const zoomFactor =
        event.deltaY < 0
          ? 0.86
          : 1.16;

      const rect =
        svgRoot.getBoundingClientRect();

      const mouseX =
        targetViewBox.x +
        ((event.clientX - rect.left) /
          rect.width) *
          targetViewBox.width;

      const mouseY =
        targetViewBox.y +
        ((event.clientY - rect.top) /
          rect.height) *
          targetViewBox.height;

      const newWidth =
        Math.max(
          svgMapConfig.width / 12,
          Math.min(
            svgMapConfig.width * 1.6,
            targetViewBox.width *
              zoomFactor
          )
        );

      const newHeight =
        Math.max(
          svgMapConfig.height / 12,
          Math.min(
            svgMapConfig.height * 1.6,
            targetViewBox.height *
              zoomFactor
          )
        );

      const scaleX =
        newWidth /
        targetViewBox.width;

      const scaleY =
        newHeight /
        targetViewBox.height;

      targetViewBox.x =
        mouseX -
        (mouseX - targetViewBox.x) *
          scaleX;

      targetViewBox.y =
        mouseY -
        (mouseY - targetViewBox.y) *
          scaleY;

      targetViewBox.width =
        newWidth;

      targetViewBox.height =
        newHeight;

      startViewBoxAnimation();
    },
    {
      passive: false
    }
  );

  svgRoot.addEventListener(
    "mousedown",
    event => {
      isDragging =
        true;

      svgRoot.style.cursor =
        "grabbing";

      dragStart = {
        x: event.clientX,
        y: event.clientY,
        viewBoxX:
          viewBox.x,
        viewBoxY:
          viewBox.y
      };
    }
  );

  window.addEventListener(
    "mousemove",
    event => {
      if (
        !isDragging ||
        !dragStart
      ) {
        return;
      }

      const rect =
        svgRoot.getBoundingClientRect();

      const dx =
        ((event.clientX -
          dragStart.x) /
          rect.width) *
        viewBox.width;

      const dy =
        ((event.clientY -
          dragStart.y) /
          rect.height) *
        viewBox.height;

      viewBox.x =
        dragStart.viewBoxX -
        dx;

      viewBox.y =
        dragStart.viewBoxY -
        dy;

      updateViewBox();
    }
  );

  window.addEventListener(
    "mouseup",
    () => {
      isDragging =
        false;
      targetViewBox = {
        ...viewBox
    };  

      if (svgRoot) {
        svgRoot.style.cursor =
          "grab";
      }
    }
  );
}

export function updateSvgEewWaves(
  data,
  options = {}
) {
  if (
    data?.latitude === null ||
    data?.latitude === undefined ||
    data?.longitude === null ||
    data?.longitude === undefined ||
    !data?.time
  ) {
    console.log(
      "EEW波描画スキップ:",
      data
    );

    return;
  }

  const replayMode =
    options.replay === true;

  let originTime;

  if (replayMode) {
    originTime =
      Date.now();
  }
  else {
    originTime =
      new Date(
        data.time
      ).getTime();

    if (
      Number.isNaN(originTime)
    ) {
      originTime =
        Date.now();
    }
  }

  activeEewWave = {
    latitude:
      Number(data.latitude),

    longitude:
      Number(data.longitude),

    depthKm:
      Number(data.depth) || 10,

    originTime
  };

  console.log(
    "EEW波描画開始:",
    activeEewWave
  );

  if (eewAnimationId) {
    cancelAnimationFrame(
      eewAnimationId
    );
  }

  animateEewWaves();
}

function animateEewWaves() {
  drawEewWaves();

  eewAnimationId =
    requestAnimationFrame(
      animateEewWaves
    );
}

function drawEewWaves() {
  if (
    !activeEewWave ||
    !eewWaveLayer
  ) {
    return;
  }

  eewWaveLayer.innerHTML =
    "";

  const elapsedSec =
    (
      Date.now() -
      activeEewWave.originTime
    ) / 1000;

  const {
    pDistanceKm,
    sDistanceKm
   } =
  getWaveDistancesByJma2001(
    activeEewWave.depthKm,
    elapsedSec
  );

  drawWaveCircle(
    activeEewWave.latitude,
    activeEewWave.longitude,
    pDistanceKm,
    "#0022ff",
    "P"
  );

  drawWaveCircle(
    activeEewWave.latitude,
    activeEewWave.longitude,
    sDistanceKm,
    "#ff4000",
    "S"
  );
}

function drawWaveCircle(
  lat,
  lng,
  distanceKm,
  color,
  label
) {
  const center =
    projectAndFit(
      lat,
      lng
    );

  const edge =
    projectAndFit(
      lat +
        distanceKm / 111,
      lng
    );

  const radius =
    Math.abs(
      edge.y - center.y
    );

  const circle =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );

  circle.setAttribute(
    "cx",
    center.x
  );

  circle.setAttribute(
    "cy",
    center.y
  );

  circle.setAttribute(
    "r",
    radius
  );

  circle.setAttribute(
    "fill",
    "none"
  );

  circle.setAttribute(
    "stroke",
    color
  );

  circle.setAttribute(
    "stroke-width",
    "2"
  );

  circle.setAttribute(
    "opacity",
    "0.85"
  );

  circle.setAttribute(
    "vector-effect",
    "non-scaling-stroke"
  );

  eewWaveLayer.appendChild(
    circle
  );

  const text =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );

  text.setAttribute(
    "x",
    center.x + radius + 6
  );

  text.setAttribute(
    "y",
    center.y
  );

  text.setAttribute(
    "fill",
    color
  );

  text.setAttribute(
    "font-size",
    "16"
  );

  text.setAttribute(
    "font-weight",
    "bold"
  );

  text.textContent =
    label;

  eewWaveLayer.appendChild(
    text
  );
}

export function updateKyoshinDots(points) {
  if (
    !kyoshinLayer ||
    !mapBounds
  ) {
    return;
  }

  kyoshinLayer.innerHTML =
    "";

  if (
    !Array.isArray(points) ||
    points.length === 0
  ) {
    return;
  }

  const fragment =
    document.createDocumentFragment();

  points.forEach(point => {
  if (
     kyoshinDisplayMode === "active-only" &&
     !isKyoshinActiveColor(point)
   ) {
     return;
    }
    if (
      point.latitude === null ||
      point.latitude === undefined ||
      point.longitude === null ||
      point.longitude === undefined ||
      !point.color
    ) {
      return;
    }

    if (
      Array.isArray(point.rgb) &&
      point.rgb[0] < 8 &&
      point.rgb[1] < 8 &&
      point.rgb[2] < 8
    ) {
      return;
    }

    const fitted =
      projectAndFit(
        point.latitude,
        point.longitude
      );

    const circle =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );

    circle.setAttribute(
      "cx",
      fitted.x
    );

    circle.setAttribute(
      "cy",
      fitted.y
    );

    circle.setAttribute(
      "r",
      "1.4"
    );

    circle.setAttribute(
      "fill",
      point.color
    );

    circle.setAttribute(
      "stroke",
      "none"
    );

    circle.setAttribute(
      "vector-effect",
      "non-scaling-stroke"
    );

    circle.style.pointerEvents =
      "none";

    const title =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "title"
      );

    title.textContent =
      `${point.name ?? "観測点"} ${point.color}`;

    circle.appendChild(title);

    fragment.appendChild(circle);
  });

  kyoshinLayer.appendChild(
    fragment
  );
}

export function clearSvgEewWaves() {
  activeEewWave = null;

  if (eewAnimationId) {
    cancelAnimationFrame(eewAnimationId);
    eewAnimationId = null;
  }

  if (eewWaveLayer) {
    eewWaveLayer.innerHTML = "";
  }
}

function isKyoshinActiveColor(point) {
  if (!Array.isArray(point.rgb)) {
    return false;
  }

  const [r, g, b] =
    point.rgb;

  // 黒・暗色・背景色っぽい点を除外
  if (
    r < 20 &&
    g < 20 &&
    b < 20
  ) {
    return false;
  }

  // 青系以下を「0未満〜0付近」として除外
  // 防災科研色を震度変換はしないが、表示制御だけ行う
  if (
    b > r &&
    b > g &&
    r < 80
  ) {
    return false;
  }

  return true;
}

export function setKyoshinDisplayMode(mode) {
  kyoshinDisplayMode =
    mode;

  if (!kyoshinLayer) {
    return;
  }

  if (mode === "hidden") {
    kyoshinLayer.style.display =
      "none";
  }
  else if (mode === "active-only") {
    kyoshinLayer.style.display =
      "block";

    kyoshinLayer.style.opacity =
      "0.28";
  }
  else {
    kyoshinLayer.style.display =
      "block";

    kyoshinLayer.style.opacity =
      "1";
  }
}