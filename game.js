ctx.imageSmoothingEnabled = false;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerImage = new Image();
playerImage.src = 'player.png';

const enemyImage = new Image();
enemyImage.src = 'enemy.png';

const explosionImage = new Image();
explosionImage.src = 'explosion.png';

let keys = {};
let bullets = [];
let enemies = [];
let explosions = [];

let player = {
  x: 100,
  y: 500,
  width: 8,
  height: 8,
  speed: 3,
  direction: 'idle',
  frame: 1,
  frameTick: 0,
  shoot: function () {
    bullets.push({ x: this.x + this.width / 2 - 1, y: this.y, speed: 5 });
  }
};

// Mobile controls
document.getElementById('leftBtn').addEventListener('touchstart', () => keys['ArrowLeft'] = true);
document.getElementById('leftBtn').addEventListener('touchend', () => keys['ArrowLeft'] = false);
document.getElementById('rightBtn').addEventListener('touchstart', () => keys['ArrowRight'] = true);
document.getElementById('rightBtn').addEventListener('touchend', () => keys['ArrowRight'] = false);
document.getElementById('shootBtn').addEventListener('touchstart', () => player.shoot());

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function spawnEnemy() {
  enemies.push({
    x: Math.random() * (canvas.width - 8),
    y: 0,
    width: 8,
    height: 8,
    frame: 0,
    frameTick: 0
  });
}

function update() {
  // Player movement
  if (keys['ArrowLeft']) {
    player.x -= player.speed;
    player.direction = 'left';
  } else if (keys['ArrowRight']) {
    player.x += player.speed;
    player.direction = 'right';
  } else {
    player.direction = 'idle';
  }

  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // Bullets
  bullets = bullets.filter(b => b.y > 0);
  bullets.forEach(b => b.y -= b.speed);

  // Enemies
  enemies.forEach(e => {
    e.y += 1;
    e.frameTick++;
    if (e.frameTick > 10) {
      e.frame = (e.frame + 1) % 5;
      e.frameTick = 0;
    }
  });

  // Collisions
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (
        b.x < e.x + e.width &&
        b.x + 2 > e.x &&
        b.y < e.y + e.height &&
        b.y + 4 > e.y
      ) {
        explosions.push({ x: e.x, y: e.y, frame: 0, tick: 0 });
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
      }
    });
  });

  // Explosions
  explosions = explosions.filter(ex => ex.frame < 3);
  explosions.forEach(ex => {
    ex.tick++;
    if (ex.tick > 5) {
      ex.frame++;
      ex.tick = 0;
    }
  });

  // Player animation frame
  player.frameTick++;
  if (player.frameTick > 10) {
    if (player.direction === 'left') player.frame = 0;
    else if (player.direction === 'idle') player.frame = 1;
    else if (player.direction === 'right') player.frame = 2;
    player.frameTick = 0;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.drawImage(playerImage, player.frame * 8, 0, 8, 8, player.x, player.y, 32, 32);

  // Draw bullets
  ctx.fillStyle = 'red';
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 2, 4));

  // Draw enemies
  enemies.forEach(e => {
    ctx.drawImage(enemyImage, e.frame * 8, 0, 8, 8, e.x, e.y, 32, 32);
  });

  // Draw explosions
  explosions.forEach(ex => {
    ctx.drawImage(explosionImage, ex.frame * 8, 0, 8, 8, ex.x, ex.y, 32, 32);
  });
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

setInterval(spawnEnemy, 1000);
gameLoop();
