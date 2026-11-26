'use strict';

/* =========================================================
   Future Birthday OS — celebration + camera features
   Camera features are opt-in only: the visitor taps a button,
   the browser asks permission, and the live feed + a visible
   "CAMERA ON" badge stay on screen. Nothing is uploaded.
   ========================================================= */

const startBtn    = document.getElementById('start-btn');
const landing     = document.getElementById('landing-page');
const celebration = document.getElementById('celebration-zone');

const balloonContainer = document.getElementById('balloon-container');
const starContainer    = document.getElementById('star-container');
const confettiCanvas   = document.getElementById('confetti');

const BALLOON_COLORS = ['#ff5fa2', '#34e6ff', '#b06bff', '#ffd45e', '#4fe3a0', '#ff8a5c'];
const NAME = 'TRABANANA';

/* =========================================================
   Message delivery (OPTIONAL)
   ---------------------------------------------------------
   By default NOTHING is uploaded — clips stay on the visitor's
   device. To receive video messages, set enabled:true and fill
   in ONE provider below. The visitor is always told that
   pressing "Send" delivers the clip to the birthday host.
   ========================================================= */
const UPLOAD_CONFIG = {
    enabled: true,
    provider: 'telegram-proxy',                   // 'cloudinary' | 'telegram' | 'telegram-proxy' | 'web3forms'
    cloudinary: { cloudName: 'wbtokvgb', uploadPreset: 'camlab' },
    telegram:   { botToken: '', chatId: '' },     // direct (token is exposed) — avoid in a public repo
    proxy:      { url: 'https://birthday-trabanana.bonhouychhy.workers.dev/api' }, // Cloudflare Worker (keeps bot token secret)
    web3forms:  { accessKey: '' },
};

function uploadConfigured() {
    if (!UPLOAD_CONFIG.enabled) return false;
    const p = UPLOAD_CONFIG.provider;
    if (p === 'cloudinary')     return !!(UPLOAD_CONFIG.cloudinary.cloudName && UPLOAD_CONFIG.cloudinary.uploadPreset);
    if (p === 'telegram')       return !!(UPLOAD_CONFIG.telegram.botToken && UPLOAD_CONFIG.telegram.chatId);
    if (p === 'telegram-proxy') return !!UPLOAD_CONFIG.proxy.url;
    if (p === 'web3forms')      return !!UPLOAD_CONFIG.web3forms.accessKey;
    return false;
}

async function uploadClip(blob) {
    const p = UPLOAD_CONFIG.provider;
    const filename = `birthday-message-${Date.now()}.webm`;

    if (p === 'cloudinary') {
        const { cloudName, uploadPreset } = UPLOAD_CONFIG.cloudinary;
        const fd = new FormData();
        fd.append('file', blob, filename);
        fd.append('upload_preset', uploadPreset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data.error && data.error.message) || 'Cloudinary upload failed');
        return data.secure_url || 'sent';
    }

    if (p === 'telegram-proxy') {
        const fd = new FormData();
        fd.append('clip', blob, filename);
        fd.append('name', NAME);
        const res = await fetch(UPLOAD_CONFIG.proxy.url, { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) throw new Error(data.error || data.description || 'Proxy send failed');
        return 'sent';
    }

    if (p === 'telegram') {
        const { botToken, chatId } = UPLOAD_CONFIG.telegram;
        const fd = new FormData();
        fd.append('chat_id', chatId);
        fd.append('caption', '🎂 Birthday message for ' + NAME);
        fd.append('video', blob, filename);
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) throw new Error(data.description || 'Telegram send failed');
        return 'sent';
    }

    if (p === 'web3forms') {
        const fd = new FormData();
        fd.append('access_key', UPLOAD_CONFIG.web3forms.accessKey);
        fd.append('subject', '🎂 Birthday message for ' + NAME);
        fd.append('from_name', 'Birthday Page');
        fd.append('attachment', blob, filename);
        const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.message || 'Web3Forms send failed');
        return 'sent';
    }

    throw new Error('No upload provider configured');
}

/* =========================================================
   Stars / Balloons / Confetti  (unchanged visual layer)
   ========================================================= */
function spawnStars() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 90; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        const size = Math.random() * 2.4 + 1;
        s.style.width = s.style.height = size + 'px';
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 100 + '%';
        s.style.animationDelay = (Math.random() * 3).toFixed(2) + 's';
        frag.appendChild(s);
    }
    starContainer.appendChild(frag);
}

