"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "settings.json");
const PORT = process.env.PORT || 3100;

const DEFAULT = {
  title: "三餐转盘",
  subtitle: "今天吃什么外卖？让转盘来决定",
  footer: "纯前端 · 选项保存在本地浏览器 · 数据不离开你的设备",
  labels: { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", supper: "夜宵" },
};

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    return null;
  }
}

function writeSettings(s) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(s, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.url === "/api/settings" && req.method === "GET") {
    const s = readSettings();
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(s || DEFAULT));
    return;
  }

  if (req.url === "/api/settings" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 10240) req.destroy();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const merged = {
          ...DEFAULT,
          ...data,
          labels: { ...DEFAULT.labels, ...((data && data.labels) || {}) },
        };
        writeSettings(merged);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "invalid json" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("not found");
});

server.listen(PORT, () => {
  console.log(`meal settings api listening on ${PORT}`);
});
