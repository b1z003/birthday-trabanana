// Cloudflare Worker: forwards birthday video messages to a Telegram bot.
//
// The bot token and chat id live in Worker SECRETS, never in the public page.
// Accepts a POST with multipart/form-data: field "clip" (video) + "name" (text).
//
// Required Worker variables (set as "Secret" vars):
//   TELEGRAM_BOT_TOKEN
//   TELEGRAM_CHAT_ID
//
// Optional: ALLOW_ORIGIN  (default "*"; set to your site for tighter CORS)

export default {
    async fetch(request, env) {
        const allow = env.ALLOW_ORIGIN || '*';
        const cors = {
            'Access-Control-Allow-Origin': allow,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
        if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, cors);

        const BOT = env.TELEGRAM_BOT_TOKEN;
        const CHAT = env.TELEGRAM_CHAT_ID;
        if (!BOT || !CHAT) return json({ ok: false, error: 'Server not configured' }, 500, cors);

        try {
            const form = await request.formData();
            const clip = form.get('clip');
            const name = form.get('name') || 'Trabanana';
            if (!clip) return json({ ok: false, error: 'No clip provided' }, 400, cors);

            const out = new FormData();
            out.append('chat_id', CHAT);
            out.append('caption', '\u{1F382} Birthday message for ' + name);
            out.append('video', clip, (clip && clip.name) || 'birthday-message.webm');

            const tg = await fetch('https://api.telegram.org/bot' + BOT + '/sendVideo', {
                method: 'POST',
                body: out,
            });
            const data = await tg.json().catch(() => ({}));
            if (!tg.ok || data.ok === false) {
                return json({ ok: false, error: data.description || 'Telegram send failed' }, 502, cors);
            }
            return json({ ok: true }, 200, cors);
        } catch (e) {
            return json({ ok: false, error: String(e) }, 500, cors);
        }
    },
};

function json(obj, status, cors) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json' },
    });
}