function spawnBalloon() {
    const b = document.createElement('div');
    b.className = 'balloon';
    const color = BALLOON_COLORS[(Math.random() * BALLOON_COLORS.length) | 0];
    const dur = 7 + Math.random() * 6;
    b.style.left = (Math.random() * 92) + '%';
    b.style.background = `radial-gradient(circle at 35% 25%, rgba(255,255,255,.9), ${color} 55%)`;
    b.style.setProperty('--drift', (Math.random() * 120 - 60).toFixed(0) + 'px');
    b.style.animationDuration = dur + 's';
    b.style.scale = (0.7 + Math.random() * 0.8);
    balloonContainer.appendChild(b);
    setTimeout(() => b.remove(), dur * 1000 + 500);
}

function startBalloons() {
    for (let i = 0; i < 6; i++) setTimeout(spawnBalloon, i * 400);
    setInterval(spawnBalloon, 1100);
}

const ctx = confettiCanvas.getContext('2d');
let confetti = [];
let confettiRAF = null;

function sizeCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', sizeCanvas);
sizeCanvas();

function launchConfetti(count = 160) {
    for (let i = 0; i < count; i++) {
        confetti.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * -confettiCanvas.height,
            w: Math.random() * 8 + 4,
            h: Math.random() * 6 + 4,
            vy: Math.random() * 2.5 + 1.5,
            vx: Math.random() * 1.6 - 0.8,
            rot: Math.random() * Math.PI,
            vr: Math.random() * 0.14 - 0.07,
            color: BALLOON_COLORS[(Math.random() * BALLOON_COLORS.length) | 0],
        });
    }
    if (!confettiRAF) confettiLoop();
}

function confettiLoop() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    for (let i = confetti.length - 1; i >= 0; i--) {
        const p = confetti[i];
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.y * 0.01) * 0.6;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        if (p.y > confettiCanvas.height + 20) confetti.splice(i, 1);
    }
    confettiRAF = requestAnimationFrame(confettiLoop);
}

/* =========================================================
   Happy Birthday melody (Web Audio, no file needed)
   ========================================================= */
function playHappyBirthday() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ac = new AudioCtx();
    ac.resume && ac.resume();
    const freq = {
        'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25,
        'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99,
    };
    const melody = [
        ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
        ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
        ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
        ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2],
    ];
    const beat = 0.42;
    let t = ac.currentTime + 0.25;
    for (const [note, beats] of melody) {
        const dur = beats * beat;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq[note];
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);
        osc.connect(gain).connect(ac.destination);
        osc.start(t);
        osc.stop(t + dur);
        t += dur;
    }
}

/* =========================================================
   Camera features
   ========================================================= */
const panel      = document.getElementById('camera-panel');
const camVideo   = document.getElementById('cam-video');
const camCanvas  = document.getElementById('cam-canvas');
const camPhoto   = document.getElementById('cam-photo');
const camStatus  = document.getElementById('cam-status');
const camControls= document.getElementById('cam-controls');
const camHint    = document.getElementById('cam-hint');
const camClose   = document.getElementById('cam-close');
const recBadge   = document.getElementById('rec-badge');
const meterWrap  = document.getElementById('blow-meter-wrap');
const meterFill  = document.getElementById('blow-meter-fill');

let stream = null;
let camMode = null;
let blowRAF = null;
let prevFrame = null;
let recorder = null;
let recordChunks = [];
let flameOut = false;

function setStatus(text) {
    camStatus.textContent = text;
    camStatus.classList.toggle('hidden', !text);
}
function setControls(html) { camControls.innerHTML = html; }
function setHint(html) { camHint.innerHTML = html || ''; }

/* Request a camera (and optionally mic) stream. Reuses/upgrades as needed. */
async function getStream(withAudio) {
    if (stream && (!withAudio || stream.getAudioTracks().length)) return stream;
    if (stream) stream.getTracks().forEach(t => t.stop());
    const constraints = { video: { facingMode: 'user' }, audio: !!withAudio };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    camVideo.srcObject = stream;
    await camVideo.play().catch(() => {});
    return stream;
}

function stopStream() {
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    camVideo.srcObject = null;
}

