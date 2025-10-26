const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.Token);

bot.start((ctx) => ctx.reply('👋 Welcome! I am your personal Mega downloader bot.'));
bot.help((ctx) => ctx.reply('Send me a Mega link or use /stop to stop the process.'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
