require("dotenv").config();
const crypto = require("node:crypto");
const { Telegraf } = require("telegraf");

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error("Missing BOT_TOKEN in environment.");
  process.exit(1);
}

const bot = new Telegraf(token);

function pickRandomChar(charset) {
  return charset[crypto.randomInt(0, charset.length)];
}

function shuffle(chars) {
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars;
}

function generatePassword(length = 16) {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "123456789";
  const special = "!@#$%^&*_-+=?/";
  const all = uppercase + lowercase + numbers + special;

  const safeLength = Math.max(4, Number.isFinite(length) ? Math.floor(length) : 16);

  const chars = [
    pickRandomChar(uppercase),
    pickRandomChar(lowercase),
    pickRandomChar(numbers),
    pickRandomChar(special)
  ];

  while (chars.length < safeLength) {
    chars.push(pickRandomChar(all));
  }

  return shuffle(chars).join("");
}

bot.command("start", (ctx) => {
  ctx.reply("Welcome! Use /gen10 to generate 10 strong passwords.");
});

bot.command("gen10", async (ctx) => {
  for (let i = 1; i <= 10; i += 1) {
    const password = generatePassword(16);
    await ctx.reply("<code>" + password + "</code>", { parse_mode: "HTML" });
  }
});

bot.command("gen12", async (ctx) => {
  for (let i = 1; i <= 10; i += 1) {
    const password = generatePassword(12);
    await ctx.reply("<code>" + password + "</code>", { parse_mode: "HTML" });
  }
});

bot.launch();
console.log("Telegram password bot is running...");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
