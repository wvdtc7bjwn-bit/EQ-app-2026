import {
  svgMapConfig
} from "./projection.js";

let initialized = false;
let isDragging = false;
let dragStart = null;
let targetViewBox = null;
let zoomAnimationId = null;

const MIN_ZOOM_WIDTH = svgMapConfig.width / 24;
const MIN_ZOOM_HEIGHT = svgMapConfig.height / 24;
const MAX_ZOOM_WIDTH = svgMapConfig.width * 1.6;
const MAX_ZOOM_HEIGHT = svgMapConfig.height * 1.6;

function getSvgRoot() {
  return document.getElementById("japan-svg-map");
}

function readViewBox(svgRoot) {
  const values = svgRoot
    .getAttribute("viewBox")
    .trim()
    .split(/\s+/)
    .map(Number);

  if (values.length !== 4 || values.some(Number.isNaN)) {
    return {
      x: 0,
      y: 0,
      width: svgMapConfig.width,
      height: svgMapConfig.height
    };
  }

  return {
    x: values[0],
    y: values[1],
    width: values[2],
    height: values[3]
  };
}

function writeViewBox(svgRoot, viewBox) {
  svgRoot.setAttribute(
    "viewBox",
    `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
  );
}

function animateToTarget() {
  const svgRoot = getSvgRoot();

  if (!svgRoot || !targetViewBox) {
    zoomAnimationId = null;
    return;
  }

  const current = readViewBox(svgRoot);
  const ease = 0.28;

  const next = {
    x: current.x + (targetViewBox.x - current.x) * ease,
    y: current.y + (targetViewBox.y - current.y) * ease,
    width: current.width + (targetViewBox.width - current.width) * ease,
    height: current.height + (targetViewBox.height - current.height) * ease
  };

  writeViewBox(svgRoot, next);

  const diff =
    Math.abs(targetViewBox.x - next.x) +
    Math.abs(targetViewBox.y - next.y) +
    Math.abs(targetViewBox.width - next.width) +
    Math.abs(targetViewBox.height - next.height);

  if (diff > 0.04) {
    zoomAnimationId = requestAnimationFrame(animateToTarget);
  }
  else {
    writeViewBox(svgRoot, targetViewBox);
    zoomAnimationId = null;
  }
}

function startAnimation() {
  if (zoomAnimationId) {
    return;
  }

  zoomAnimationId = requestAnimationFrame(animateToTarget);
}

function handleWheel(event) {
  const svgRoot = getSvgRoot();

  if (!svgRoot) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  const baseViewBox = targetViewBox ?? readViewBox(svgRoot);
  const zoomFactor = event.deltaY < 0 ? 0.82 : 1.18;
  const rect = svgRoot.getBoundingClientRect();

  const mouseX =
    baseViewBox.x +
    ((event.clientX - rect.left) / rect.width) * baseViewBox.width;

  const mouseY =
    baseViewBox.y +
    ((event.clientY - rect.top) / rect.height) * baseViewBox.height;

  const newWidth = Math.max(
    MIN_ZOOM_WIDTH,
    Math.min(MAX_ZOOM_WIDTH, baseViewBox.width * zoomFactor)
  );

  const newHeight = Math.max(
    MIN_ZOOM_HEIGHT,
    Math.min(MAX_ZOOM_HEIGHT, baseViewBox.height * zoomFactor)
  );

  const scaleX = newWidth / baseViewBox.width;
  const scaleY = newHeight / baseViewBox.height;

  targetViewBox = {
    x: mouseX - (mouseX - baseViewBox.x) * scaleX,
    y: mouseY - (mouseY - baseViewBox.y) * scaleY,
    width: newWidth,
    height: newHeight
  };

  startAnimation();
}

function handleMouseDown(event) {
  const svgRoot = getSvgRoot();

  if (!svgRoot || event.button !== 0) {
    return;
  }

  event.stopImmediatePropagation();

  isDragging = true;
  targetViewBox = readViewBox(svgRoot);
  svgRoot.style.cursor = "grabbing";

  dragStart = {
    x: event.clientX,
    y: event.clientY,
    viewBox: targetViewBox
  };
}

function handleMouseMove(event) {
  const svgRoot = getSvgRoot();

  if (!svgRoot || !isDragging || !dragStart) {
    return;
  }

  event.stopImmediatePropagation();

  const rect = svgRoot.getBoundingClientRect();
  const dx = ((event.clientX - dragStart.x) / rect.width) * dragStart.viewBox.width;
  const dy = ((event.clientY - dragStart.y) / rect.height) * dragStart.viewBox.height;

  targetViewBox = {
    ...dragStart.viewBox,
    x: dragStart.viewBox.x - dx,
    y: dragStart.viewBox.y - dy
  };

  writeViewBox(svgRoot, targetViewBox);
}

function handleMouseUp(event) {
  const svgRoot = getSvgRoot();

  if (!isDragging) {
    return;
  }

  event.stopImmediatePropagation();

  isDragging = false;
  dragStart = null;

  if (svgRoot) {
    svgRoot.style.cursor = "grab";
  }
}

export function enableExtendedMapInteractions() {
  if (initialized) {
    return;
  }

  const svgRoot = getSvgRoot();

  if (!svgRoot) {
    return;
  }

  initialized = true;

  svgRoot.addEventListener("wheel", handleWheel, {
    passive: false,
    capture: true
  });

  svgRoot.addEventListener("mousedown", handleMouseDown, {
    capture: true
  });

  window.addEventListener("mousemove", handleMouseMove, {
    capture: true
  });

  window.addEventListener("mouseup", handleMouseUp, {
    capture: true
  });
}
