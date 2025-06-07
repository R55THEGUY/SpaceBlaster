 const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Fullscreen canvas setup
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Load images from assets folder
const assets = {
  player: new Image(),
  enemy: new Image(),
  bullet: new Image(),
  bg: new Image(),
  explosion: new Image(),
};

assets.player.src = 'assets/player.png';     // 24x9 frames
assets.enemy.src = 'assets/enemy.png';       // 42x8 frames
assets.bullet.src = 'assets/bullet.png';     // single frame
assets.bg.src = 'assets/bg.png';             // background image
assets.explosion.src = 'assets/explosion.png'; // 23x8 frames

// Sprite frame dimensions (pixels)
const SPRITE = {
  player: { width: 24, height: 9, frames: 3 },
  enemy: { width: 42, height: 8, frames: 5 },
  explosion: { width: 23, height: 8, frames: 3 },
  bullet: { width: 6, height: 6 },
};

// Game variables
let keys = {};
let score = 0;
let gameOver = false;
let shootCooldown = 0;

// Player object
const player = {
  x: canvas.width / 2,
  y: canvas.height - 80,
  speed: 6,
  width: SPRITE.player.width * 4,  // scale 4x for visibility
  height: SPRITE.player.height * 4,
  frameIndex: 1,  // idle middle frame initially
  frameCount: 3,
  frameTimer: 0,
  frameInterval: 10,
  direction: 0,  // -1 left, 0 idle, 1 right
};

// Bullets array
const bullets = [];

// Enemies array
const enemies = [];

// Explosions array
const explosions = [];

// Spawn enemy every X frames
let enemySpawnTimer = 0;
const enemySpawnInterval = 90;

// Event listeners for keyboard
window.addEventListener('keydown', e => {
  keys[e.code] = true;
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

// Bullet class
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 10;
    this.width = 6;
    this.height = 12;
  }

  update() {
    this.y -= this.speed;
  }

  draw() {
    ctx.drawImage(assets.bullet, this.x, this.y, this.width, this.height);
  }
}

// Enemy class
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 2;
    this.width = SPRITE.enemy.width * 3;  // scale 3x
    this.height = SPRITE.enemy.height * 3;
    this.frameIndex = 0;
    this.frameCount = 5;
    this.frameTimer = 0;
    this.frameInterval = 15;
  }

  update() {
    this.y += this.speed;
    // Animate enemy sprite
    this.frameTimer++;
    if (this.frameTimer > this.frameInterval) {
      this.frameIndex = (this.frameIndex + 1) % this.frameCount;
      this.frameTimer = 0;
    }
  }

  draw() {
    ctx.drawImage(
      assets.enemy,
      this.frameIndex * SPRITE.enemy.width,
      0,
      SPRITE.enemy.width,
      SPRITE.enemy.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

// Explosion class
class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.frameIndex = 0;
    this.frameCount = 3;
    this.frameTimer = 0;
    this.frameInterval = 8;
    this.finished = false;
  }

  update() {
    this.frameTimer++;
    if (this.frameTimer > this.frameInterval) {
      this.frameIndex++;
      this.frameTimer = 0;
      if (this.frameIndex >= this.frameCount) {
        this.finished = true;
      }
    }
  }

  draw() {
    if (!this.finished) {
      ctx.drawImage(
        assets.explosion,
        this.frameIndex * SPRITE.explosion.width,
        0,
        SPRITE.explosion.width,
        SPRITE.explosion.height,
        this.x,
        this.y,
        SPRITE.explosion.width * 4,
        SPRITE.explosion.height * 4
      );
    }
  }
}

// Game functions

function spawnEnemy() {
  const x = Math.random() * (canvas.width - SPRITE.enemy.width * 3);
  enemies.push(new Enemy(x, -SPRITE.enemy.height * 3));
}

function resetGame() {
  score = 0;
  gameOver = false;
  bullets.length = 0;
  enemies.length = 0;
  explosions.length = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height - 80;
}

// Collision detection
function rectsCollide(r1, r2) {
  return !(
    r1.x > r2.x + r2.width ||
    r1.x + r1.width < r2.x ||
    r1.y > r2.y + r2.height ||
    r1.y + r1.height < r2.y
  );
}

// Update game state
function update() {
  if (gameOver) return;

  // Player movement
  player.direction = 0;
  if (keys['ArrowLeft'] || keys['KeyA']) {
    player.x -= player.speed;
    player.direction = -1;
  }
  if (keys['ArrowRight'] || keys['KeyD']) {
    player.x += player.speed;
    player.direction = 1;
  }

  // Keep player in bounds
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  // Player animation frame based on movement
  if (player.direction === -1) player.frameIndex = 0; // left frame
  else if (player.direction === 1) player.frameIndex = 2; // right frame
  else player.frameIndex = 1; // idle middle frame

  // Shooting cooldown
  if (shootCooldown > 0) shootCooldown--;

  if ((keys['Space'] || keys['KeyW'] || keys['ArrowUp']) && shootCooldown === 0) {
    bullets.push(new Bullet(player.x + player.width / 2 - 3, player.y));
    shootCooldown = 15; // delay between shots
  }

  // Update bullets
  bullets.forEach((bullet, index) => {
    bullet.update();
    if (bullet.y + bullet.height < 0) {
      bullets.splice(index, 1);
    }
  });

  // Spawn enemies
  enemySpawnTimer++;
  if (enemySpawnTimer >= enemySpawnInterval) {
    spawnEnemy();
    enemySpawnTimer = 0;
  }

  // Update enemies
  enemies.forEach((enemy, eIndex) => {
    enemy.update();

    // Enemy out of screen bottom -> game over
    if (enemy.y > canvas.height) {
      gameOver = true;
    }

    // Check collision with bullets
    bullets.forEach((bullet, bIndex) => {
      if (
        rectsCollide(
          { x: bullet.x, y: bullet.y, width: bullet.width, height: bullet.height },
          { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
        )
      ) {
        // Create explosion
        explosions.push(new Explosion(enemy.x, enemy.y));
        enemies.splice(eIndex, 1);
        bullets.splice(bIndex, 1);
        score += 10;
      }
    });

    // Check collision with player
    if (
      rectsCollide(
        { x: player.x, y: player.y, width: player.width, height: player.height },
        { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
      )
    ) {
      gameOver = true;
    }
  });

  // Update explosions
  explosions.forEach((explosion, index) => {
    explosion.update();
    if (explosion.finished) explosions.splice(index, 1);
  });
}

// Draw everything
function draw() {
  // Clear screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background (if loaded)
  if (assets.bg.complete) {
    const pattern = ctx.createPattern(assets.bg, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw player
  ctx.drawImage(
    assets.player,
    player.frameIndex * SPRITE.player.width,
    0,
    SPRITE.player.width,
    SPRITE.player.height,
    player.x,
    player.y,
    player.width,
    player.height
  );

  // Draw bullets
  bullets.forEach(bullet => bullet.draw());

  // Draw enemies
  enemies.forEach(enemy => enemy.draw());

  // Draw explosions
  explosions.forEach(explosion => explosion.draw());

  // Draw score
  ctx.fillStyle = 'white';
  ctx.font = '20px "Press Start 2P"';
  ctx.fillText('Score: ' + score, 20, 30);

  // Draw game over message
  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '40px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '20px "Press Start 2P"';
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 20);
    ctx.textAlign = 'start';
  }
}

// Main game loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Restart game on R press
window.addEventListener('keydown', e => {
  if (e.code === 'KeyR' && gameOver) {
    resetGame();
  }
});

// Start game loop
resetGame();
loop();
