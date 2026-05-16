import fs from "fs";
import path from "path";
import { topology } from "topojson-server";

const inputPath =
  "../local-data/earthquakeArea.geojson";

const outputPath =
  "../public/mapdata/earthquakeAreas.topo.json";

const raw =
  fs.readFileSync(inputPath, "utf-8");

const geojson =
  JSON.parse(raw);

let featureCollection = null;

if (geojson.type === "FeatureCollection") {
  featureCollection =
    geojson;
}
else if (geojson.type === "GeometryCollection") {
  featureCollection = {
    type: "FeatureCollection",
    features:
      geojson.geometries.map((geometry, index) => ({
        type: "Feature",
        properties: {
          id: index
        },
        geometry
      }))
  };
}
else if (
  geojson.type === "Polygon" ||
  geojson.type === "MultiPolygon"
) {
  featureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          id: 0
        },
        geometry: geojson
      }
    ]
  };
}
else {
  throw new Error(
    `未対応のGeoJSON形式です: ${geojson.type}`
  );
}

const topo =
  topology({
    earthquakeAreas: featureCollection
  });

const outputDir =
  path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, {
    recursive: true
  });
}

fs.writeFileSync(
  outputPath,
  JSON.stringify(topo),
  "utf-8"
);

console.log("TopoJSONを作成しました");
console.log(`出力先: ${outputPath}`);
console.log(`features: ${featureCollection.features.length}`);