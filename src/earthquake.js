export const scaleList = {
  10: "1",
  20: "2",
  30: "3",
  40: "4",
  45: "5弱",
  50: "5強",
  55: "6弱",
  60: "6強",
  70: "7"
};

export const intensityColors = {
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

export const DEFAULT_INTENSITY_COLOR =
  "#4b5563";

export function getIntensityColor(scale) {
  return (
    intensityColors[scale] ??
    DEFAULT_INTENSITY_COLOR
  );
}