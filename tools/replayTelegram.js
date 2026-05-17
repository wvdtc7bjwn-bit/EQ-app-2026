const fs = require("fs");
const path = require("path");
const io = require("socket.io-client");

const socket =
  io("http://localhost:3000");

const targetDir =
  process.argv[2];

if (!targetDir) {
  console.log("使い方:");
  console.log(
    "node tools/replayTelegram.js sample-data/VXSE45"
  );

  process.exit(1);
}

const files =
  fs.readdirSync(targetDir)
    .filter(file =>
      file.endsWith(".json")
    )
    .sort();

if (files.length === 0) {
  console.log("jsonファイルなし");
  process.exit(1);
}

console.log(
  `${files.length}件 replay開始`
);

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

async function replay() {
  for (const file of files) {
    const filePath =
      path.join(
        targetDir,
        file
      );

    const raw =
      fs.readFileSync(
        filePath,
        "utf-8"
      );

    const telegram =
      JSON.parse(raw);

    console.log(
      `送信: ${telegram?.head?.type} ${file}`
    );

    socket.emit(
      "replay-telegram",
      telegram
    );

    await sleep(1500);
  }

  console.log("replay終了");
}

socket.on("connect", () => {
  console.log("socket接続");

  replay();
});