import fs from "fs";
import { io } from "socket.io-client";

const raw =
  fs.readFileSync(
    "./sample-data/tsunami/tsunami-test.json",
    "utf-8"
  );

const telegram =
  JSON.parse(raw);

const socket =
  io("http://localhost:3000");

socket.on("connect", () => {
  console.log("接続成功");

  socket.emit(
    "replay-telegram",
    telegram
  );

  console.log(
    "津波テスト送信"
  );

  setTimeout(() => {
    socket.close();
  }, 1000);
});