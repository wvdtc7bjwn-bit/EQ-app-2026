const fs = require("fs");
const zlib = require("zlib");

const filePath =
  process.argv[2];

if (!filePath) {
  console.log("使い方:");
  console.log("node tools/decodeTelegramBody.js sample-data/VXSE53/ファイル名.json");
  process.exit(1);
}

const raw =
  fs.readFileSync(filePath, "utf-8");

const telegram =
  JSON.parse(raw);

console.log("type:", telegram?.head?.type);
console.log("schema:", telegram?.schema);
console.log("encoding:", telegram?.encoding);
console.log("compression:", telegram?.compression);
console.log("xmlReport.head:", telegram?.xmlReport?.head);

if (!telegram.body) {
  console.log("body がありません");
  process.exit(0);
}

let decodedText = "";

if (
  telegram.encoding === "base64" &&
  telegram.compression === "gzip"
) {
  const buffer =
    Buffer.from(telegram.body, "base64");

  decodedText =
    zlib.gunzipSync(buffer).toString("utf-8");
}
else if (typeof telegram.body === "string") {
  decodedText =
    telegram.body;
}
else {
  decodedText =
    JSON.stringify(telegram.body, null, 2);
}

console.log("");
console.log("=== decoded body text first 3000 chars ===");
console.log(decodedText.slice(0, 3000));

let body;

try {
  body =
    JSON.parse(decodedText);
}
catch (error) {
  console.log("");
  console.log("JSON parse失敗:");
  console.log(error.message);
  process.exit(1);
}

console.log("");
console.log("=== body top keys ===");
console.log(Object.keys(body));

console.log("");
console.log("=== body.earthquake ===");
console.log(JSON.stringify(body.earthquake, null, 2).slice(0, 4000));

console.log("");
console.log("=== body.intensity ===");
console.log(JSON.stringify(body.intensity, null, 2).slice(0, 4000));

console.log("");
console.log("=== full body preview ===");
console.log(JSON.stringify(body, null, 2).slice(0, 8000));