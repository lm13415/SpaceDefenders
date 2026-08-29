const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

// ---------------------------
// IMAGE LOADING
// ---------------------------
const playerImg = new Image();
playerImg.src = "https://i.imgur.com/XSelOSe.png";

const alienImg = new Image();
alienImg.src = "https://i.imgur.com/KDWMeyk.png";

const bossImg = new Image();
bossImg.src = "https://i.imgur.com/T6Pxxpt.png";

const explosionImg = new Image();
explosionImg.src = "https://i.imgur.com/ALIfCXW.png";

const kamikazeImg = new Image();
kamikazeImg.src = "https://i.imgur.com/KVYPkMh.png";

// ---------------------------
// GAME STATE
// ---------------------------
let state = "title";
let keys = {};
let player;
let bullets = [];
let enemies = [];
let kamikazes = [];
let enemyBullets = [];
let explosions = [];
let level = 1;
let score = 0;
let playerHP = 100;
let playerMaxHP = 100;
let boss = null;
let bossHP = 0;
let bossMaxHP = 0;
let fireCooldown = 0;
let bossHitCount = 0;
let drones = [];
let lasers = [];
let time = 0;

// title animation
let titleSpaceY = -100;
let titleDefY = H + 100;

// starfield
let stars = [];

// wave banner
let banner = null;

// ---------------------------
// INIT STARS
// ---------------------------
function initStars() {
  stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 0.3 + Math.random() * 0.7,
      size: 1 + Math.random() * 2
    });
  }
}
initStars();

// ---------------------------
// INPUT
// ---------------------------
document.addEventListener("keydown", e => {
  keys[e.code] = true;
  if (state === "title" && e.code === "Space") startGame();
  if (state === "gameover" && e.code === "Space") startGame();
});
document.addEventListener("keyup", e => keys[e.code] = false);

// ---------------------------
// START GAME
// ---------------------------
function startGame() {
  state = "playing";
  player = { x: W / 2, y: H - 80, speed: 4 };
  bullets = [];
  enemies = [];
  kamikazes = [];
  enemyBullets = [];
  explosions = [];
  drones = [];
  lasers = [];
  level = 1;
  score = 0;
  playerHP = playerMaxHP;
  boss = null;
  bossHP = 0;
  bossMaxHP = 0;
  bossHitCount = 0;
  fireCooldown = 0;
  banner = { text: "WAVE 1", y: -60, active: true };
  spawnWave();
}

// ---------------------------
// WAVES
// ---------------------------
function spawnWave() {
  enemies = [];
  enemyBullets = [];
  drones = [];
  lasers = [];
  boss = null;

  let rows = Math.min(2 + level, 5);
  let cols = 8;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({
        baseX: 40 + c * 50,
        baseY: 60 + r * 40,
        x: 40 + c * 50,
        y: 60 + r * 40,
        img: alienImg,
        offset: Math.random() * Math.PI * 2,
        ampX: 10 + Math.random() * 20,
        ampY: 5 + Math.random() * 15
      });
    }
  }

  // initial kamikazes for this wave
  let baseCount = level === 1 ? 0 : level === 2 ? 3 : 6;
  for (let i = 0; i < baseCount; i++) {
    kamikazes.push({
      x: 40 + Math.random() * (W - 80),
      y: -40 - Math.random() * 200,
      vy: 2 + Math.random() * 1.5,
      img: kamikazeImg,
      active: true
    });
  }

  banner = { text: "WAVE " + level, y: -60, active: true };
}

// ---------------------------
// BOSS
// ---------------------------
function spawnBoss() {
  boss = {
    x: W / 2,
    y: 120,
    vx: (Math.random() * 2 - 1) * 2,
    vy: (Math.random() * 2 - 1) * 1.5
  };
  bossMaxHP = 50 + level * 10;
  bossHP = bossMaxHP;
  bossHitCount = 0;
  enemyBullets = [];
  drones = [];
  lasers = [];
  banner = { text: "BOSS WAVE", y: -60, active: true };
}

