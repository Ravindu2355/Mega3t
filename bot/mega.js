const { File } = require("megajs");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { SizeF, pres, sleepf } = require("./utils");

const BOT_TOKEN = process.env.BOT_TOKEN;
const channel = process.env.channel;
const owner = process.env.OWNER;

const filetypes = {
  jpg: "image", png: "image", gif: "image", jpeg: "image", svg: "image",
  bmp: "image", tiff: "image", ico: "image", webp: "image",
  mp4: "video", mkv: "video", webm: "video", mov: "video", mp3: "audio"
};
const sizelimits = { M20: 20971520, M50: 52428800 };

async function sendFileToTelegram(obj) {
  const formData = new FormData();
  formData.append("chat_id", channel);
  const fileStream = fs.createReadStream(path.resolve(obj.fp));
  let apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;

  if (obj.type === "video" && obj.size <= sizelimits.M50) {
    formData.append("video", fileStream);
    apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`;
  } else if (obj.type === "image") {
    formData.append("photo", fileStream);
    apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
  } else {
    formData.append("document", fileStream);
  }

  formData.append("caption", obj.name);

  try {
    const response = await axios.post(apiUrl, formData, {
      headers: formData.getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Telegram upload failed:", error.message);
    return null;
  }
}

async function downloadMegaFile(megaFile, bot) {
  return new Promise(async (resolve) => {
    const ffpp = path.join(__dirname, "../downloads", megaFile.name);
    const msg = await bot.telegram.sendMessage(owner, `📥 Downloading: ${megaFile.name}\n${SizeF(megaFile.size)}`);

    const stream = megaFile.download();
    let lastUpdate = 0;

    stream.on("progress", async (info) => {
      const percent = pres(info.bytesLoaded, info.bytesTotal);
      if (Date.now() - lastUpdate > 10000) { // every 10 seconds
        lastUpdate = Date.now();
        try {
          await bot.telegram.editMessageText(owner, msg.message_id, undefined, `📥 ${megaFile.name}\n${SizeF(info.bytesLoaded)} / ${SizeF(info.bytesTotal)} (${percent}%)`);
        } catch (_) {}
      }
    });

    stream.pipe(fs.createWriteStream(ffpp));

    stream.on("end", async () => {
      await bot.telegram.editMessageText(owner, msg.message_id, undefined, `✅ Downloaded!\nNow uploading...`);
      const sent = await sendFileToTelegram({ fp: ffpp, name: megaFile.name, size: megaFile.size, type: megaFile.type });
      fs.unlinkSync(ffpp);
      if (sent) await bot.telegram.deleteMessage(owner, msg.message_id);
      resolve(sent);
    });

    stream.on("error", (err) => {
      console.error("Download error:", err);
      resolve(null);
    });
  });
}

async function extractMegaFolder(url, bot) {
  const folder = File.fromURL(url);
  await folder.loadAttributes();

  const files = [];
  const allFiles = [];

  JSON.stringify(folder, (key, value) => {
    if (typeof value === "object" && value && value.constructor && value.constructor.name === "_File" && !value.directory) {
      const ext = path.extname(value.name).slice(1);
      const type = filetypes[ext] || "document";
      const obj = { name: value.name, size: value.size, downloadId: value.downloadId, key: value.key, type };
      allFiles.push(obj);
      if (value.size <= sizelimits.M50) files.push(obj);
    }
    return value;
  });

  fs.writeFileSync("files.json", JSON.stringify({ files }));
  fs.writeFileSync("Allfiles.json", JSON.stringify({ files: allFiles }));

  await bot.telegram.sendDocument(owner, { source: path.join(__dirname, "../Allfiles.json") });
  await bot.telegram.sendMessage(owner, `📁 Found ${allFiles.length} files.\n🟢 ${files.length} under 50 MB ready to upload.`);
  return files;
}

module.exports = { extractMegaFolder, downloadMegaFile };
