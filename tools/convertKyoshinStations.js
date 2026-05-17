const fs = require("fs");
const path = require("path");

const inputPath =
  path.join(
    __dirname,
    "../temp-kyoshin-points/intensity-points.json"
  );

const outputPath =
  path.join(
    __dirname,
    "../server-data/kyoshinStations.json"
  );

const raw =
  fs.readFileSync(
    inputPath,
    "utf-8"
  )
    .replace(/^\uFEFF/, "");

const json =
  JSON.parse(raw);

const list =
  Array.isArray(json)
    ? json
    : json.points ??
      json.items ??
      json.data ??
      [];

const converted =
  list
    .map((point, index) => {
      const center =
        point.point?.center_point;

      return {
        code:
          String(
            point.code ??
            `point-${index}`
          ),

        name:
          String(
            point.name ??
            point.code ??
            `観測点${index}`
          ),

        type:
          point.type ??
          null,

        region:
          point.region ??
          null,

        subRegion:
          point.sub_region ??
          null,

        suspended:
          point.is_suspended === true,

        lat:
          Number(
            point.location?.latitude
          ),

        lon:
          Number(
            point.location?.longitude
          ),

        x:
          Number(
            center?.x
          ),

        y:
          Number(
            center?.y
          )
      };
    })
    .filter(point =>
      point.suspended !== true &&
      Number.isFinite(point.lat) &&
      Number.isFinite(point.lon) &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y)
    );

fs.mkdirSync(
  path.dirname(outputPath),
  {
    recursive: true
  }
);

fs.writeFileSync(
  outputPath,
  JSON.stringify(converted, null, 2),
  "utf-8"
);

console.log(
  `変換完了: ${converted.length}点`
);

console.log(
  `出力: ${outputPath}`
);

console.log(
  "先頭サンプル:"
);

console.log(
  converted.slice(0, 5)
);