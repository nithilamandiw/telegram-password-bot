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

function randomIntInclusive(min, max) {
  return crypto.randomInt(min, max + 1);
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function generatePin() {
  const digits = "0123456789";
  const length = randomIntInclusive(4, 6);
  let pin = "";

  for (let i = 0; i < length; i += 1) {
    pin += pickRandomChar(digits);
  }

  return pin;
}

function generateWifiPassword() {
  const length = randomIntInclusive(12, 16);
  return generatePassword(length);
}

function generateUsername() {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const all = lowercase + numbers;
  const adjectives = ["shadow", "silent", "rapid", "lucky", "crisp", "frost", "solar", "neon"];
  const nouns = ["ninja", "fox", "pixel", "falcon", "tiger", "pulse", "rider", "spark"];
  const patterns = [
    () => pickRandomChar(adjectives) + randomIntInclusive(1, 999),
    () => pickRandomChar(nouns) + randomIntInclusive(1, 999),
    () => {
      const joiner = crypto.randomInt(0, 2) === 0 ? "_" : "";
      return (
        pickRandomChar(adjectives) + joiner + pickRandomChar(nouns) + randomIntInclusive(1, 99)
      );
    }
  ];

  let username = patterns[crypto.randomInt(0, patterns.length)]().toLowerCase();
  username = username.replace(/[^a-z0-9_]/g, "");

  if (username.length > 12) {
    username = username.slice(0, 12);
  }

  while (username.length < 6) {
    username += pickRandomChar(all);
  }

  if (username.startsWith("_")) {
    username = "a" + username.slice(1);
  }

  if (username.endsWith("_")) {
    username = username.slice(0, -1) + pickRandomChar(lowercase);
  }

  return username;
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

bot.command("pin", (ctx) => {
  const pin = generatePin();
  ctx.reply("<code>" + escapeHtml(pin) + "</code>", { parse_mode: "HTML" });
});

bot.command("wifi", (ctx) => {
  const wifiPassword = generateWifiPassword();
  ctx.reply("<code>" + escapeHtml(wifiPassword) + "</code>", { parse_mode: "HTML" });
});

bot.command("username", (ctx) => {
  const username = generateUsername();
  ctx.reply("<code>" + escapeHtml(username) + "</code>", { parse_mode: "HTML" });
});

bot.launch();
console.log("Telegram password bot is running...");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
