require("dotenv").config();
const crypto = require("node:crypto");
const { Telegraf, Markup } = require("telegraf");

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error("Missing BOT_TOKEN in environment.");
  process.exit(1);
}

const bot = new Telegraf(token);
const customSessions = new Map();
const START_MENU_TEXT = "👋 Welcome!\n\nChoose an option below:";
const START_MENU_BUTTONS = {
  generatePassword: "🔐 Generate Password",
  generatePin: "🔢 Generate PIN",
  wifiPassword: "📶 WiFi Password",
  username: "👤 Username"
};

const CHARSETS = {
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  lowercase: "abcdefghijkmnpqrstuvwxyz",
  numbers: "123456789",
  symbols: "!@#$%^&*_-+=?"
};

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
  const { uppercase, lowercase, numbers, symbols } = CHARSETS;
  const all = uppercase + lowercase + numbers + symbols;

  const safeLength = Math.max(4, Number.isFinite(length) ? Math.floor(length) : 16);

  const chars = [
    pickRandomChar(uppercase),
    pickRandomChar(lowercase),
    pickRandomChar(numbers),
    pickRandomChar(symbols)
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

function buildRegenReplyOptions(length) {
  return {
    reply_markup: {
      inline_keyboard: [[{ text: "🔄 Generate Again", callback_data: "regen_" + length }]]
    },
    parse_mode: "HTML"
  };
}

async function sendPasswordWithRegen(ctx, password, length) {
  await ctx.reply("<code>" + escapeHtml(password) + "</code>", buildRegenReplyOptions(length));
}

async function sendPasswordBatch(ctx, length, count = 5) {
  for (let i = 0; i < count; i += 1) {
    const password = generatePassword(length);
    await sendPasswordWithRegen(ctx, password, length);
  }
}

async function sendPinWithRegen(ctx, pin, length) {
  await ctx.reply("<code>" + pin + "</code>", {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "🔄 Generate Again", callback_data: "regen_pin_" + length }]]
    }
  });
}

function generatePin(length) {
  const digits = "0123456789";
  const safeLength = [4, 5, 6].includes(length) ? length : 4;
  let pin = "";

  for (let i = 0; i < safeLength; i += 1) {
    pin += pickRandomChar(digits);
  }

  return pin;
}

function getDefaultCustomState(length) {
  return {
    length,
    upper: true,
    lower: true,
    numbers: true,
    symbols: true
  };
}

function buildCustomOptionsKeyboard(state) {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Uppercase " + (state.upper ? "✅" : "❌"), "opt_upper")],
    [Markup.button.callback("Lowercase " + (state.lower ? "✅" : "❌"), "opt_lower")],
    [Markup.button.callback("Numbers " + (state.numbers ? "✅" : "❌"), "opt_numbers")],
    [Markup.button.callback("Symbols " + (state.symbols ? "✅" : "❌"), "opt_symbols")],
    [Markup.button.callback("Generate 🚀", "generate_custom")]
  ]);
}

function generateCustomPassword(length, state) {
  const { uppercase, lowercase, numbers, symbols } = CHARSETS;
  const selectedSets = [];

  if (state.upper) {
    selectedSets.push(uppercase);
  }
  if (state.lower) {
    selectedSets.push(lowercase);
  }
  if (state.numbers) {
    selectedSets.push(numbers);
  }
  if (state.symbols) {
    selectedSets.push(symbols);
  }

  if (selectedSets.length === 0) {
    return "";
  }

  const safeLength = Math.max(selectedSets.length, Number.isFinite(length) ? Math.floor(length) : 8);
  const all = selectedSets.join("");
  const chars = selectedSets.map((charset) => pickRandomChar(charset));

  while (chars.length < safeLength) {
    chars.push(pickRandomChar(all));
  }

  return shuffle(chars).join("");
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

function buildStartMenuKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [
          { text: START_MENU_BUTTONS.generatePassword },
          { text: START_MENU_BUTTONS.generatePin }
        ],
        [
          { text: START_MENU_BUTTONS.wifiPassword },
          { text: START_MENU_BUTTONS.username }
        ]
      ],
      resize_keyboard: true,
      input_field_placeholder: "Write a message..."
    }
  };
}

function buildGenLengthKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("8", "gen_8"),
      Markup.button.callback("12", "gen_12"),
      Markup.button.callback("16", "gen_16"),
      Markup.button.callback("20", "gen_20")
    ]
  ]);
}

function buildPinLengthKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("4 digits", "pin_4")],
    [Markup.button.callback("5 digits", "pin_5")],
    [Markup.button.callback("6 digits", "pin_6")]
  ]);
}

async function sendWifiPassword(ctx) {
  const length = randomIntInclusive(12, 16);
  const wifiPassword = generatePassword(length);
  await sendPasswordWithRegen(ctx, wifiPassword, length);
}

async function sendUsername(ctx) {
  const username = generateUsername();
  await ctx.reply("<code>" + escapeHtml(username) + "</code>", { parse_mode: "HTML" });
}

bot.start((ctx) => {
  ctx.reply(START_MENU_TEXT, buildStartMenuKeyboard());
});

bot.command("gen", (ctx) => {
  ctx.reply("🔢 Select password length:", buildGenLengthKeyboard());
});

bot.command("pin", (ctx) => {
  ctx.reply("Select PIN length:", buildPinLengthKeyboard());
});

bot.command("custom", (ctx) => {
  ctx.reply(
    "🔧 Customize your password:\n\nSelect password length:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("8", "len_8"),
        Markup.button.callback("12", "len_12"),
        Markup.button.callback("16", "len_16"),
        Markup.button.callback("20", "len_20")
      ]
    ])
  );
});

bot.command("wifi", async (ctx) => {
  await sendWifiPassword(ctx);
});

bot.command("username", async (ctx) => {
  await sendUsername(ctx);
});

bot.hears(START_MENU_BUTTONS.generatePassword, (ctx) => {
  ctx.reply("🔢 Select password length:", buildGenLengthKeyboard());
});

bot.hears(START_MENU_BUTTONS.generatePin, (ctx) => {
  ctx.reply("Select PIN length:", buildPinLengthKeyboard());
});

bot.hears(START_MENU_BUTTONS.wifiPassword, async (ctx) => {
  await sendWifiPassword(ctx);
});

bot.hears(START_MENU_BUTTONS.username, async (ctx) => {
  await sendUsername(ctx);
});

bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery?.data;
  const userId = ctx.from?.id;


  if (data === "menu_gen") {
    await ctx.answerCbQuery();
    await ctx.editMessageText("🔢 Select password length:", buildGenLengthKeyboard());
    return;
  }

  if (data === "menu_pin") {
    await ctx.answerCbQuery();
    await ctx.editMessageText("Select PIN length:", buildPinLengthKeyboard());
    return;
  }

  if (data === "menu_wifi") {
    await ctx.answerCbQuery();
    await sendWifiPassword(ctx);
    return;
  }

  if (data === "menu_username") {
    await ctx.answerCbQuery();
    await sendUsername(ctx);
    return;
  }


  if (typeof data === "string" && ["pin_4", "pin_5", "pin_6"].includes(data)) {
    const pinLengths = { pin_4: 4, pin_5: 5, pin_6: 6 };
    const selectedPinLength = pinLengths[data];
    const pin = generatePin(selectedPinLength);
    await ctx.answerCbQuery();
    await sendPinWithRegen(ctx, pin, selectedPinLength);

    try {
      await ctx.deleteMessage();
    } catch (_error) {
      // Ignore delete failures (e.g., old message or insufficient permissions).
    }

    return;
  }

  if (typeof data === "string" && data.startsWith("regen_pin_")) {
    const selectedLength = Number.parseInt(data.split("_")[2], 10);
    if (![4, 5, 6].includes(selectedLength)) {
      await ctx.answerCbQuery();
      return;
    }

    const pin = generatePin(selectedLength);
    await ctx.answerCbQuery();
    await ctx.editMessageText("<code>" + pin + "</code>", {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "🔄 Generate Again", callback_data: data }]]
      }
    });
    return;
  }

  if (typeof data === "string" && data.startsWith("gen_")) {
    const selectedLength = Number.parseInt(data.split("_")[1], 10);
    if (![8, 12, 16, 20].includes(selectedLength)) {
      await ctx.answerCbQuery();
      return;
    }

    await ctx.answerCbQuery();

    try {
      await ctx.deleteMessage();
    } catch (_error) {
    }

    await sendPasswordBatch(ctx, selectedLength, 5);

    return;
  }

  if (typeof data === "string" && data.startsWith("regen_")) {
    const selectedLength = Number.parseInt(data.split("_")[1], 10);
    if (!Number.isFinite(selectedLength) || selectedLength < 4 || selectedLength > 64) {
      await ctx.answerCbQuery();
      return;
    }

    const password = generatePassword(selectedLength);
    await ctx.answerCbQuery();
    await ctx.editMessageText("<code>" + escapeHtml(password) + "</code>", {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "🔄 Generate Again", callback_data: data }]]
      }
    });

    return;
  }

  if (typeof data === "string" && data.startsWith("len_")) {
    const selectedLength = Number.parseInt(data.split("_")[1], 10);
    if (![8, 12, 16, 20].includes(selectedLength) || !userId) {
      await ctx.answerCbQuery();
      return;
    }

    const state = getDefaultCustomState(selectedLength);
    customSessions.set(userId, state);
    await ctx.editMessageText("Select options:", buildCustomOptionsKeyboard(state));
    await ctx.answerCbQuery();
    return;
  }

  if (["opt_upper", "opt_lower", "opt_numbers", "opt_symbols"].includes(data)) {
    if (!userId || !customSessions.has(userId)) {
      await ctx.answerCbQuery("Use /custom first.");
      return;
    }

    const state = customSessions.get(userId);
    const keyMap = {
      opt_upper: "upper",
      opt_lower: "lower",
      opt_numbers: "numbers",
      opt_symbols: "symbols"
    };
    const key = keyMap[data];
    const nextValue = !state[key];
    const enabledCount =
      Number(state.upper) + Number(state.lower) + Number(state.numbers) + Number(state.symbols);

    if (!nextValue && enabledCount === 1) {
      await ctx.answerCbQuery("Select at least one option.");
      return;
    }

    state[key] = nextValue;
    customSessions.set(userId, state);
    await ctx.editMessageText("Select options:", buildCustomOptionsKeyboard(state));
    await ctx.answerCbQuery();
    return;
  }

  if (data === "generate_custom") {
    if (!userId || !customSessions.has(userId)) {
      await ctx.answerCbQuery("Use /custom first.");
      return;
    }

    const state = customSessions.get(userId);
    const password = generateCustomPassword(state.length, state);
    await ctx.answerCbQuery();
    await ctx.reply("<code>" + escapeHtml(password) + "</code>", {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "🔄 Generate Again", callback_data: "regen_custom" }]]
      }
    });
    return;
  }

  if (data === "regen_custom") {
    if (!userId || !customSessions.has(userId)) {
      await ctx.answerCbQuery("Use /custom first.");
      return;
    }

    const state = customSessions.get(userId);
    const password = generateCustomPassword(state.length, state);
    await ctx.answerCbQuery();
    await ctx.editMessageText("<code>" + escapeHtml(password) + "</code>", {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "🔄 Generate Again", callback_data: "regen_custom" }]]
      }
    });
    return;
  }

  await ctx.answerCbQuery();
});

bot.launch();
console.log("Telegram password bot is running...");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