// ---------------------------
// SHOOT
// ---------------------------
function shoot() {
  bullets.push({ x: player.x, y: player.y - 20, vy: -7 });
}

// ---------------------------
// LASER DRONES
// ---------------------------
function triggerLaserPattern() {
  drones = [];
  lasers = [];
  let cols = 8;
  for (let i = 0; i < cols; i++) {
    drones.push({
      x: 40 + i * 50,
      y: 60,
      blinkCount: 0,
      blinkTimer: 25,
      visible: false,
      willFire: true,
      fired: false,
      colorPhase: 0
    });
  }
  const safeIndex = Math.floor(Math.random() * drones.length);
  drones[safeIndex].willFire = false;
}

// ---------------------------
// UPDATE
// ---------------------------
function update() {
  if (state !== "playing" && state !== "title") return;

  time += 0.016;

  // starfield
  stars.forEach(s => {
    s.y += s.speed;
    if (s.y > H) {
      s.y = -5;
      s.x = Math.random() * W;
    }
  });

  // title animation
  if (state === "title") {
    titleSpaceY += 2;
    titleDefY -= 2;
    if (titleSpaceY > H / 2 - 60) titleSpaceY = H / 2 - 60;
    if (titleDefY < H / 2 + 20) titleDefY = H / 2 + 20;
    return;
  }

  // banner animation
  if (banner && banner.active) {
    banner.y += 3;
    if (banner.y > 80) banner.active = false;
  }

  // Player movement
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;
  player.x = Math.max(20, Math.min(W - 20, player.x));

  // Shooting
  if (fireCooldown > 0) fireCooldown--;
  if (keys["Space"] && fireCooldown <= 0) {
    shoot();
    fireCooldown = 25;
  }

  // Bullets
  bullets.forEach(b => b.y += b.vy);
  bullets = bullets.filter(b => b.y > -10);

  // Regular enemies movement (slower drift, game over at bottom)
  enemies.forEach(e => {
    const t = time + e.offset;
    e.x = e.baseX + Math.sin(t * 2) * e.ampX;
    e.y = e.baseY + Math.sin(t * 1.5) * e.ampY;

    e.baseY += 0.08; // slower downward

    if (Math.random() < 0.01) {
      enemyBullets.push({ x: e.x, y: e.y + 10, vy: 3 });
    }

    if (e.y > H - 40) {
      state = "gameover";
    }
  });

  enemies = enemies.filter(e => e.y < H + 60);

  // Kamikaze aliens (keep spawning randomly based on level)
  kamikazes.forEach(k => {
    k.y += k.vy;
    if (k.y > H + 40 || k.y > player.y + 200) k.active = false;
  });
  kamikazes = kamikazes.filter(k => k.active);

  // random extra kamikazes
  const spawnChance = 0.0008 * level;
  if (Math.random() < spawnChance && state === "playing") {
    kamikazes.push({
      x: 40 + Math.random() * (W - 80),
      y: -40,
      vy: 2 + Math.random() * 1.5,
      img: kamikazeImg,
      active: true
    });
  }

  // Boss movement
  if (boss) {
    boss.x += boss.vx;
    boss.y += boss.vy;

    if (boss.x < 40 || boss.x > W - 40) boss.vx *= -1;
    if (boss.y < 60 || boss.y > H / 2) boss.vy *= -1;

    if (Math.random() < 0.02) {
      enemyBullets.push({ x: boss.x, y: boss.y + 20, vy: 4 });
    }
  }

  // Enemy bullets
  enemyBullets.forEach(b => b.y += b.vy);
  enemyBullets = enemyBullets.filter(b => b.y < H + 20);

  // Explosions
  explosions.forEach(ex => ex.scale += 0.15);
  explosions = explosions.filter(ex => ex.scale < ex.maxScale);

  // Bullet collisions
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (Math.abs(b.x - e.x) < 20 && Math.abs(b.y - e.y) < 20) {
        explosions.push({ x: e.x, y: e.y, scale: 0.2, maxScale: 1.2 });
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score += 10;
      }
    });

    kamikazes.forEach((k, ki) => {
      if (Math.abs(b.x - k.x) < 20 && Math.abs(b.y - k.y) < 20) {
        explosions.push({ x: k.x, y: k.y, scale: 0.2, maxScale: 1.2 });
        kamikazes.splice(ki, 1);
        bullets.splice(bi, 1);
        score += 15;
      }
    });

    if (boss && Math.abs(b.x - boss.x) < 40 && Math.abs(b.y - boss.y) < 25) {
      explosions.push({ x: boss.x, y: boss.y, scale: 0.2, maxScale: 1.4 });
      bossHP--;
      bossHitCount++;
      bullets.splice(bi, 1);

      if (bossHitCount % 7 === 0) {
        triggerLaserPattern();
      }

      if (bossHP <= 0) {
        boss = null;
        level++;
        spawnWave();
      }
    }
  });

  // Player hit by enemy bullets
  enemyBullets.forEach((b, bi) => {
    if (Math.abs(b.x - player.x) < 16 && Math.abs(b.y - player.y) < 16) {
      playerHP -= 10;
      explosions.push({ x: player.x, y: player.y, scale: 0.2, maxScale: 1.4 });
      enemyBullets.splice(bi, 1);
      if (playerHP <= 0) state = "gameover";
    }
  });

  // Player hit by kamikaze
  kamikazes.forEach((k, ki) => {
    if (Math.abs(k.x - player.x) < 20 && Math.abs(k.y - player.y) < 20) {
      playerHP -= 20;
      explosions.push({ x: player.x, y: player.y, scale: 0.2, maxScale: 1.4 });
      kamikazes.splice(ki, 1);
      if (playerHP <= 0) state = "gameover";
    }
  });

