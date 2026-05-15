const {
  routeTelegram
} = require("./dmdataRouter");

require("dotenv").config();

const WebSocket = require("ws");

const API_KEY =
  process.env.DMDATA_API_KEY;

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
        "Authorization": `Basic ${basic}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        classifications: [
          "telegram.earthquake"
        ],
        test: "including",
        appName: "quake-app-test",
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
    const data =
      JSON.parse(message.toString());

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

    routeTelegram(data);
  });

  ws.on("error", (error) => {
    console.log("WebSocket エラー:");
    console.log(error);
  });

  ws.on("close", () => {
    console.log("WebSocket 切断");
  });
}

startDmdataSocket();