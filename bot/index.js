require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { clearDir, sleepf } = require("./utils");
const { extractMegaFolder, downloadMegaFile } = require("./mega");
const bot = require("./tg");
const megaC = require("mega-link-checker");
const OWNER = process.env.OWNER;
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const DOWNLOAD_DIR = path.join(__dirname, "../downloads");
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

let run = 0;
let stopn = 0;
let queue = [];

app.get("/", (_, res) => res.send("MegaTG Bot running ✅"));

bot.on("text", async (ctx) => {
  const text = ctx.message.text.trim();

  if (text === "/stop") {
    stopn = 1;
    ctx.reply("🛑 Process stopped by user.");
    return;
  }

  const check = await megaC(text);
  if (check) {
    if (run === 0) {
      run = 1;
      ctx.reply("🔍 Valid Mega link detected! Starting process...");
      queue = await extractMegaFolder(text, bot);
      processQueue();
    } else {
      ctx.reply("⚙️ A process is already running. Please wait!");
    }
  } else {
    ctx.reply("❌ Invalid Mega link! Please send a valid one.");
  }
});

async function processQueue() {
  if (stopn) {
    stopn = 0;
    run = 0;
    clearDir(DOWNLOAD_DIR);
    await bot.telegram.sendMessage(OWNER, "🛑 Process stopped and cleaned.");
    return;
  }

  if (queue.length === 0) {
    await bot.telegram.sendMessage(OWNER, "✅ All files uploaded!");
    run = 0;
    return;
  }

  const file = queue.shift();
  const megaFile = require("megajs").File.fromURL(`${file.downloadId}`);
  await megaFile.loadAttributes();
  megaFile.type = file.type;
  await downloadMegaFile(megaFile, bot);
  await sleepf(Number(process.env.ts) || 1500);
  processQueue();
}

app.listen(8000, async () => {
  console.log("🌐 Server started on port 8000");
  const msg = await bot.telegram.sendMessage(OWNER, "🚀 MegaTG Bot started!");
  await sleepf(3000);
  //try { await bot.telegram.deleteMessage(OWNER, msg.message_id); } catch (_) {}
});

bot.launch();