// Laser drones blinking & fading (more blinks before firing)
drones.forEach(d => {
  d.blinkTimer--;

  if (d.blinkTimer <= 0) {

    // slower blinking
    d.blinkTimer = 400;

    // toggle visibility
    d.visible = !d.visible;

    // color fade cycle
    d.colorPhase = (d.colorPhase + 1) % 4;

    // count blinks
    d.blinkCount++;

    // fire only after MANY blinks
    if (d.blinkCount >= 8 && !d.fired) {
      d.fired = true;

      if (d.willFire) {
        lasers.push({
          x: d.x,
          y: d.y,
          active: true,
          timer: 60
        });
      }
    }
  }
});

  // Lasers damage player
  lasers.forEach(l => {
    l.timer--;
    if (l.timer <= 0) l.active = false;
    if (l.active) {
      if (Math.abs(player.x - l.x) < 10 && player.y > l.y) {
        playerHP -= 25;
        explosions.push({ x: player.x, y: player.y, scale: 0.2, maxScale: 1.4 });
        l.active = false;
        if (playerHP <= 0) state = "gameover";
      }
    }
  });
  lasers = lasers.filter(l => l.active);

  // Level progression
  if (enemies.length === 0 && kamikazes.length === 0 && !boss && state === "playing") {
    level++;
    if (level % 4 === 0) spawnBoss();
    else spawnWave();
  }
}

