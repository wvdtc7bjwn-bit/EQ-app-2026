import fs from "fs";

const inputPath = "./local-data/stations.json";
const outputPath = "./local-data/stations.compact.json";

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const stations = JSON.parse(
  fs.readFileSync(inputPath, "utf-8")
);

const compact = {};

for (const station of stations) {
  const code = String(station.code ?? "").trim();
  const latitude = Number(station.lat);
  const longitude = Number(station.lon);

  if (
    !code ||
    !station.name ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    continue;
  }

  compact[code] = {
    name: station.name,
    latitude,
    longitude
  };
}

fs.writeFileSync(
  outputPath,
  JSON.stringify(compact)
);

console.log(`Generated ${outputPath}`);
console.log(`${Object.keys(compact).length} stations`);