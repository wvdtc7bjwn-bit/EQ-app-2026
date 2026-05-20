require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const WebSocket = require("ws");

const {
  routeTelegram
} = require("./dmdataRouter");

const {
  saveTelegramSample
} = require("./tools/saveTelegramSample");

const {
  startKyoshinMonitor
} = require("./server/kyoshinService");

const API_KEY =
  process.env.DMDATA_API_KEY;

const PORT =
  process.env.PORT || 3000;

const SAVE_TELEGRAM_SAMPLE =
  process.env.SAVE_TELEGRAM_SAMPLE === "true";

const DMDATA_TEST_MODE =
  process.env.DMDATA_TEST_MODE || "excluding";

let dmdataWs = null;
let dmdataReconnectTimer = null;
let dmdataReconnectAttempt = 0;
let dmdataConnecting = false;

const app =
  express();

const server =
  http.createServer(app);

const io =
  new Server(server);

app.use(
  express.static(__dirname, {
    dotfiles: "ignore",
    index: "index.html"
  })
);

io.on("connection", (socket) => {
  console.log("ブラウザ接続");

  socket.on("replay-telegram", (telegram) => {
    if (process.env.NODE_ENV === "production") {
      console.log("production環境ではreplay-telegramを無効化しています");
      return;
    }

    console.log(
      "replay受信:",
      telegram?.head?.type
    );

    telegram.__replay = true;

    routeTelegram(
      telegram,
      io
    );
  });
});

function scheduleDmdataReconnect(reason = "unknown") {
  if (dmdataReconnectTimer) {
    return;
  }

  const delay = Math.min(
    5000 * Math.max(1, dmdataReconnectAttempt),
    60000
  );

  console.log(
    `dmdata再接続予約: ${delay}ms reason=${reason}`
  );

  dmdataReconnectTimer =
    setTimeout(() => {
      dmdataReconnectTimer = null;
      dmdataReconnectAttempt += 1;
      startDmdataSocket();
    }, delay);
}

async function startDmdataSocket() {
  if (!API_KEY) {
    console.log("DMDATA_API_KEY が設定されていません");
    return;
  }

  if (dmdataConnecting) {
    return;
  }

  if (
    dmdataWs &&
    (
      dmdataWs.readyState === WebSocket.OPEN ||
      dmdataWs.readyState === WebSocket.CONNECTING
    )
  ) {
    return;
  }

  dmdataConnecting = true;

  try {
    const basic =
      Buffer.from(`${API_KEY}:`).toString("base64");

    const response =
      await fetch("https://api.dmdata.jp/v2/socket", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          classifications: [
            "telegram.earthquake",
            "eew.forecast"
          ],
          test: DMDATA_TEST_MODE,
          appName: "quake-app-main",
          formatMode: "json"
        })
      });

    const socketInfo =
      await response.json();

    console.log("Socket Start Response:");
    console.log(socketInfo);

    if (socketInfo.status !== "ok") {
      console.log("Socket Start に失敗しました");
      scheduleDmdataReconnect("socket-start-failed");
      return;
    }

    dmdataWs =
      new WebSocket(
        socketInfo.websocket.url,
        socketInfo.websocket.protocol
      );

    dmdataWs.on("open", () => {
      console.log("dmdata WebSocket 接続成功");
      dmdataReconnectAttempt = 0;
    });

    dmdataWs.on("message", handleDmdataMessage);

    dmdataWs.on("error", (error) => {
      console.log("dmdata WebSocket エラー:");
      console.log(error);
    });

    dmdataWs.on("close", () => {
      console.log("dmdata WebSocket 切断");
      dmdataWs = null;
      scheduleDmdataReconnect("websocket-close");
    });
  }
  catch (error) {
    console.log("dmdata WebSocket 起動失敗:");
    console.log(error);
    scheduleDmdataReconnect("startup-error");
  }
  finally {
    dmdataConnecting = false;
  }
}

function handleDmdataMessage(message) {
  let data;

  try {
    data =
      JSON.parse(message.toString());
  }
  catch (error) {
    console.log("dmdata JSON parse error:");
    console.log(error);
    return;
  }

  if (data.type === "start") {
    console.log("dmdata WebSocket 開始");
    return;
  }

  if (data.type === "ping") {
    console.log("ping受信:", data.pingId);

    if (dmdataWs?.readyState === WebSocket.OPEN) {
      dmdataWs.send(JSON.stringify({
        type: "pong",
        pingId: data.pingId
      }));
    }

    console.log("pong送信:", data.pingId);
    return;
  }

  if (data.type === "error") {
    console.log("dmdata エラー:");
    console.log(data);
    return;
  }

  if (SAVE_TELEGRAM_SAMPLE) {
    saveTelegramSample(data);
  }

  routeTelegram(data, io);
}

server.listen(PORT, () => {
  console.log(`サーバー起動 http://localhost:${PORT}`);
  console.log(`DMDATA_TEST_MODE=${DMDATA_TEST_MODE}`);
  console.log(`SAVE_TELEGRAM_SAMPLE=${SAVE_TELEGRAM_SAMPLE}`);

  startDmdataSocket();
  startKyoshinMonitor(io);
});
