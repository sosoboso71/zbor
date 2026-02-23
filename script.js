  // -----------------------------
// CONFIG
// -----------------------------
const EFFECT = "bounce"; 
// alege: "bounce", "gravity", "chaos", "explosion"

// -----------------------------
// CANVAS SETUP
// -----------------------------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.onresize = resize;

// -----------------------------
// OBIECTE
// -----------------------------
let objects = [];
const MAX_OBJECTS = 200;

// -----------------------------
// DESENARE POZĂ ÎN CERC CU CONTUR + UMBRĂ
// -----------------------------
function drawCircleImage(ctx, img, x, y, size) {
    ctx.save();

    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.arc(x, y, size / 2 + 4, 0, Math.PI * 2);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);

    ctx.restore();
}

// -----------------------------
// SPAWN EMOJI (SEPARAT)
// -----------------------------
function spawnEmoji(emoji) {
    if (objects.length > MAX_OBJECTS) return;

    objects.push({
        type: "emoji",
        emoji: emoji,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() * 4 - 2),
        vy: (Math.random() * 4 - 2),
        size: 60,
        born: Date.now(),
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.1
    });
}

// -----------------------------
// SPAWN STICKER
// -----------------------------
function spawnSticker(url) {
    if (objects.length > MAX_OBJECTS) return;

    const img = new Image();
    img.src = url;

    objects.push({
        type: "sticker",
        img: img,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() * 4 - 2),
        vy: (Math.random() * 4 - 2),
        size: 80,
        born: Date.now(),
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.05
    });
}

// -----------------------------
// SPAWN PROFILE + EMOJI (SEPARATE)
// -----------------------------
function spawnProfileEmoji(emoji, profileUrl) {
    if (objects.length > MAX_OBJECTS) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = profileUrl;

    img.onload = () => {
        // POZA SEPARATĂ
        objects.push({
            type: "profile",
            img: img,
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() * 4 - 2),
            vy: (Math.random() * 4 - 2),
            size: 70,
            born: Date.now(),
            rot: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 0.05
        });

        // EMOJI SEPARAT
        objects.push({
            type: "emoji",
            emoji: emoji,
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() * 4 - 2),
            vy: (Math.random() * 4 - 2),
            size: 60,
            born: Date.now(),
            rot: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 0.1
        });
    };
}

// -----------------------------
// EFECTE
// -----------------------------
function applyEffect(o) {
    if (EFFECT === "bounce") {
        if (o.x < 0 || o.x > canvas.width) o.vx *= -1;
        if (o.y < 0 || o.y > canvas.height) o.vy *= -1;
    }

    if (EFFECT === "gravity") {
        o.vy += 0.15;
        if (o.y > canvas.height - 20) {
            o.y = canvas.height - 20;
            o.vy *= -0.7;
        }
    }

    if (EFFECT === "chaos") {
        o.vx += (Math.random() - 0.5) * 0.2;
        o.vy += (Math.random() - 0.5) * 0.2;
    }

    if (EFFECT === "explosion") {
        // viteza mare inițială, nimic special aici
    }
}

// -----------------------------
// LOOP (VERSIUNEA CORECTĂ — POZE ȘI EMOJI SEPARATE)
// -----------------------------
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();

    for (let i = objects.length - 1; i >= 0; i--) {
        const o = objects[i];

        o.x += o.vx;
        o.y += o.vy;
        o.rot += o.vr;

        applyEffect(o);

        // DESENARE POZA (cu translate)
        if (o.type === "profile" && o.img.complete) {
            ctx.save();
            ctx.translate(o.x, o.y);
            ctx.rotate(o.rot);
            drawCircleImage(ctx, o.img, 0, 0, o.size);
            ctx.restore();
        }

        // DESENARE STICKER (cu translate)
        if (o.type === "sticker" && o.img.complete) {
            ctx.save();
            ctx.translate(o.x, o.y);
            ctx.rotate(o.rot);
            ctx.drawImage(o.img, -o.size/2, -o.size/2, o.size, o.size);
            ctx.restore();
        }

        // DESENARE EMOJI (SEPARAT)
        if (o.type === "emoji") {
            ctx.save();
            ctx.translate(o.x, o.y);
            ctx.rotate(o.rot);
            ctx.font = o.size + "px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(o.emoji, 0, 0);
            ctx.restore();
        }

        if (now - o.born > 7000) {
            objects.splice(i, 1);
        }
    }

    requestAnimationFrame(loop);
}
loop();

// -----------------------------
// EXTRAGERE POZĂ PROFIL
// -----------------------------
function getProfileUrl(data) {
    if (data.profilePictureUrl) return data.profilePictureUrl;
    if (data.userDetails?.profilePictureUrls?.[0]) return data.userDetails.profilePictureUrls[0];
    return null;
}

// -----------------------------
// WEBSOCKET
// -----------------------------
const ws = new WebSocket("ws://localhost:62024");

// regex compatibil Live Studio
const emojiRegex = /([\u203C-\u3299]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDFFF])/g;

ws.onmessage = (event) => {
    const packet = JSON.parse(event.data);

    if (packet.event === "chat") {
        const data = packet.data;

        const msg = data.comment || "";
        const user = data.nickname || "";
        const profileUrl = getProfileUrl(data);

        let msgEmojis = msg.match(emojiRegex) || [];
        let nameEmojis = user.match(emojiRegex) || [];

        const allEmojis = [...msgEmojis, ...nameEmojis];

        if (allEmojis.length === 0) return;

        allEmojis.forEach(e => {
            if (profileUrl) spawnProfileEmoji(e, profileUrl);
            else spawnEmoji(e);
        });

        if (data.emotes) {
            data.emotes.forEach(e => {
                if (e.emoteImageUrl) spawnSticker(e.emoteImageUrl);
            });
        }
    }

    if (packet.event === "gift") {
        const g = packet.data;
        const profileUrl = getProfileUrl(g);

        let emo = "🎉";
        if (g.diamondCount > 1 && g.diamondCount <= 20) emo = "💥";
        else if (g.diamondCount > 20) emo = "🤯";

        if (profileUrl) spawnProfileEmoji(emo, profileUrl);
        else spawnEmoji(emo);
    }
};
