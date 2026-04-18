require("dotenv").config();
const crypto = require("node:crypto");
const { Telegraf } = require("telegraf");

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error("Missing BOT_TOKEN in environment.");
  process.exit(1);
}

const bot = new Telegraf(token);

function parsePasswordArgs(text) {
  const parts = text.trim().split(/\s+/);
  const lengthArg = Number.parseInt(parts[1], 10);
  const wantsSymbols = (parts[2] || "").toLowerCase() === "symbols";

  const length = Number.isFinite(lengthArg) ? lengthArg : 16;
  return { length, wantsSymbols };
}

function generatePassword(length, includeSymbols) {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{};:,.?/";

  const minLength = 8;
  const maxLength = 64;
  const safeLength = Math.max(minLength, Math.min(maxLength, length));

  let charset = lowercase + uppercase + digits;
  if (includeSymbols) {
    charset += symbols;
  }

  let password = "";
  for (let i = 0; i < safeLength; i += 1) {
    const index = crypto.randomInt(0, charset.length);
    password += charset[index];
  }

  return { password, safeLength };
}

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

function generateStrongPassword16() {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{};:,.?/";
  const all = lowercase + uppercase + digits + symbols;

  const chars = [
    pickRandomChar(lowercase),
    pickRandomChar(uppercase),
    pickRandomChar(digits),
    pickRandomChar(symbols)
  ];

  while (chars.length < 16) {
    chars.push(pickRandomChar(all));
  }

  return shuffle(chars).join("");
}

bot.start((ctx) => {
  ctx.reply(
    "Welcome to Password Generator Bot.\n" +
      "Use /password to generate a secure password.\n" +
      "Example: /password 20 symbols\n" +
      "Use /password10 to generate 10 strong passwords."
  );
});

bot.help((ctx) => {
  ctx.reply(
    "Commands:\n" +
      "/password [length] [symbols] - Generate password (length 8-64).\n" +
      "/password10 - Generate 10 strong passwords (16 chars, upper/lower/number/symbol).\n" +
      "/ping - Check if bot is online."
  );
});

bot.command("ping", (ctx) => {
  ctx.reply("pong");
});

bot.command("password", (ctx) => {
  const { length, wantsSymbols } = parsePasswordArgs(ctx.message.text || "");
  const { password, safeLength } = generatePassword(length, wantsSymbols);

  const withSymbols = wantsSymbols ? "Yes" : "No";
  ctx.reply(
    "Generated password:\n" +
      `${password}\n\n` +
      `Length: ${safeLength}\n` +
      `Symbols: ${withSymbols}`
  );
});

bot.command("password10", (ctx) => {
  const passwords = Array.from({ length: 10 }, () => generateStrongPassword16());
  const lines = passwords.map((value, index) => `${index + 1}. ${value}`).join("\n");

  ctx.reply(
    "10 strong passwords (16 chars each):\n" +
      `${lines}\n\n` +
      "Each password includes uppercase, lowercase, numbers, and symbols."
  );
});

bot.launch();
console.log("Telegram password bot is running...");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
