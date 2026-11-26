# 🎂 Happy Birthday Trabanana

A single-page, self-contained neon "Future Birthday OS" celebration page.

## Features
- Boot-up landing screen ("INITIALIZE BIRTHDAY PROTOCOL")
- Neon cake with a flickering candle, rising balloons, twinkling stars, confetti
- A built-in **Happy Birthday** melody (Web Audio API — no audio file needed)
- Opt-in camera features, each clearly permissioned and visible on screen:
  - 📸 **Photo Booth** — snap a framed "HAPPY BIRTHDAY TRABANANA" photo (saved locally)
  - 🌬️ **Blow the Candle** — blow toward the camera to put out the flame
  - 🎥 **Video Message** — record a short clip (visible REC indicator, saved locally)

Clicking **INITIALIZE BIRTHDAY PROTOCOL** opens the Video Message recorder directly.

## Privacy
Camera/microphone access only starts after the visitor taps a button and grants
browser permission. Nothing is uploaded — photos and clips are created in the
browser and saved to the visitor's own device.

## Receiving the video messages (optional)
By default clips are **not** uploaded, so you can't receive them. To receive them,
open `script.js`, find `UPLOAD_CONFIG` near the top, set `"enabled": true`, and
fill in **one** provider. The visitor is told their clip is delivered to the host
when they press **Send**.

```js
const UPLOAD_CONFIG = {
    enabled: true,
    provider: 'cloudinary',                       // pick one
    cloudinary: { cloudName: '', uploadPreset: '' },
    telegram:   { botToken: '', chatId: '' },
    web3forms:  { accessKey: '' },
};
```

- **Cloudinary** (recommended): create a free account → note your *Cloud name* →
  Settings → Upload → add an **unsigned** upload preset → paste both values.
  Messages appear in your Media Library.
- **Telegram**: create a bot with @BotFather, get the token, and send your chat a
  message then read your `chat_id` from `https://api.telegram.org/bot<token>/getUpdates`.
  Videos arrive in your chat. (Note: the bot token is visible in the page source.)
- **Web3Forms**: get a free access key from web3forms.com. Clips are emailed to you
  (size limited — short messages only).
- **Telegram via proxy** (recommended for Telegram): deploy `worker/` as a Cloudflare
  Worker so the bot token stays secret, then set
  `provider: 'telegram-proxy'` and `proxy: { url: 'https://<your-worker>.workers.dev' }`.
  See `worker/README.md`. Clips arrive in your Telegram chat.


## Run locally
```bash
python3 -m http.server 8123
# open http://localhost:8123
```
Camera features require `https://` or `localhost`.

## Files
- `index.html`
- `style.css`
- `script.js`
