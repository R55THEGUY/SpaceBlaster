const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const keys = {};
const assets = {};
let bullets = [], enemies = [], explosions = [];

let score = 0;
let gameOver = false;
let lastShot = 0;
const shootDelay = 250;

const player = {
  x: canvas.width / 2 - 24,
  y: canvas.height - 60,
  width: 24,
  height: 9,
  frame: 1,
  speed: 4
};

function loadAssets(callback) {
  const sources = {
    player: 'assets/player.png',
    enemy: 'assets/enemy.png',
    explosion: 'assets/explosion.png',
    bullet: 'assets/bullet.png',
    bg: 'assets/bg.png'
  };

  let loaded = 0, total = Object.keys(sources).length;
  for (let key in sources) {
    assets[key] = new Image();
    assets[key].src = sources[key];
    assets[key].onload = () => ++loaded === total && callback();
  }
}

function spawnEnemy() {
  enemies.push({
    x: Math.random() * (canvas.width - 42),
    y: -40,
    frame: 0,
    frameCount: 5,
    width: 42,
    height: 8,
    tick: 0
  });
}

function shootBullet() {
  const now = Date.now();
  if (now - lastShot > shootDelay) {
    bullets.push({ x: player.x + 10, y: player.y, width: 4, height: 10 });
    lastShot = now;
  }
}

function update() {
  if (gameOver) return;

  if (keys['ArrowLeft']) {
    player.x -= player.speed;
    player.frame = 0;
  } else if (keys['ArrowRight']) {
    player.x += player.speed;
    player.frame = 2;
  } else {
    player.frame = 1;
  }

  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  if (keys[' ']) shootBullet();

  bullets = bullets.filter(b => (b.y -= 6) > 0);

  enemies.forEach(e => {
    e.y += 2;
    e.tick++;
    if (e.tick % 10 === 0) e.frame = (e.frame + 1) % e.frameCount;
  });

  enemies = enemies.filter(e => e.y < canvas.height);

  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        explosions.push({ x: e.x, y: e.y, frame: 0, tick: 0 });
        score += 100;
      }
    });
  });

  explosions.forEach(ex => {
    ex.tick++;
    if (ex.tick % 6 === 0) ex.frame++;
  });
  explosions = explosions.filter(ex => ex.frame < 3);

  enemies.forEach(e => {
    if (
      e.x < player.x + player.width &&
      e.x + e.width > player.x &&
      e.y < player.y + player.height &&
      e.y + e.height > player.y
    ) {
      gameOver = true;
    }
  });

  if (Math.random() < 0.02) spawnEnemy();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(assets.bg, 0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.drawImage(
    assets.player,
    player.frame * player.width,
    0,
    player.width,
    player.height,
    player.x,
    player.y,
    player.width * 2,
    player.height * 2
  );

  // Bullets
  bullets.forEach(b => {
    ctx.drawImage(assets.bullet, b.x, b.y, b.width, b.height);
  });

  // Enemies
  enemies.forEach(e => {
    ctx.drawImage(
      assets.enemy,
      e.frame * e.width,
      0,
      e.width,
      e.height,
      e.x,
      e.y,
      e.width * 2,
      e.height * 2
    );
  });

  // Explosions
  explosions.forEach(ex => {
    ctx.drawImage(
      assets.explosion,
      ex.frame * 23,
      0,
      23,
      8,
      ex.x,
      ex.y,
      46,
      16
    );
  });

  ctx.fillStyle = "#fff";
  ctx.font = "20px 'Minecraftia', monospace";
  ctx.fillText("Score: " + score, 10, 30);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "30px 'Minecraftia', monospace";
    ctx.fillText("GAME OVER", canvas.width / 2 - 120, canvas.height / 2);
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

loadAssets(gameLoop);
