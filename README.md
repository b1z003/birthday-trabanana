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
