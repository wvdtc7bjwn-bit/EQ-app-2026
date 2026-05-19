const fs = require("fs");
const path = require("path");

const inputPath =
  path.join(
    __dirname,
   "../local-data/tsunamiArea-lite.geojson"
  );

const outputPath =
  path.join(
    __dirname,
    "../src/map/data/tsunamiAreaGeoJson.js"
  );

const raw =
  fs.readFileSync(
    inputPath,
    "utf-8"
  ).replace(/^\uFEFF/, "");

const geojson =
  JSON.parse(raw);

fs.mkdirSync(
  path.dirname(outputPath),
  { recursive: true }
);

fs.writeFileSync(
  outputPath,
  `export const tsunamiAreaGeoJson = ${JSON.stringify(geojson)};\n`,
  "utf-8"
);

console.log(
  "津波GeoJSON変換完了"
);

console.log(
  `features: ${
    geojson.features?.length ?? 0
  }`
);

console.log(
  `output: ${outputPath}`
);