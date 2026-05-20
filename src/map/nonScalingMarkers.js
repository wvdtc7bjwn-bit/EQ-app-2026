import {
  svgMapConfig
} from "./projection.js";

let initialized = false;
let svgObserver = null;
let layerObserver = null;
let refreshAnimationId = null;
let lastZoomScale = 1;

function getZoomScale(svgRoot) {
  const viewBoxText =
    svgRoot?.getAttribute("viewBox") ?? "";

  const [, , widthText] =
    viewBoxText
      .trim()
      .split(/\s+/);

  const viewBoxWidth = Number(widthText);

  if (
    !viewBoxWidth ||
    Number.isNaN(viewBoxWidth)
  ) {
    return 1;
  }

  return svgMapConfig.width / viewBoxWidth;
}

function getNonScalingSize(
  zoomScale,
  baseSize,
  minSize,
  maxSize
) {
  const size = baseSize / zoomScale;

  return Math.max(
    minSize,
    Math.min(maxSize, size)
  );
}

function getCircleBaseRadius(circle) {
  if (circle.dataset.baseRadius) {
    return Number(circle.dataset.baseRadius);
  }

  const currentRadius = Number(
    circle.getAttribute("r")
  );

  const baseRadius =
    Number.isNaN(currentRadius)
      ? 4
      : Math.max(3.5, Math.min(6.5, currentRadius));

  circle.dataset.baseRadius =
    String(baseRadius);

  return baseRadius;
}

function updateIntensityDots(svgRoot, zoomScale) {
  const circles =
    svgRoot.querySelectorAll(
      "#intensity-layer circle"
    );

  circles.forEach(circle => {
    const baseRadius =
      getCircleBaseRadius(circle);

    circle.setAttribute(
      "r",
      getNonScalingSize(
        zoomScale,
        baseRadius,
        1.1,
        baseRadius
      )
    );

    circle.setAttribute(
      "stroke-width",
      getNonScalingSize(
        zoomScale,
        0.7,
        0.22,
        0.7
      )
    );
  });
}

function updateHypocenterMarker(svgRoot, zoomScale) {
  const crosses =
    svgRoot.querySelectorAll(
      "#hypocenter-layer text"
    );

  crosses.forEach(cross => {
    cross.setAttribute(
      "font-size",
      getNonScalingSize(
        zoomScale,
        20,
        6,
        20
      )
    );

    cross.setAttribute(
      "stroke-width",
      getNonScalingSize(
        zoomScale,
        0.7,
        0.18,
        0.7
      )
    );
  });
}

function updateNonScalingMarkers() {
  const svgRoot =
    document.getElementById("japan-svg-map");

  if (!svgRoot) {
    return;
  }

  const zoomScale =
    getZoomScale(svgRoot);

  lastZoomScale = zoomScale;

  updateIntensityDots(svgRoot, zoomScale);
  updateHypocenterMarker(svgRoot, zoomScale);
}

function requestMarkerRefresh() {
  if (refreshAnimationId) {
    return;
  }

  refreshAnimationId = requestAnimationFrame(() => {
    refreshAnimationId = null;
    updateNonScalingMarkers();
  });
}

function observeMarkerLayers(svgRoot) {
  if (layerObserver) {
    layerObserver.disconnect();
  }

  const targetLayers = [
    svgRoot.querySelector("#intensity-layer"),
    svgRoot.querySelector("#hypocenter-layer")
  ].filter(Boolean);

  if (targetLayers.length === 0) {
    return;
  }

  layerObserver = new MutationObserver(() => {
    requestMarkerRefresh();
  });

  targetLayers.forEach(layer => {
    layerObserver.observe(layer, {
      childList: true,
      subtree: true
    });
  });
}

export function initializeNonScalingMarkers() {
  const svgRoot =
    document.getElementById("japan-svg-map");

  if (!svgRoot) {
    return;
  }

  if (initialized) {
    requestMarkerRefresh();
    return;
  }

  initialized = true;

  svgObserver = new MutationObserver(() => {
    const zoomScale = getZoomScale(svgRoot);

    if (Math.abs(zoomScale - lastZoomScale) < 0.015) {
      return;
    }

    requestMarkerRefresh();
  });

  svgObserver.observe(svgRoot, {
    attributes: true,
    attributeFilter: ["viewBox"]
  });

  observeMarkerLayers(svgRoot);
  requestMarkerRefresh();
}

export function refreshNonScalingMarkers() {
  requestMarkerRefresh();
}
