const fs = require('fs');
const path = require('path');

function SizeF(a, b = 2) {
  if (!+a) return "0 Bytes";
  const c = b < 0 ? 0 : b;
  const d = Math.floor(Math.log(a) / Math.log(1024));
  return `${parseFloat((a / Math.pow(1024, d)).toFixed(c))} ${["Bytes","KiB","MiB","GiB","TiB"][d]}`;
}

function pres(per, tot) {
  const p = Number(per);
  const t = Number(tot);
  return ((p / t) * 100).toFixed(2);
}

const sleepf = (ms) => new Promise(res => setTimeout(res, ms));

function clearDir(directory) {
  if (!fs.existsSync(directory)) return;
  fs.readdirSync(directory).forEach(file => {
    fs.unlinkSync(path.join(directory, file));
  });
}

module.exports = { SizeF, pres, sleepf, clearDir };
