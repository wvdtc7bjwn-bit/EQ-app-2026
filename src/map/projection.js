const DEG_TO_RAD =
  Math.PI / 180;

const SVG_WIDTH =
  800;

const SVG_HEIGHT =
  620;

const PHI1 =
  30 * DEG_TO_RAD;

const PHI2 =
  42 * DEG_TO_RAD;

const LAT0 =
  36 * DEG_TO_RAD;

const LON0 =
  138 * DEG_TO_RAD;

const n =
  Math.log(
    Math.cos(PHI1) / Math.cos(PHI2)
  ) /
  Math.log(
    Math.tan(Math.PI / 4 + PHI2 / 2) /
    Math.tan(Math.PI / 4 + PHI1 / 2)
  );

const F =
  Math.cos(PHI1) *
  Math.pow(
    Math.tan(Math.PI / 4 + PHI1 / 2),
    n
  ) /
  n;

const rho0 =
  F /
  Math.pow(
    Math.tan(Math.PI / 4 + LAT0 / 2),
    n
  );

const SCALE =
  1450;

const CENTER_X =
  390;

const CENTER_Y =
  260;

export function projectLatLng(lat, lng) {
  const phi =
    lat * DEG_TO_RAD;

  const lambda =
    lng * DEG_TO_RAD;

  const rho =
    F /
    Math.pow(
      Math.tan(Math.PI / 4 + phi / 2),
      n
    );

  const theta =
    n * (lambda - LON0);

  const x =
    CENTER_X +
    SCALE * rho * Math.sin(theta);

  const y =
    CENTER_Y -
    SCALE * (rho0 - rho * Math.cos(theta));

  return {
    x,
    y
  };
}

export const svgMapConfig = {
  width: SVG_WIDTH,
  height: SVG_HEIGHT
};