const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 9;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 8;
const EXPLOSION_WIDTH = 24;
const EXPLOSION_HEIGHT = 8;

const SCALE = 3;
const SPEED = 5;

let keys = {};
document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

let player = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  frame: 1,
  direction: "idle"
};

let enemies = [];
let bullets = [];
let explosions = [];

const playerImg = new Image();
playerImg.src = 'player.png';

const enemyImg = new Image();
enemyImg.src = 'enemy.png';

const explosionImg = new Image();
explosionImg.src = 'explosion.png';

function spawnEnemy() {
  enemies.push({
    x: Math.random() * (canvas.width - ENEMY_WIDTH * SCALE),
    y: -ENEMY_HEIGHT * SCALE,
    frame: 0
  });
}

function shootBullet() {
  bullets.push({
    x: player.x + (PLAYER_WIDTH * SCALE) / 2 - 2,
    y: player.y,
  });
}

let lastShot = 0;

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Move player
  if (keys["ArrowLeft"] || keys["a"]) {
    player.x -= SPEED;
    player.direction = "left";
  } else if (keys["ArrowRight"] || keys["d"]) {
    player.x += SPEED;
    player.direction = "right";
  } else {
    player.direction = "idle";
  }

  player.x = Math.max(0, Math.min(canvas.width - PLAYER_WIDTH * SCALE, player.x));

  // Draw player
  let frame = player.direction === "left" ? 0 : player.direction === "right" ? 2 : 1;
  ctx.drawImage(
    playerImg,
    frame * PLAYER_WIDTH, 0, PLAYER_WIDTH, PLAYER_HEIGHT,
    player.x, player.y, PLAYER_WIDTH * SCALE, PLAYER_HEIGHT * SCALE
  );

  // Shooting
  if (keys[" "] && Date.now() - lastShot > 300) {
    shootBullet();
    lastShot = Date.now();
  }

  // Update bullets
  bullets = bullets.filter(b => b.y > 0);
  for (let bullet of bullets) {
    bullet.y -= 10;
    ctx.fillStyle = 'red';
    ctx.fillRect(bullet.x, bullet.y, 4, 10);
  }

  // Update enemies
  enemies = enemies.filter(e => e.y < canvas.height);
  for (let enemy of enemies) {
    enemy.y += 2;
    enemy.frame = (enemy.frame + 1) % 5;
    ctx.drawImage(
      enemyImg,
      enemy.frame * ENEMY_WIDTH, 0, ENEMY_WIDTH, ENEMY_HEIGHT,
      enemy.x, enemy.y, ENEMY_WIDTH * SCALE, ENEMY_HEIGHT * SCALE
    );

    // Check for wall collision
    if (enemy.y + ENEMY_HEIGHT * SCALE > player.y + PLAYER_HEIGHT * SCALE) {
      alert("Game Over");
      document.location.reload();
    }
  }

  // Check bullet collision
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      if (
        bullet.x < enemy.x + ENEMY_WIDTH * SCALE &&
        bullet.x + 4 > enemy.x &&
        bullet.y < enemy.y + ENEMY_HEIGHT * SCALE &&
        bullet.y + 10 > enemy.y
      ) {
        bullets.splice(bIndex, 1);
        enemies.splice(eIndex, 1);
        explosions.push({
          x: enemy.x,
          y: enemy.y,
          frame: 0
        });
      }
    });
  });

  // Update explosions
  explosions = explosions.filter(e => e.frame < 3);
  for (let explosion of explosions) {
    ctx.drawImage(
      explosionImg,
      explosion.frame * EXPLOSION_WIDTH, 0, EXPLOSION_WIDTH, EXPLOSION_HEIGHT,
      explosion.x, explosion.y, EXPLOSION_WIDTH * SCALE, EXPLOSION_HEIGHT * SCALE
    );
    explosion.frame += 0.2;
  }

  requestAnimationFrame(update);
}

setInterval(spawnEnemy, 1000);
window.onload = update;
