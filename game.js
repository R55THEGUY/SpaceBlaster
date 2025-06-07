const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const SPRITE = {
  player: { src: "assets/player.png", width: 24, height: 9, frames: 3 },
  enemy: { src: "assets/enemy.png", width: 42, height: 8, frames: 5 },
  explosion: { src: "assets/explosion.png", width: 23, height: 8, frames: 3 },
  bullet: { src: "assets/bullet.png", width: 4, height: 8 },
  bg: { src: "assets/bg.png" }
};

let images = {};
let keys = {};
let lastBulletTime = 0;
let bulletCooldown = 150; // Faster shooting
let bullets = [];
let enemies = [];
let explosions = [];
let score = 0;
let gameOver = false;

const player = {
  x: canvas.width / 2 - 24,
  y: canvas.height - 100,
  width: SPRITE.player.width * 2,
  height: SPRITE.player.height * 2,
  frameIndex: 1,
  speed: 4
};

function loadAssets(callback) {
  let loaded = 0;
  const total = Object.keys(SPRITE).length;
  for (let key in SPRITE) {
    let img = new Image();
    img.src = SPRITE[key].src;
    img.onload = () => {
      images[key] = img;
      if (++loaded === total) callback();
    };
  }
}

function shootBullet() {
  const now = Date.now();
  if (now - lastBulletTime > bulletCooldown) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: SPRITE.bullet.width,
      height: SPRITE.bullet.height
    });
    lastBulletTime = now;
  }
}

function createEnemy() {
  enemies.push({
    x: Math.random() * (canvas.width - SPRITE.enemy.width * 2),
    y: -60,
    width: SPRITE.enemy.width * 2,
    height: SPRITE.enemy.height * 2,
    frame: 0,
    frameTimer: 0,
    frameInterval: 10
  });
}

function update() {
  if (gameOver) return;

  if (keys["ArrowLeft"]) {
    player.x -= player.speed;
    player.frameIndex = 0;
  } else if (keys["ArrowRight"]) {
    player.x += player.speed;
    player.frameIndex = 2;
  } else {
    player.frameIndex = 1;
  }

  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  if (keys[" "]) shootBullet();

  bullets.forEach(b => b.y -= 7);
  bullets = bullets.filter(b => b.y > 0);

  enemies.forEach(e => {
    e.y += 2;
    e.frameTimer++;
    if (e.frameTimer >= e.frameInterval) {
      e.frame = (e.frame + 1) % SPRITE.enemy.frames;
      e.frameTimer = 0;
    }
  });

  enemies = enemies.filter(e => e.y < canvas.height);

  // Collision
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (b.x < e.x + e.width && b.x + b.width > e.x &&
          b.y < e.y + e.height && b.y + b.height > e.y) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        explosions.push({
          x: e.x,
          y: e.y,
          frame: 0,
          timer: 0,
          interval: 5
        });
        score += 100;
      }
    });
  });

  explosions.forEach(ex => {
    ex.timer++;
    if (ex.timer > ex.interval) {
      ex.frame++;
      ex.timer = 0;
    }
  });
  explosions = explosions.filter(ex => ex.frame < SPRITE.explosion.frames);

  enemies.forEach(e => {
    if (e.x < player.x + player.width && e.x + e.width > player.x &&
        e.y < player.y + player.height && e.y + e.height > player.y) {
      gameOver = true;
    }
  });

  if (Math.random() < 0.02) createEnemy();
}

function draw() {
  ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);

  // Player
  ctx.drawImage(
    images.player,
    player.frameIndex * SPRITE.player.width,
    0,
    SPRITE.player.width,
    SPRITE.player.height,
    player.x,
    player.y,
    player.width,
    player.height
  );

  bullets.forEach(b =>
    ctx.drawImage(images.bullet, b.x, b.y, b.width, b.height)
  );

  enemies.forEach(e =>
    ctx.drawImage(
      images.enemy,
      e.frame * SPRITE.enemy.width,
      0,
      SPRITE.enemy.width,
      SPRITE.enemy.height,
      e.x,
      e.y,
      e.width,
      e.height
    )
  );

  explosions.forEach(ex =>
    ctx.drawImage(
      images.explosion,
      ex.frame * SPRITE.explosion.width,
      0,
      SPRITE.explosion.width,
      SPRITE.explosion.height,
      ex.x,
      ex.y,
      SPRITE.explosion.width * 2,
      SPRITE.explosion.height * 2
    )
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px monospace";
  ctx.fillText("Score: " + score, 10, 30);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "30px monospace";
    ctx.fillText("GAME OVER", canvas.width / 2 - 90, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

loadAssets(loop);
