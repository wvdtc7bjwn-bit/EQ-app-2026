import fs from "fs";
import path from "path";

const inputPath =
  "./local-data/tjma2001";

const outputPath =
  "./src/map/data/jma2001TravelTime.js";

const raw =
  fs.readFileSync(inputPath, "utf-8");

const rows = [];

raw.split(/\r?\n/).forEach(line => {
  const match =
    line.match(
      /P\s+([\d.]+)\s+S\s+([\d.]+)\s+(\d+)\s+(\d+)/
    );

  if (!match) {
    return;
  }

  rows.push({
    pTime: Number(match[1]),
    sTime: Number(match[2]),
    depthKm: Number(match[3]),
    distanceKm: Number(match[4])
  });
});

const byDepth = {};

rows.forEach(row => {
  if (!byDepth[row.depthKm]) {
    byDepth[row.depthKm] = [];
  }

  byDepth[row.depthKm].push({
    distanceKm: row.distanceKm,
    pTime: row.pTime,
    sTime: row.sTime
  });
});

const output =
  `export const jma2001TravelTime = ${JSON.stringify(byDepth)};\n`;

const outputDir =
  path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, {
    recursive: true
  });
}

fs.writeFileSync(
  outputPath,
  output,
  "utf-8"
);

console.log("JMA2001走時表を変換しました");
console.log(`rows: ${rows.length}`);
console.log(`depths: ${Object.keys(byDepth).length}`);
console.log(`output: ${outputPath}`);