import fs from "fs";
import path from "path";
import shapefile from "shapefile";

const shpPath =
  path.resolve("./local-data/津波予報区.shp");

const dbfPath =
  path.resolve("./local-data/津波予報区.dbf");

const outputPath =
  path.resolve("./local-data/tsunamiArea.geojson");

const source =
  await shapefile.open(
    shpPath,
    dbfPath,
    {
      encoding: "shift_jis"
    }
  );

const features = [];

while (true) {
  const result =
    await source.read();

  if (result.done) {
    break;
  }

  features.push(result.value);
}

const geojson = {
  type: "FeatureCollection",
  features
};

fs.writeFileSync(
  outputPath,
  JSON.stringify(geojson),
  "utf-8"
);

console.log("GeoJSON変換完了");
console.log(`features: ${features.length}`);
console.log(`output: ${outputPath}`);

if (features[0]) {
  console.log("先頭properties:");
  console.log(features[0].properties);
}