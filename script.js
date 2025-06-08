const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = 800;
const HEIGHT = 450;

canvas.width = WIDTH;
canvas.height = HEIGHT;

const PLAYER_SPEED = 5;
const ENEMY_SPEED = 3;
const BULLET_SPEED = 10;

const FPS = 60;

// Frame timing for animation
const ENEMY_FRAME_COUNT = 5;
const EXPLOSION_FRAME_COUNT = 3;
const FRAME_DURATION = 100; // ms per frame

// Load images
const playerImg = new Image();
playerImg.src = 'player.png';  // 3 frames horizontally, each 8x8 px

const enemyImg = new Image();
enemyImg.src = 'enemy.png';   // 5 frames horizontally, each 40x8 px

const explosionImg = new Image();
explosionImg.src = 'explosion.png'; // 3 frames horizontally, each 24x8 px

// Keys state
const keys = {};

// Game objects
let player;
let enemies = [];
let bullets = [];
let explosions = [];

let lastEnemySpawn = 0;
const ENEMY_SPAWN_INTERVAL = 2000; // ms

let gameOver = false;

// Listen to key presses
window.addEventListener('keydown', e => {
  keys[e.key] = true;
});
window.addEventListener('keyup', e => {
  keys[e.key] = false;
});

// Utility function for frame index calculation
function getFrameIndex(frameCount, elapsedTime, frameDuration) {
  return Math.floor(elapsedTime / frameDuration) % frameCount;
}

// Player class
class Player {
  constructor() {
    this.width = 32;  // scaled from 8x8 px frame (4x)
    this.height = 32;
    this.x = 50;
    this.y = HEIGHT / 2 - this.height / 2;

    this.frameWidth = 8;
    this.frameHeight = 8;
    this.direction = 1; // 0=left, 1=idle, 2=right
  }

  update() {
    if (keys['ArrowUp'] && this.y > 0) this.y -= PLAYER_SPEED;
    if (keys['ArrowDown'] && this.y + this.height < HEIGHT) this.y += PLAYER_SPEED;

    if (keys['ArrowLeft'] && this.x > 0) {
      this.x -= PLAYER_SPEED;
      this.direction = 0; // left frame
    } else if (keys['ArrowRight'] && this.x + this.width < WIDTH) {
      this.x += PLAYER_SPEED;
      this.direction = 2; // right frame
    } else {
      this.direction = 1; // idle frame
    }
  }

  draw() {
    ctx.drawImage(
      playerImg,
      this.direction * this.frameWidth, 0,
      this.frameWidth, this.frameHeight,
      this.x, this.y, this.width, this.height
    );
  }
}

// Enemy class
class Enemy {
  constructor() {
    this.frameWidth = 40;
    this.frameHeight = 8;
    this.width = this.frameWidth * 4; // scale 4x
    this.height = this.frameHeight * 4;

    this.x = WIDTH;
    this.y = Math.random() * (HEIGHT - this.height);

    this.spawnTime = performance.now();
  }

  update() {
    this.x -= ENEMY_SPEED;
  }

  draw() {
    const elapsed = performance.now() - this.spawnTime;
    const frame = getFrameIndex(ENEMY_FRAME_COUNT, elapsed, FRAME_DURATION);
    ctx.drawImage(
      enemyImg,
      frame * this.frameWidth, 0,
      this.frameWidth, this.frameHeight,
      this.x, this.y, this.width, this.height
    );
  }
}

// Bullet class
class Bullet {
  constructor(x, y) {
    this.width = 10;
    this.height = 3;
    this.x = x;
    this.y = y;
    this.speed = BULLET_SPEED;
  }

  update() {
    this.x += this.speed;
  }

  draw() {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Explosion class
class Explosion {
  constructor(x, y) {
    this.frameWidth = 24;
    this.frameHeight = 8;
    this.width = this.frameWidth * 4;
    this.height = this.frameHeight * 4;

    this.x = x;
    this.y = y;

    this.startTime = performance.now();
  }

  draw() {
    const elapsed = performance.now() - this.startTime;
    const frame = getFrameIndex(EXPLOSION_FRAME_COUNT, elapsed, FRAME_DURATION);
    ctx.drawImage(
      explosionImg,
      frame * this.frameWidth, 0,
      this.frameWidth, this.frameHeight,
      this.x, this.y, this.width, this.height
    );
  }

  isDone() {
    return performance.now() - this.startTime > EXPLOSION_FRAME_COUNT * FRAME_DURATION;
  }
}

// Initialize game objects
function init() {
  player = new Player();
  enemies = [];
  bullets = [];
  explosions = [];
  lastEnemySpawn = performance.now();
  gameOver = false;
}

// Spawn enemy periodically
function spawnEnemy() {
  if (performance.now() - lastEnemySpawn > ENEMY_SPAWN_INTERVAL) {
    enemies.push(new Enemy());
    lastEnemySpawn = performance.now();
  }
}

// Check collision helper (AABB)
function isColliding(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

// Check if game over condition met
function checkGameOver() {
  for (let enemy of enemies) {
    // Collision with player triggers game over
    if (isColliding(enemy, player)) {
      return true;
    }

    // Enemy passed beyond left screen boundary triggers game over
    if (enemy.x + enemy.width < 0) {
      return true;
    }
  }
  return false;
}

// Main game loop
function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', WIDTH / 2, HEIGHT / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Press R to Restart', WIDTH / 2, HEIGHT / 2 + 40);
    return;
  }

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  player.update();
  player.draw();

  spawnEnemy();

  enemies.forEach((enemy, index) => {
    enemy.update();
    enemy.draw();

    // Check bullet collision with enemy
    bullets.forEach((bullet, bIndex) => {
      if (isColliding(bullet, enemy)) {
        explosions.push(new Explosion(enemy.x, enemy.y));
        enemies.splice(index, 1);
        bullets.splice(bIndex, 1);
      }
    });
  });

  bullets.forEach((bullet, index) => {
    bullet.update();
    bullet.draw();

    // Remove bullets off screen
    if (bullet.x > WIDTH) bullets.splice(index, 1);
  });

  // Draw and update explosions, remove finished ones
  explosions.forEach((explosion, index) => {
    explosion.draw();
    if (explosion.isDone()) {
      explosions.splice(index, 1);
    }
  });

  if (checkGameOver()) {
    gameOver = true;
  }

  requestAnimationFrame(gameLoop);
}

// Shoot bullet on space key press
window.addEventListener('keydown', e => {
  if (e.key === ' ') {
    bullets.push(new Bullet(player.x + player.width, player.y + player.height / 2 - 1));
  }
  if (e.key.toLowerCase() === 'r' && gameOver) {
    init();
    gameLoop();
  }
});

// Start game
playerImg.onload = () => {
  enemyImg.onload = () => {
    explosionImg.onload = () => {
      init();
      gameLoop();
    };
  };
};
