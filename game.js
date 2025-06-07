const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Make canvas full window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load images
const images = {};
const assetsToLoad = [
  { name: 'player', src: 'assets/player.png' },
  { name: 'enemy', src: 'assets/enemy.png' },
  { name: 'explosion', src: 'assets/explosion.png' },
  { name: 'bullet', src: 'assets/bullet.png' },
  { name: 'bg', src: 'assets/bg.png' }
];

let assetsLoaded = 0;

function loadAssets(callback) {
  assetsToLoad.forEach(asset => {
    const img = new Image();
    img.src = asset.src;
    img.onload = () => {
      images[asset.name] = img;
      assetsLoaded++;
      if (assetsLoaded === assetsToLoad.length) {
        callback();
      }
    };
  });
}

// Game variables
let player = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 120,
  width: 100,
  height: 100,
  speed: 7,
  frame: 1, // 0-left, 1-idle, 2-right
  frameTimer: 0,
  frameInterval: 100,
  movingLeft: false,
  movingRight: false,
};

let bullets = [];
let enemies = [];
let explosions = [];

let score = 0;
let gameOver = false;

const playerFrameWidth = () => images.player.width / 3;
const enemyFrameWidth = () => images.enemy.width / 5;
const explosionFrameWidth = () => images.explosion.width / 3;

// Controls
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') player.movingLeft = true;
  if (e.key === 'ArrowRight' || e.key === 'd') player.movingRight = true;
  if (e.key === ' ' && !gameOver) shootBullet();
  if (e.key === 'Enter' && gameOver) restartGame();
});

window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') player.movingLeft = false;
  if (e.key === 'ArrowRight' || e.key === 'd') player.movingRight = false;
});

// Shoot bullet
function shootBullet() {
  bullets.push({
    x: player.x + player.width / 2 - 5,
    y: player.y,
    width: 10,
    height: 10,
    speed: 10,
  });
}

// Spawn enemies periodically
let enemySpawnTimer = 0;
const enemySpawnInterval = 1500; // ms

function spawnEnemy() {
  const xPos = Math.random() * (canvas.width - 80);
  enemies.push({
    x: xPos,
    y: -80,
    width: enemyFrameWidth() * 1.6,
    height: images.enemy.height * 1.6,
    speed: 3,
    frame: 0,
    frameTimer: 0,
    frameInterval: 150,
  });
}

// Update all game objects
function update(deltaTime) {
  if (gameOver) return;

  // Update player position & animation frame
  if (player.movingLeft && !player.movingRight) {
    player.x -= player.speed;
    player.frame = 0; // left frame
  } else if (player.movingRight && !player.movingLeft) {
    player.x += player.speed;
    player.frame = 2; // right frame
  } else {
    player.frame = 1; // idle frame
  }

  // Keep player inside canvas bounds
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // Update bullets
  bullets = bullets.filter(b => b.y + b.height > 0);
  bullets.forEach(b => {
    b.y -= b.speed;
  });

  // Update enemies and animation frames
  enemies.forEach(e => {
    e.y += e.speed;
    e.frameTimer += deltaTime;
    if (e.frameTimer > e.frameInterval) {
      e.frame = (e.frame + 1) % 5;
      e.frameTimer = 0;
    }
  });

  // Remove enemies that moved off bottom
  enemies = enemies.filter(e => e.y < canvas.height);

  // Spawn enemies based on timer
  enemySpawnTimer += deltaTime;
  if (enemySpawnTimer > enemySpawnInterval) {
    spawnEnemy();
    enemySpawnTimer = 0;
  }

  // Check collisions bullet-enemy
  bullets.forEach((b, bIndex) => {
    enemies.forEach((e, eIndex) => {
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        // collision detected
        score += 10;
        // create explosion at enemy position
        explosions.push({
          x: e.x,
          y: e.y,
          frame: 0,
          frameTimer: 0,
          frameInterval: 100,
        });

        // remove enemy and bullet
        enemies.splice(eIndex, 1);
        bullets.splice(bIndex, 1);
      }
    });
  });

  // Update explosion animations
  explosions.forEach((ex, i) => {
    ex.frameTimer += deltaTime;
    if (ex.frameTimer > ex.frameInterval) {
      ex.frame++;
      ex.frameTimer = 0;
      if (ex.frame > 2) explosions.splice(i, 1);
    }
  });

  // End game if enemy hits bottom
  enemies.forEach(e => {
    if (e.y + e.height > canvas.height) {
      gameOver = true;
    }
  });
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background stretched
  ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.drawImage(
    images.player,
    player.frame * playerFrameWidth(), 0,
    playerFrameWidth(), images.player.height,
    player.x, player.y,
    player.width, player.height
  );

  // Draw bullets smaller
  bullets.forEach(b => {
    ctx.drawImage(images.bullet, b.x, b.y, 10, 10);
  });

  // Draw enemies
  enemies.forEach(e => {
    ctx.drawImage(
      images.enemy,
      e.frame * enemyFrameWidth(), 0,
      enemyFrameWidth(), images.enemy.height,
      e.x, e.y,
      e.width, e.height
    );
  });

  // Draw explosions
  explosions.forEach(ex => {
    ctx.drawImage(
      images.explosion,
      ex.frame * explosionFrameWidth(), 0,
      explosionFrameWidth(), images.explosion.height,
      ex.x, ex.y,
      explosionFrameWidth(), images.explosion.height
    );
  });

  // Draw score
  ctx.fillStyle = 'white';
  ctx.font = '28px Minecraft';
  ctx.fillText(`Score: ${score}`, 20, 40);

  // Draw game over screen
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'red';
    ctx.font = '60px Minecraft';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '30px Minecraft';
    ctx.fillText('Press ENTER to Restart', canvas.width / 2, canvas.height / 2 + 30);
  }
}

// Restart game
function restartGame() {
  score = 0;
  enemies = [];
  bullets = [];
  explosions = [];
  gameOver = false;
  player.x = canvas.width / 2 - player.width / 2;
  player.frame = 1;
}

// Game loop with delta time for smooth animations
let lastTime = 0;
function gameLoop(timestamp = 0) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}

// Start after assets load
loadAssets(() => {
  gameLoop();
});