/* Stop every camera-side timer/track and reset the panel. */
function teardownCamera() {
    if (blowRAF) { cancelAnimationFrame(blowRAF); blowRAF = null; }
    if (recorder && recorder.state !== 'inactive') { try { recorder.stop(); } catch (e) {} }
    recorder = null;
    prevFrame = null;
    stopStream();
    recBadge.classList.add('hidden');
    meterWrap.classList.add('hidden');
    camVideo.classList.remove('hidden');
    camPhoto.classList.add('hidden');
    camCanvas.classList.add('hidden');
    camControls.innerHTML = '';
    camHint.innerHTML = '';
    camMode = null;
}

function closePanel() {
    teardownCamera();
    panel.classList.add('hidden');
}

/* ---------- Mode: PHOTO BOOTH ---------- */
async function startPhotoMode() {
    setStatus('Allow camera access to take your birthday photo…');
    setControls(`<button id="snap-btn" disabled>📸 Take photo</button>`);
    setHint('Your photo is made in the browser and only saved to your device.');
    try {
        await getStream(false);
    } catch (e) {
        setStatus('Camera permission was blocked or no camera was found.');
        return;
    }
    setStatus('');
    const snap = document.getElementById('snap-btn');
    snap.disabled = false;
    snap.onclick = takePhoto;
}

function takePhoto() {
    const w = camVideo.videoWidth || 640;
    const h = camVideo.videoHeight || 480;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d');

    // mirror the frame to match the mirrored preview
    cx.save();
    cx.translate(w, 0);
    cx.scale(-1, 1);
    cx.drawImage(camVideo, 0, 0, w, h);
    cx.restore();

    // frame overlay
    const pad = Math.round(w * 0.035);
    cx.lineWidth = Math.round(w * 0.012);
    cx.strokeStyle = '#34e6ff';
    cx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

    const barH = Math.round(h * 0.18);
    const grad = cx.createLinearGradient(0, h - barH, 0, h);
    grad.addColorStop(0, 'rgba(5,6,15,0)');
    grad.addColorStop(1, 'rgba(5,6,15,0.9)');
    cx.fillStyle = grad;
    cx.fillRect(0, h - barH, w, barH);

    cx.textAlign = 'center';
    cx.fillStyle = '#ffffff';
    cx.font = `800 ${Math.round(w * 0.058)}px "Segoe UI", system-ui, sans-serif`;
    cx.shadowColor = '#34e6ff';
    cx.shadowBlur = Math.round(w * 0.02);
    cx.fillText('HAPPY BIRTHDAY ' + NAME, w / 2, h - barH * 0.42);
    cx.shadowBlur = 0;
    cx.fillStyle = '#7ff0ff';
    cx.font = `500 ${Math.round(w * 0.028)}px "Segoe UI", system-ui, sans-serif`;
    cx.fillText(new Date().toLocaleDateString(), w / 2, h - barH * 0.14);

    const dataURL = c.toDataURL('image/png');

    camVideo.classList.add('hidden');
    camPhoto.src = dataURL;
    camPhoto.classList.remove('hidden');
    setStatus('');
    setControls(
        `<a class="dl" href="${dataURL}" download="happy-birthday-${NAME.toLowerCase()}.png">⬇️ Download photo</a>
         <button class="secondary" id="retake-btn">🔄 Retake</button>`
    );
    setHint('Saved locally — this photo is never uploaded anywhere.');
    document.getElementById('retake-btn').onclick = () => {
        camPhoto.classList.add('hidden');
        camVideo.classList.remove('hidden');
        setControls(`<button id="snap-btn">📸 Take photo</button>`);
        setHint('Your photo is made in the browser and only saved to your device.');
        document.getElementById('snap-btn').onclick = takePhoto;
    };
}

/* ---------- Mode: BLOW THE CANDLE ---------- */
async function startBlowMode() {
    setStatus('Allow camera access — then blow toward the camera to put out the candle.');
    meterWrap.classList.remove('hidden');
    setControls(`<button class="secondary" id="relight-btn">🕯️ Relight (test)</button>`);
    setHint('Tip: blow steadily toward your camera. Not working? <a href="#" id="manual-blow">Tap here to blow it out</a>.');
    try {
        await getStream(false);
    } catch (e) {
        setStatus('Camera permission was blocked or no camera was found.');
        return;
    }
    setStatus('');
    document.getElementById('relight-btn').onclick = relightCandle;
    document.getElementById('manual-blow').onclick = (ev) => { ev.preventDefault(); blowOutCandle(); };
    runBlowDetection();
}

