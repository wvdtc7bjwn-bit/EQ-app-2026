import fs from "fs";
import path from "path";

const inputPath =
  "./local-data/earthquakeArea.geojson";

const outputPath =
  "./src/map/data/japanGeoJson.js";

const raw =
  fs.readFileSync(inputPath, "utf-8");

const geojson =
  JSON.parse(raw);

let features = [];

if (geojson.type === "FeatureCollection") {
  features =
    geojson.features;
}

else if (geojson.type === "GeometryCollection") {
  features =
    geojson.geometries.map((geometry, index) => {
      return {
        type: "Feature",
        properties: {
          id: index
        },
        geometry
      };
    });
}

else if (
  geojson.type === "Polygon" ||
  geojson.type === "MultiPolygon"
) {
  features = [
    {
      type: "Feature",
      properties: {
        id: 0
      },
      geometry: geojson
    }
  ];
}

else {
  throw new Error(
    `未対応のGeoJSON形式です: ${geojson.type}`
  );
}

const outputGeoJson = {
  type: "FeatureCollection",
  features
};

const outputDir =
  path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, {
    recursive: true
  });
}

const fileText =
  `export const japanGeoJson = ${JSON.stringify(outputGeoJson)};\n`;

fs.writeFileSync(
  outputPath,
  fileText,
  "utf-8"
);

console.log("japanGeoJson.js を作成しました");
console.log(`出力先: ${outputPath}`);
console.log(`features: ${features.length}`);