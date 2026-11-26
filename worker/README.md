# Telegram delivery proxy (Cloudflare Worker)

This worker accepts the recorded clip from the birthday page and forwards it to
your Telegram bot. The **bot token never appears in the public page** — it is
stored as a Worker secret.

## Deploy from the Cloudflare dashboard (no tools needed)

1. Go to **https://dash.cloudflare.com** → sign in (free account) → **Workers & Pages**.
2. **Create application** → **Create Worker** → give it a name, e.g. `birthday-relay` → **Deploy**.
3. Click **Edit code**, delete the sample, paste the contents of `worker/index.js`, then **Deploy**.
4. Open the Worker → **Settings** → **Variables and Secrets** → add:
   - `TELEGRAM_BOT_TOKEN` = your bot token → **Encrypt** (Secret)
   - `TELEGRAM_CHAT_ID`   = `1532895300` → **Encrypt** (Secret)
   - (optional) `ALLOW_ORIGIN` = `https://b1z003.github.io` for tighter CORS
5. Copy the Worker URL, e.g. `https://birthday-relay.<you>.workers.dev`.

## Wire it into the page

In `script.js`, set:

```js
provider: 'telegram-proxy',
proxy: { url: 'https://birthday-relay.<you>.workers.dev' },
```

Commit + push. Recorded messages now arrive in your Telegram chat.

## Test it

```bash
curl -X POST "https://birthday-relay.<you>.workers.dev" \
  -F "clip=@some-small-video.webm" -F "name=Trabanana"
```
Expect `{"ok":true}` and the video in your Telegram chat.
