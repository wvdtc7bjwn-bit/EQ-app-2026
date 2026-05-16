import {
  japanGeoJson
} from "./data/japanGeoJson.js";

import {
  projectLatLng,
  svgMapConfig
} from "./projection.js";

let svgRoot = null;
let mapLayer = null;
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

  return path;
}

function createPolygonPathData(
  polygonCoordinates
) {
  let pathData = "";

  polygonCoordinates.forEach(ring => {
    ring.forEach((coord, index) => {
      const projected =
        projectLatLng(
          coord[1],
          coord[0]
        );

      const fitted =
        fitProjectedPoint(projected);

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

  const projected =
    projectLatLng(
      lat,
      lng
    );

  const fitted =
    fitProjectedPoint(projected);

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

function updateViewBox() {
  if (!svgRoot) {
    return;
  }

  svgRoot.setAttribute(
    "viewBox",
    `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
  );
}

function setupSvgInteractions() {
  svgRoot.addEventListener(
    "wheel",
    event => {
      event.preventDefault();

      const zoomFactor =
        event.deltaY < 0
          ? 0.88
          : 1.14;

      const rect =
        svgRoot.getBoundingClientRect();

      const mouseX =
        viewBox.x +
        ((event.clientX - rect.left) /
          rect.width) *
          viewBox.width;

      const mouseY =
        viewBox.y +
        ((event.clientY - rect.top) /
          rect.height) *
          viewBox.height;

      const newWidth =
        Math.max(
          svgMapConfig.width / 12,
          Math.min(
            svgMapConfig.width * 1.6,
            viewBox.width *
              zoomFactor
          )
        );

      const newHeight =
        Math.max(
          svgMapConfig.height / 12,
          Math.min(
            svgMapConfig.height * 1.6,
            viewBox.height *
              zoomFactor
          )
        );

      const scaleX =
        newWidth /
        viewBox.width;

      const scaleY =
        newHeight /
        viewBox.height;

      viewBox.x =
        mouseX -
        (mouseX - viewBox.x) *
          scaleX;

      viewBox.y =
        mouseY -
        (mouseY - viewBox.y) *
          scaleY;

      viewBox.width =
        newWidth;

      viewBox.height =
        newHeight;

      updateViewBox();
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

      if (svgRoot) {
        svgRoot.style.cursor =
          "grab";
      }
    }
  );
}