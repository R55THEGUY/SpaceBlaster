const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ASSETS = {
  bg: "assets/bg.png",
  player: "assets/player.png",
  enemy: "assets/enemy.png",
  explosion: "assets/explosion.png",
  bullet: "assets/bullet.png"
};

let images = {};
let keys = {};
let bullets = [];
let enemies = [];
let explosions = [];

let player = { x: 400, y: 500, width: 0, height: 0, frame: 1 };
let speed = 4;
let lastShot = 0;
let score = 0;
let isGameOver = false;
let lastEnemySpawn = 0;

// Load images
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

function resetGame() {
  player.x = 400;
  bullets = [];
  enemies = [];
  explosions = [];
  score = 0;
  isGameOver = false;
}

// Handle keys
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// Restart on click
canvas.addEventListener("click", () => {
  if (isGameOver) resetGame();
});

// Game loop
function update(delta) {
  if (isGameOver) return;

  // Movement
  if (keys['ArrowLeft']) {
    player.x -= speed;
    player.frame = 0;
  } else if (keys['ArrowRight']) {
    player.x += speed;
    player.frame = 2;
  } else {
    player.frame = 1;
  }

  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // Shooting
  if (keys[' '] && Date.now() - lastShot > 300) {
    bullets.push({ x: player.x + player.width / 2 - 5, y: player.y });
    lastShot = Date.now();
  }

  // Move bullets
  bullets = bullets.filter(b => b.y > -10);
  bullets.forEach(b => b.y -= 8);

  // Spawn enemies
  if (Date.now() - lastEnemySpawn > 1000) {
    enemies.push({ x: Math.random() * (canvas.width - 64), y: -64, frame: 0, timer: 0 });
    lastEnemySpawn = Date.now();
  }

  // Move enemies
  enemies.forEach(e => {
    e.y += 2;
    e.timer += delta;
    e.frame = Math.floor((e.timer / 100) % 5);
  });

  // Check collisions
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (b.x < e.x + 64 && b.x + 10 > e.x && b.y < e.y + 64 && b.y + 10 > e.y) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        explosions.push({ x: e.x, y: e.y, frame: 0, timer: 0 });
        score += 10;
      }
    });
  });

  // Check player collision
  enemies.forEach(e => {
    if (player.x < e.x + 64 && player.x + player.width > e.x && player.y < e.y + 64 && player.y + player.height > e.y) {
      isGameOver = true;
    }
  });

  // Explosion animation
  explosions = explosions.filter(ex => ex.frame < 3);
  explosions.forEach(ex => {
    ex.timer += delta;
    ex.frame = Math.floor(ex.timer / 100);
  });
}

function draw() {
  ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.drawImage(images.player, player.frame * 48, 0, 48, 48, player.x, player.y, player.width, player.height);

  // Draw bullets
  bullets.forEach(b => {
    ctx.drawImage(images.bullet, b.x, b.y, 10, 20);
  });

  // Draw enemies
  enemies.forEach(e => {
    ctx.drawImage(images.enemy, e.frame * 64, 0, 64, 64, e.x, e.y, 64 * 1.6, 64 * 1.6);
  });

  // Draw explosions
  explosions.forEach(ex => {
    ctx.drawImage(images.explosion, ex.frame * 64, 0, 64, 64, ex.x, ex.y, 64, 64);
  });

  // Draw score
  ctx.font = "20px Minecraft";
  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 20, 30);

  // Game Over
  if (isGameOver) {
    ctx.font = "50px Minecraft";
    ctx.fillStyle = "red";
    ctx.fillText("GAME OVER", canvas.width / 2 - 160, canvas.height / 2);
    ctx.font = "20px Minecraft";
    ctx.fillStyle = "white";
    ctx.fillText("Click to Restart", canvas.width / 2 - 100, canvas.height / 2 + 40);
  }
}

// Main loop
let last = performance.now();
function loop(now) {
  let delta = now - last;
  update(delta);
  draw();
  last = now;
  requestAnimationFrame(loop);
}

// Load assets and start
Promise.all(Object.entries(ASSETS).map(([key, path]) =>
  loadImage(path).then(img => (images[key] = img))
)).then(() => {
  player.width = 48 * 1.8;
  player.height = 48 * 1.8;
  player.x = canvas.width / 2 - player.width / 2;
  loop(performance.now());
}).catch(err => {
  console.error("Asset load error:", err);
});