function runBlowDetection() {
    const W = 64, H = 48;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const cx = c.getContext('2d', { willReadFrequently: true });

    function loop() {
        if (camMode !== 'blow') return;
        cx.drawImage(camVideo, 0, 0, W, H);
        const data = cx.getImageData(0, 0, W, H).data;

        let diff = 0;
        if (prevFrame) {
            for (let i = 0; i < data.length; i += 4) {
                diff += Math.abs(data[i] - prevFrame[i]) +
                        Math.abs(data[i + 1] - prevFrame[i + 1]) +
                        Math.abs(data[i + 2] - prevFrame[i + 2]);
            }
            diff /= (data.length / 4) * 3;
        }
        prevFrame = data.slice(0);

        const pct = Math.min(100, (diff / 26) * 100);
        meterFill.style.width = pct + '%';

        if (!flameOut && diff > 22) blowOutCandle();
        blowRAF = requestAnimationFrame(loop);
    }
    loop();
}

function blowOutCandle() {
    if (flameOut) return;
    flameOut = true;
    document.getElementById('flame').classList.add('out');
    const smoke = document.getElementById('smoke');
    smoke.classList.add('on');
    document.getElementById('wish').textContent = '🎉 Wish granted! Happy Birthday, ' + NAME + '!';
    launchConfetti(200);
    setStatus('');
    setControls(`<button class="secondary" id="relight-btn">🕯️ Relight</button>`);
    setHint('Nicely done — the candle is out.');
    document.getElementById('relight-btn').onclick = relightCandle;
}

function relightCandle() {
    flameOut = false;
    document.getElementById('flame').classList.remove('out');
    document.getElementById('smoke').classList.remove('on');
    document.getElementById('wish').textContent = 'Make a wish and blow out the candle ✨';
    setControls(`<button class="secondary" id="relight-btn">🕯️ Relight (test)</button>`);
    setHint('Tip: blow steadily toward your camera. Not working? <a href="#" id="manual-blow">Tap here to blow it out</a>.');
    document.getElementById('relight-btn').onclick = relightCandle;
    document.getElementById('manual-blow').onclick = (ev) => { ev.preventDefault(); blowOutCandle(); };
}

/* ---------- Mode: VIDEO MESSAGE ---------- */
async function startRecordMode(opts = {}) {
    setStatus('Allow camera + microphone access to record your message…');
    setControls(`<button class="rec" id="rec-btn" disabled>● Start recording</button>`);
    setHint(uploadConfigured()
        ? 'Press ● Start, record your message, then Stop — it is sent to the birthday host automatically. The clip stays otherwise.'
        : 'A red REC indicator shows while recording. The clip stays on your device.');
    try {
        await getStream(true);
    } catch (e) {
        setStatus('Camera/microphone permission was blocked or unavailable.');
        return;
    }
    setStatus('');
    const recBtn = document.getElementById('rec-btn');
    recBtn.disabled = false;
    recBtn.onclick = toggleRecording;
    if (opts.autoRecord) toggleRecording(); // start recording as soon as access is granted
}

function pickMime() {
    const options = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    for (const m of options) {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
    }
    return '';
}

