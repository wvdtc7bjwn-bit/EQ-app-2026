import fs from "fs";

const inputPath =
  "./local-data/earthquakeArea.geojson";

const raw =
  fs.readFileSync(inputPath, "utf-8");

const geojson =
  JSON.parse(raw);

let geometries = [];

if (geojson.type === "FeatureCollection") {
  geometries =
    geojson.features.map(feature => feature.geometry);
}

else if (geojson.type === "GeometryCollection") {
  geometries =
    geojson.geometries;
}

else {
  geometries = [geojson];
}

let polygonCount = 0;
let ringCount = 0;
let pointCount = 0;

const coordinateFrequency =
  new Map();

function addCoord(coord) {
  const key =
    `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;

  coordinateFrequency.set(
    key,
    (coordinateFrequency.get(key) ?? 0) + 1
  );
}

function analyzeRing(ring) {
  ringCount += 1;
  pointCount += ring.length;

  ring.forEach(addCoord);
}

function analyzeGeometry(geometry) {
  if (!geometry) {
    return;
  }

  if (geometry.type === "Polygon") {
    polygonCount += 1;

    geometry.coordinates.forEach(analyzeRing);
  }

  else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach(polygon => {
      polygonCount += 1;

      polygon.forEach(analyzeRing);
    });
  }
}

geometries.forEach(analyzeGeometry);

let duplicatedPointTypes = 0;
let duplicatedPointUses = 0;

for (const count of coordinateFrequency.values()) {
  if (count > 1) {
    duplicatedPointTypes += 1;
    duplicatedPointUses += count;
  }
}

console.log("=== GeoJSON Analysis ===");
console.log(`geometries: ${geometries.length}`);
console.log(`polygons: ${polygonCount}`);
console.log(`rings: ${ringCount}`);
console.log(`points: ${pointCount}`);
console.log(`unique coordinate points: ${coordinateFrequency.size}`);
console.log(`duplicated coordinate types: ${duplicatedPointTypes}`);
console.log(`duplicated coordinate uses: ${duplicatedPointUses}`);
console.log(
  `duplicate ratio: ${(
    duplicatedPointUses / pointCount * 100
  ).toFixed(2)}%`
);

const topDuplicates =
  [...coordinateFrequency.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

console.log("");
console.log("=== Top duplicated coordinates ===");

topDuplicates.forEach(([coord, count]) => {
  console.log(`${coord}: ${count}`);
});