// ---------------------------
// DRAW
// ---------------------------
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, W, H);

  // starfield
  stars.forEach(s => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });

  if (state === "title") {
    ctx.textAlign = "center";

    ctx.font = "48px monospace";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ff0";
    ctx.strokeText("SPACE", W / 2, titleSpaceY);
    ctx.fillStyle = "#f00";
    ctx.fillText("SPACE", W / 2, titleSpaceY);

    ctx.strokeText("DEFENDERS", W / 2, titleDefY);
    ctx.fillText("DEFENDERS", W / 2, titleDefY);

    const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * 3));
    ctx.globalAlpha = alpha;
    ctx.font = "20px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText("Press SPACE to start", W / 2, H / 2 + 80);
    ctx.globalAlpha = 1.0;
    return;
  }

  if (state === "gameover") {
    ctx.textAlign = "center";
    ctx.font = "48px monospace";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ff0";
    ctx.strokeText("GAME", W / 2, H / 2 - 40);
    ctx.fillStyle = "#f00";
    ctx.fillText("GAME", W / 2, H / 2 - 40);

    ctx.strokeText("OVER", W / 2, H / 2 + 20);
    ctx.fillText("OVER", W / 2, H / 2 + 20);

    const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * 3));
    ctx.globalAlpha = alpha;
    ctx.font = "20px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText("Press SPACE to restart", W / 2, H / 2 + 80);
    ctx.globalAlpha = 1.0;
    return;
  }

  // Player
  ctx.drawImage(playerImg, player.x - 20, player.y - 20, 40, 40);

  // Rocket bullets
  bullets.forEach(b => {
    ctx.fillStyle = "#fff";
    ctx.fillRect(b.x - 2, b.y - 10, 4, 12);

    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.moveTo(b.x, b.y - 14);
    ctx.lineTo(b.x - 3, b.y - 10);
    ctx.lineTo(b.x + 3, b.y - 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ff8800";
    ctx.fillRect(b.x - 4, b.y + 0, 2, 4);
    ctx.fillRect(b.x + 2, b.y + 0, 2, 4);
  });

  // Regular enemies
  enemies.forEach(e => {
    ctx.drawImage(e.img, e.x - 15, e.y - 15, 30, 30);
  });

  // Kamikaze aliens
  kamikazes.forEach(k => {
    ctx.drawImage(k.img, k.x - 18, k.y - 18, 36, 36);
  });

  // Enemy bullets
  ctx.fillStyle = "#ff4444";
  enemyBullets.forEach(b => ctx.fillRect(b.x - 2, b.y - 4, 4, 8));

  // Boss
  if (boss) {
    ctx.drawImage(bossImg, boss.x - 40, boss.y - 40, 80, 80);

    // Boss health bar in middle top
    ctx.fillStyle = "#333";
    ctx.fillRect(W / 2 - 100, 20, 200, 10);
    ctx.fillStyle = "#ff0000";
    const hpRatio = bossHP / bossMaxHP;
    ctx.fillRect(W / 2 - 100, 20, 200 * hpRatio, 10);
  }

  // Explosions
  explosions.forEach(ex => {
    const size = 48 * ex.scale;
    ctx.drawImage(explosionImg, ex.x - size / 2, ex.y - size / 2, size, size);
  });

  // Drones (fade red/blue, one stays blue)
  drones.forEach(d => {
    let color;
    if (!d.willFire) {
      color = "#00ffff"; // safe drone stays blue-ish
    } else {
      color = d.colorPhase === 0 ? "#00ffff" : "#ff0000";
    }
    if (d.visible) {
      ctx.fillStyle = color;
      ctx.fillRect(d.x - 10, d.y - 5, 20, 10);
    } else {
      ctx.fillStyle = "#003366";
      ctx.fillRect(d.x - 10, d.y - 5, 20, 10);
    }
  });

  // Lasers
  lasers.forEach(l => {
    if (l.active) {
      ctx.strokeStyle = "#ff00ff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x, H);
      ctx.stroke();
    }
  });

  // Player health bar (top left)
  ctx.fillStyle = "#333";
  ctx.fillRect(20, 20, 120, 10);
  ctx.fillStyle = "#00ff00";
  const hpRatio = playerHP / playerMaxHP;
  ctx.fillRect(20, 20, 120 * hpRatio, 10);

  // HUD (score, level)
  ctx.fillStyle = "#fff";
  ctx.font = "14px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 20, 40);
  ctx.fillText("Level: " + level, 20, 60);

  // Wave banner
  if (banner && banner.active) {
    ctx.textAlign = "center";
    ctx.font = "32px monospace";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ff0";
    ctx.strokeText(banner.text, W / 2, banner.y);
    ctx.fillStyle = "#f00";
    ctx.fillText(banner.text, W / 2, banner.y);
  }
}

// ---------------------------
// LOOP
// ---------------------------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
