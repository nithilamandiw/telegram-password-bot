# 🔐 Telegram Password Generator Bot

A simple and secure Telegram bot that generates strong, readable passwords instantly.

---

## 🚀 Features

- Generate 10 secure passwords at once
- Each password:
  - Includes uppercase, lowercase, numbers, and symbols
  - Excludes confusing characters (0, O, o, l, I)
  - Uses safe special characters only
- Passwords are sent in monospace format for easy copy
- Clean and minimal commands

---

## 🤖 Commands

- /start  
  Start the bot and view instructions

- /gen10  
  Generate 10 strong passwords (16 characters each)

- /gen12  
  Generate 10 strong passwords (12 characters each)

---

## 🔒 Password Rules

- Uppercase: A-Z (excluding O, I)
- Lowercase: a-z (excluding o, l)
- Numbers: 1-9 (excluding 0)
- Symbols: ! @ # $ % ^ & * _ - + = ? /

---

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   npm install

3. Create a .env file and add your bot token:
   BOT_TOKEN=your_telegram_bot_token

4. Run the bot:
   node src/bot.js

---

## 🌐 Deployment

You can deploy this bot on:
- VPS (recommended for 24/7)
- Docker
- Cloud platforms

---

## ⚠️ Security

- Do NOT share your .env file
- Keep your bot token private

---

## 🧑‍💻 Author

Nithila Mandiw

---
