// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Load spritesheets
const playerImg = new Image();
playerImg.src = 'player.png';   // 24x8 px, 3 frames (8x8 each)

const enemyImg = new Image();
enemyImg.src = 'enemy.png';     // 40x8 px, 5 frames (8x8 each)

const explosionImg = new Image();
explosionImg.src = 'explosion.png'; // 24x8 px, 3 frames (8x8 each)

// Game variables
let keys = {};
let bullets = [];
let enemies = [];
let explosions = [];

const PLAYER_SPEED = 3;
const BULLET_SPEED = 7;
const ENEMY_SPEED = 2;

const FRAME_DURATION = 100; // ms per animation frame

// Helper function to get current frame index based on time
function getFrameIndex(frameCount, elapsed, frameDuration) {
  return Math.floor(elapsed / frameDuration) % frameCount;
}

// Player class
class Player {
  constructor() {
    this.width = 32;  // Scale 8x8 frame by 4
    this.height = 32;
    this.x = 50;
    this.y = HEIGHT / 2 - this.height / 2;
    this.frameCount = 3;
    this.frameWidth = 8;
    this.frameHeight = 8;
    this.animStart = performance.now();
    this.direction = 1; // 0=left,1=idle,2=right
  }

  update() {
    if (keys['ArrowUp'] && this.y > 0) this.y -= PLAYER_SPEED;
    if (keys['ArrowDown'] && this.y + this.height < HEIGHT) this.y += PLAYER_SPEED;
    if (keys['ArrowLeft'] && this.x > 0) {
      this.x -= PLAYER_SPEED;
      this.direction = 0;
    } else if (keys['ArrowRight'] && this.x + this.width < WIDTH) {
      this.x += PLAYER_SPEED;
      this.direction = 2;
    } else {
      this.direction = 1; // idle
    }
  }

  draw() {
    const frameX = this.direction * this.frameWidth;
    ctx.drawImage(
      playerImg,
      frameX, 0, this.frameWidth, this.frameHeight,
      this.x, this.y, this.width, this.height
    );
  }
}

// Bullet class
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 8;
    this.height = 4;
  }
  update() {
    this.x += BULLET_SPEED;
  }
  draw() {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Enemy class
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32; // 8x8 frame scaled 4x
    this.height = 32;
    this.frameCount = 5;
    this.frameWidth = 8;
    this.frameHeight = 8;
    this.animStart = performance.now();
    this.dead = false;
  }
  update() {
    this.x -= ENEMY_SPEED;
  }
  draw() {
    const now = performance.now();
    const elapsed = now - this.animStart;
    const frame = getFrameIndex(this.frameCount, elapsed, FRAME_DURATION);
    ctx.drawImage(
      enemyImg,
      frame * this.frameWidth, 0, this.frameWidth, this.frameHeight,
      this.x, this.y, this.width, this.height
    );
  }
}

// Explosion class
class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32; // 8x8 frame scaled 4x
    this.height = 32;
    this.frameCount = 3;
    this.frameWidth = 8;
    this.frameHeight = 8;
    this.animStart = performance.now();
    this.done = false;
  }

  update() {
    const now = performance.now();
    const elapsed = now - this.animStart;
    if (elapsed > FRAME_DURATION * this.frameCount) {
      this.done = true;
    }
  }

  draw() {
    const now = performance.now();
    const elapsed = now - this.animStart;
    const frame = Math.min(
      Math.floor(elapsed / FRAME_DURATION),
      this.frameCount - 1
    );
    ctx.drawImage(
      explosionImg,
      frame * this.frameWidth, 0, this.frameWidth, this.frameHeight,
      this.x, this.y, this.width, this.height
    );
  }
}

const player = new Player();

// Spawn enemies at intervals
let lastEnemySpawn = 0;
const enemySpawnInterval = 2000;

function spawnEnemy() {
  const y = Math.random() * (HEIGHT - 32);
  enemies.push(new Enemy(WIDTH, y));
}

function update(delta) {
  player.update();

  // Bullets
  bullets.forEach((b, i) => {
    b.update();
    if (b.x > WIDTH) bullets.splice(i, 1);
  });

  // Enemies
  enemies.forEach((e, i) => {
    e.update();
    if (e.x + e.width < 0) enemies.splice(i, 1);
  });

  // Collisions
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        // Remove bullet and enemy, add explosion
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        explosions.push(new Explosion(e.x, e.y));
      }
    });
  });

  // Explosions
  explosions.forEach((ex, i) => {
    ex.update();
    if (ex.done) explosions.splice(i, 1);
  });

  // Spawn enemies over time
  if (performance.now() - lastEnemySpawn > enemySpawnInterval) {
    spawnEnemy();
    lastEnemySpawn = performance.now();
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  player.draw();

  bullets.forEach(b => b.draw());
  enemies.forEach(e => e.draw());
  explosions.forEach(ex => ex.draw());
}

let lastTime = performance.now();

function gameLoop() {
  let now = performance.now();
  let delta = now - lastTime;
  lastTime = now;

  update(delta);
  draw();

  requestAnimationFrame(gameLoop);
}

gameLoop();

// Controls
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;

  // Space to shoot
  if (e.key === ' ') {
    bullets.push(new Bullet(player.x + player.width, player.y + player.height / 2 - 2));
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});
