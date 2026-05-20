let initialized = false;

function getPointScale(circle) {
  const value = Number(circle.dataset.scale ?? "0");

  return Number.isNaN(value)
    ? 0
    : value;
}

function sortIntensityPointsByScale() {
  const layer = document.getElementById("intensity-layer");

  if (!layer) {
    return;
  }

  const circles = Array.from(
    layer.querySelectorAll("circle")
  );

  if (circles.length <= 1) {
    return;
  }

  circles
    .sort((a, b) => getPointScale(a) - getPointScale(b))
    .forEach(circle => {
      layer.appendChild(circle);
    });
}

function shrinkKyoshinDots() {
  const layer = document.getElementById("kyoshin-layer");

  if (!layer) {
    return;
  }

  layer
    .querySelectorAll("circle")
    .forEach(circle => {
      circle.setAttribute("r", "0.9");
    });
}

function applyMapRenderTweaks() {
  sortIntensityPointsByScale();
  shrinkKyoshinDots();
}

export function initializeMapRenderTweaks() {
  if (initialized) {
    applyMapRenderTweaks();
    return;
  }

  initialized = true;

  const observer = new MutationObserver(() => {
    requestAnimationFrame(applyMapRenderTweaks);
  });

  const root = document.getElementById("japan-svg-map");

  if (!root) {
    return;
  }

  observer.observe(root, {
    childList: true,
    subtree: true
  });

  applyMapRenderTweaks();
}
