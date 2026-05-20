import {
  svgMapConfig
} from "./projection.js";

let initialized = false;
let svgObserver = null;
let layerObserver = null;

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
  svgRoot,
  baseSize,
  minSize,
  maxSize
) {
  const zoomScale = getZoomScale(svgRoot);
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

function updateIntensityDots(svgRoot) {
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
        svgRoot,
        baseRadius,
        1.1,
        baseRadius
      )
    );

    circle.setAttribute(
      "stroke-width",
      getNonScalingSize(
        svgRoot,
        0.7,
        0.22,
        0.7
      )
    );
  });
}

function updateHypocenterMarker(svgRoot) {
  const crosses =
    svgRoot.querySelectorAll(
      "#hypocenter-layer text"
    );

  crosses.forEach(cross => {
    cross.setAttribute(
      "font-size",
      getNonScalingSize(
        svgRoot,
        20,
        6,
        20
      )
    );

    cross.setAttribute(
      "stroke-width",
      getNonScalingSize(
        svgRoot,
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

  updateIntensityDots(svgRoot);
  updateHypocenterMarker(svgRoot);
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
    updateNonScalingMarkers();
  });

  targetLayers.forEach(layer => {
    layerObserver.observe(layer, {
      childList: true,
      subtree: true
    });
  });
}

export function initializeNonScalingMarkers() {
  if (initialized) {
    updateNonScalingMarkers();
    return;
  }

  const svgRoot =
    document.getElementById("japan-svg-map");

  if (!svgRoot) {
    return;
  }

  initialized = true;

  svgObserver = new MutationObserver(() => {
    updateNonScalingMarkers();
  });

  svgObserver.observe(svgRoot, {
    attributes: true,
    attributeFilter: ["viewBox"]
  });

  observeMarkerLayers(svgRoot);
  updateNonScalingMarkers();
}

export function refreshNonScalingMarkers() {
  updateNonScalingMarkers();
}
