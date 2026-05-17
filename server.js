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

const API_KEY =
  process.env.DMDATA_API_KEY;

const app =
  express();

const server =
  http.createServer(app);

const io =
  new Server(server);

app.use(
  express.static(__dirname)
);

io.on("connection", (socket) => {
  console.log("ブラウザ接続");
});

async function startDmdataSocket() {
  if (!API_KEY) {
    console.log("DMDATA_API_KEY が設定されていません");
    return;
  }

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
        test: "including",
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
    return;
  }

  const ws =
    new WebSocket(
      socketInfo.websocket.url,
      socketInfo.websocket.protocol
    );

  ws.on("open", () => {
    console.log("dmdata WebSocket 接続成功");
  });

  ws.on("message", (message) => {
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

      ws.send(JSON.stringify({
        type: "pong",
        pingId: data.pingId
      }));

      console.log("pong送信:", data.pingId);
      return;
    }

    if (data.type === "error") {
      console.log("dmdata エラー:");
      console.log(data);
      return;
    }

    saveTelegramSample(data);

    routeTelegram(data, io);
  });

  ws.on("error", (error) => {
    console.log("dmdata WebSocket エラー:");
    console.log(error);
  });

  ws.on("close", () => {
    console.log("dmdata WebSocket 切断");
  });
}

server.listen(3000, () => {
  console.log("サーバー起動 http://localhost:3000");

  startDmdataSocket();
});