function toggleRecording() {
    const recBtn = document.getElementById('rec-btn');
    if (recorder && recorder.state === 'recording') {
        recorder.stop();
        return;
    }
    if (!window.MediaRecorder) {
        setHint('Your browser does not support in-browser recording.');
        return;
    }
    const mime = pickMime();
    recordChunks = [];
    try {
        recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch (e) {
        setHint('Recording could not start in this browser.');
        return;
    }
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) recordChunks.push(e.data); };
    recorder.onstop = () => {
        recBadge.classList.add('hidden');
        const blob = new Blob(recordChunks, { type: recorder.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        camVideo.classList.add('hidden');
        camPhoto.classList.add('hidden');
        camCanvas.classList.add('hidden');

        const preview = document.createElement('video');
        preview.id = 'rec-preview';
        preview.src = url;
        preview.controls = true;
        preview.playsInline = true;
        preview.style.width = '100%';
        preview.style.height = '100%';
        preview.style.objectFit = 'cover';
        preview.style.transform = 'none';
        camVideo.parentElement.appendChild(preview);
        window._recPreview = preview;

        document.getElementById('rec-badge').classList.add('hidden');
        const canSend = uploadConfigured();
        window._lastClip = blob;
        window._lastClipURL = url;
        if (canSend) {
            setControls(
                `<a class="dl secondary" href="${url}" download="birthday-message-${NAME.toLowerCase()}.webm">⬇️ Download clip</a>
                 <button class="secondary" id="rerec-btn">🔄 Record again</button>`
            );
            setHint('');
            document.getElementById('rerec-btn').onclick = resetRecording;
            autoSendClip();
        } else {
            setControls(
                `<a class="dl" href="${url}" download="birthday-message-${NAME.toLowerCase()}.webm">⬇️ Download clip</a>
                 <button class="secondary" id="rerec-btn">🔄 Record again</button>`
            );
            setHint('Recorded locally — nothing is uploaded. Download it to share.');
            document.getElementById('rerec-btn').onclick = resetRecording;
        }
    };

    recorder.start();
    recBadge.classList.remove('hidden');
    recBtn.textContent = '■ Stop recording';
    recBtn.classList.add('rec');
    setStatus('');
    setHint('Recording… tap stop when you are done.');
}

function resetRecording() {
    const preview = window._recPreview || document.getElementById('rec-preview');
    if (preview) preview.remove();
    window._recPreview = null;
    camVideo.classList.remove('hidden');
    setControls(`<button class="rec" id="rec-btn">● Start recording</button>`);
    document.getElementById('rec-btn').onclick = toggleRecording;
    setHint(uploadConfigured()
        ? 'Press ● Start, record your message, then Stop — it is sent to the birthday host automatically. The clip stays otherwise.'
        : 'A red REC indicator shows while recording. The clip stays on your device.');
}

async function autoSendClip() {
    try {
        await uploadClip(window._lastClip);
        // silent success — the clip is delivered to the host automatically
    } catch (e) {
        const url = window._lastClipURL || '#';
        setControls(
            `<span class="sent-fail">⚠️ Could not send — tap Retry</span>` +
            `<button id="send-btn">🔁 Retry send</button>` +
            `<a class="dl secondary" href="${url}" download="birthday-message-${NAME.toLowerCase()}.webm">⬇️ Download clip</a>
             <button class="secondary" id="rerec-btn">🔄 Record again</button>`
        );
        setHint('');
        document.getElementById('rerec-btn').onclick = resetRecording;
        document.getElementById('send-btn').onclick = retrySend;
    }
}

async function retrySend() {
    const btn = document.getElementById('send-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    try {
        await uploadClip(window._lastClip);
        setControls(
            `<a class="dl secondary" href="${window._lastClipURL || '#'}" download="birthday-message-${NAME.toLowerCase()}.webm">⬇️ Download clip</a>
             <button class="secondary" id="rerec-btn">🔄 Record again</button>`
        );
        setHint('');
        document.getElementById('rerec-btn').onclick = resetRecording;
    } catch (e) {
        if (btn) { btn.disabled = false; btn.textContent = '🔁 Retry send'; }
    }
}

/* ---------- Dispatcher ---------- */
async function openCamera(mode, opts = {}) {
    camMode = mode;
    panel.classList.remove('hidden');
    camVideo.classList.remove('hidden');
    camPhoto.classList.add('hidden');
    meterWrap.classList.add('hidden');
    recBadge.classList.add('hidden');

    if (mode === 'photo')  await startPhotoMode();
    if (mode === 'blow')   await startBlowMode();
    if (mode === 'record') await startRecordMode(opts);
}

/* =========================================================
   Wire up
   ========================================================= */
function start() {
    landing.classList.add('fade-out');
    setTimeout(() => landing.classList.add('hidden'), 800);

    celebration.classList.remove('hidden');
    spawnStars();
    startBalloons();
    launchConfetti(220);
    setTimeout(() => launchConfetti(120), 1600);
    try { playHappyBirthday(); } catch (e) { /* bonus only */ }

    // Straight into the Video Message recorder.
    openCamera('record', { autoRecord: true });
}

startBtn.addEventListener('click', start);

document.querySelectorAll('.cam-launch').forEach(btn => {
    btn.addEventListener('click', () => openCamera(btn.dataset.mode));
});

camClose.addEventListener('click', closePanel);
panel.addEventListener('click', (e) => { if (e.target === panel) closePanel(); });
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.classList.contains('hidden')) closePanel();
});
window.addEventListener('pagehide', () => { try { teardownCamera(); } catch (e) {} });
