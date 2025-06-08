const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set actual canvas size (in pixels) matching CSS width and height for crisp rendering
canvas.width = 960;
canvas.height = 540;

// Load sprite sheets
const playerSprite = new Image();
const enemySprite = new Image();
const explosionSprite = new Image();

// Replace these paths with your actual sprite sheet paths or URLs
playerSprite.src = 'player.png';    // player: 3 frames: left, idle, right (24x9 each frame)
enemySprite.src = 'enemy.png';      // enemy: 5 frames (40x8 each frame)
explosionSprite.src = 'explosion.png'; // explosion: 3 frames (24x8 each frame)

// Player settings
const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 9;
const PLAYER_FRAME_COUNT = 3;

let playerX = canvas.width / 2 - PLAYER_WIDTH / 2;
let playerY = canvas.height - 50;
let playerSpeed = 4;
let playerFrame = 1; // idle frame
let playerFrameTimer = 0;
const playerFrameInterval = 100; // ms between frame update

let moveLeft = false;
let moveRight = false;

// Enemy settings
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 8;
const ENEMY_FRAME_COUNT = 5;

let enemies = [];
const ENEMY_SPEED = 2;
const ENEMY_SPAWN_INTERVAL = 2000; // spawn every 2 seconds
let lastEnemySpawn = 0;

// Explosion settings
const EXPLOSION_WIDTH = 24;
const EXPLOSION_HEIGHT = 8;
const EXPLOSION_FRAME_COUNT = 3;

let explosions = [];

let gameOver = false;

// Handle keyboard input
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') moveLeft = true;
  if (e.key === 'ArrowRight') moveRight = true;
});

window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') moveLeft = false;
  if (e.key === 'ArrowRight') moveRight = false;
});

// Enemy class
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.frameTimer = 0;
  }
  update(deltaTime) {
    this.y += ENEMY_SPEED;

    // Animate enemy frames
    this.frameTimer += deltaTime;
    if (this.frameTimer > 100) {
      this.frame = (this.frame + 1) % ENEMY_FRAME_COUNT;
      this.frameTimer = 0;
    }
  }
  draw() {
    ctx.drawImage(
      enemySprite,
      this.frame * ENEMY_WIDTH,
      0,
      ENEMY_WIDTH,
      ENEMY_HEIGHT,
      this.x,
      this.y,
      ENEMY_WIDTH * 3, // scale up for visibility
      ENEMY_HEIGHT * 3
    );
  }
}

// Explosion class
class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.frameTimer = 0;
    this.finished = false;
  }
  update(deltaTime) {
    this.frameTimer += deltaTime;
    if (this.frameTimer > 100) {
      this.frame++;
      this.frameTimer = 0;
      if (this.frame >= EXPLOSION_FRAME_COUNT) {
        this.finished = true;
      }
    }
  }
  draw() {
    if (this.frame < EXPLOSION_FRAME_COUNT) {
      ctx.drawImage(
        explosionSprite,
        this.frame * EXPLOSION_WIDTH,
        0,
        EXPLOSION_WIDTH,
        EXPLOSION_HEIGHT,
        this.x,
        this.y,
        EXPLOSION_WIDTH * 3,
        EXPLOSION_HEIGHT * 3
      );
    }
  }
}

// Game loop variables
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  if (gameOver) {
    drawGameOver();
    return;
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update player position and animation
  if (moveLeft && playerX > 0) {
    playerX -= playerSpeed;
    playerFrame = 0; // left frame
  } else if (moveRight && playerX < canvas.width - PLAYER_WIDTH * 3) {
    playerX += playerSpeed;
    playerFrame = 2; // right frame
  } else {
    playerFrame = 1; // idle frame
  }

  // Draw player
  ctx.drawImage(
    playerSprite,
    playerFrame * PLAYER_WIDTH,
    0,
    PLAYER_WIDTH,
    PLAYER_HEIGHT,
    playerX,
    playerY,
    PLAYER_WIDTH * 3,
    PLAYER_HEIGHT * 3
  );

  // Spawn enemies
  if (time - lastEnemySpawn > ENEMY_SPAWN_INTERVAL) {
    const enemyX = Math.random() * (canvas.width - ENEMY_WIDTH * 3);
    enemies.push(new Enemy(enemyX, -ENEMY_HEIGHT * 3));
    lastEnemySpawn = time;
  }

  // Update and draw enemies
  enemies.forEach((enemy, index) => {
    enemy.update(deltaTime);
    enemy.draw();

    // Check collision with player's backside wall
    // Assuming backside wall is playerY + player's height
    if (
      enemy.y + ENEMY_HEIGHT * 3 >= playerY &&
      enemy.x < playerX + PLAYER_WIDTH * 3 &&
      enemy.x + ENEMY_WIDTH * 3 > playerX
    ) {
      gameOver = true;
    }

    // Remove enemies that go beyond canvas
    if (enemy.y > canvas.height) {
      enemies.splice(index, 1);
    }
  });

  // Update and draw explosions
  explosions.forEach((explosion, index) => {
    explosion.update(deltaTime);
    explosion.draw();
    if (explosion.finished) explosions.splice(index, 1);
  });

  requestAnimationFrame(update);
}

function drawGameOver() {
  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
}

window.onload = () => {
  update();
};
