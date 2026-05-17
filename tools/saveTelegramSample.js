const fs = require("fs");
const path = require("path");

function saveTelegramSample(data) {
  const code =
    data?.head?.type;

  if (!code) {
    return;
  }

  const targets = [
    "VXSE45",
    "VXSE51",
    "VXSE52",
    "VXSE53"
  ];

  if (!targets.includes(code)) {
    return;
  }

  const dir =
    path.join(
      "sample-data",
      code
    );

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true
    });
  }

  const time =
    new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

  const eventId =
    data?.body?.earthquake?.eventId ??
    data?.head?.time ??
    time;

  const safeEventId =
    String(eventId)
      .replace(/[^\w-]/g, "_");

  const filePath =
    path.join(
      dir,
      `${time}_${safeEventId}.json`
    );

  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    "utf-8"
  );

  console.log(
    `電文サンプル保存: ${filePath}`
  );
}

module.exports = {
  saveTelegramSample
};