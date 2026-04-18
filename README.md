# Telegram Password Generator Bot

A simple Telegram bot that generates strong passwords.

## Features

- `/start` greeting message
- `/help` command usage
- `/ping` health check
- `/password [length] [symbols]` password generation
- `/password10` generate 10 strong passwords (16 chars each)

## Prerequisites

- Node.js 18+ (or newer)
- A Telegram bot token from BotFather

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment file:
   ```bash
   cp .env.example .env
   ```
3. Set your bot token in `.env`:
   ```env
   BOT_TOKEN=your-real-token
   ```

## Run

```bash
npm start
```

For development with file watching:

```bash
npm run dev
```

For debug mode:

```bash
npm run debug
```

## Command Examples

- `/password`
- `/password 24`
- `/password 20 symbols`
- `/password10`

## Notes

- Password length is clamped between 8 and 64.
- By default, passwords include uppercase, lowercase, and digits.
- Add `symbols` to include special characters.
- `/password10` always returns 10 passwords, each 16 characters, each containing uppercase, lowercase, numbers, and symbols.
