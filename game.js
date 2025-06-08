const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const keys = {};

// Load textures from assets
const bgImg = new Image(); bgImg.src = 'assets/bg.png';
const playerImg = new Image(); playerImg.src = 'assets/player.png';
const enemyImg = new Image(); enemyImg.src = 'assets/enemy.png';
const explosionImg = new Image(); explosionImg.src = 'assets/explosion.png';
const bulletImg = new Image(); bulletImg.src = 'assets/bullet.png';

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

class Sprite {
  constructor(img, frameWidth, frameHeight, frameCount, frameSpeed) {
    this.img = img;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;
    this.frameSpeed = frameSpeed;
    this.frameIndex = 0;
    this.counter = 0;
  }

  update() {
    this.counter++;
    if (this.counter >= this.frameSpeed) {
      this.counter = 0;
      this.frameIndex = (this.frameIndex + 1) % this.frameCount;
    }
  }

  draw(x, y) {
    ctx.drawImage(
      this.img,
      this.frameIndex * this.frameWidth, 0,
      this.frameWidth, this.frameHeight,
      x, y,
      this.frameWidth, this.frameHeight
    );
  }
}

class Player {
  constructor() {
    this.sprite = new Sprite(playerImg, 48, 48, 3, 10);
    this.x = canvas.width / 2 - 24;
    this.y = canvas.height - 60;
    this.speed = 4;
    this.cooldown = 0;
  }

  update() {
    if (keys['ArrowLeft']) this.x -= this.speed;
    if (keys['ArrowRight']) this.x += this.speed;
    this.x = Math.max(0, Math.min(canvas.width - 48, this.x));

    this.sprite.update();

    this.cooldown--;
    if (keys[' '] && this.cooldown <= 0) {
      bullets.push(new Bullet(this.x + 22, this.y));
      this.cooldown = 15;
    }
  }

  draw() {
    this.sprite.draw(this.x, this.y);
  }
}

class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 6;
    this.width = 4;
    this.height = 10;
  }

  update() {
    this.y -= this.speed;
  }

  draw() {
    ctx.drawImage(bulletImg, this.x, this.y, this.width, this.height);
  }
}

class Enemy {
  constructor(x, y) {
    this.sprite = new Sprite(enemyImg, 48, 48, 5, 6);
    this.x = x;
    this.y = y;
    this.speed = 2;
    this.dead = false;
  }

  update() {
    this.y += this.speed;
    this.sprite.update();
  }

  draw() {
    this.sprite.draw(this.x, this.y);
  }

  getRect() {
    return { x: this.x, y: this.y, w: 48, h: 48 };
  }
}

class Explosion {
  constructor(x, y) {
    this.sprite = new Sprite(explosionImg, 48, 48, 3, 6);
    this.x = x;
    this.y = y;
    this.done = false;
  }

  update() {
    this.sprite.update();
    if (this.sprite.frameIndex === this.sprite.frameCount - 1) {
      this.done = true;
    }
  }

  draw() {
    this.sprite.draw(this.x, this.y);
  }
}

function rectsIntersect(r1, r2) {
  return !(r2.x > r1.x + r1.w ||
           r2.x + r2.w < r1.x ||
           r2.y > r1.y + r1.h ||
           r2.y + r2.h < r1.y);
}

// Game state
let player, bullets, enemies, explosions;
let score, gameOver;

function initGame() {
  player = new Player();
  bullets = [];
  enemies = [];
  explosions = [];
  score = 0;
  gameOver = false;
}
initGame();

function spawnEnemy() {
  if (!gameOver) {
    const x = Math.random() * (canvas.width - 48);
    enemies.push(new Enemy(x, -50));
  }
}
setInterval(spawnEnemy, 1000);

function update() {
  if (gameOver) return;

  player.update();
  bullets.forEach(b => b.update());
  enemies.forEach(e => e.update());
  explosions.forEach(ex => ex.update());

  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (!e.dead && rectsIntersect({ x: b.x, y: b.y, w: 4, h: 10 }, e.getRect())) {
        e.dead = true;
        bullets.splice(bi, 1);
        explosions.push(new Explosion(e.x, e.y));
        score += 10;
      }
    });
  });

  for (const enemy of enemies) {
    if (!enemy.dead && enemy.y > canvas.height - 48) {
      gameOver = true;
      break;
    }
  }

  enemies = enemies.filter(e => !e.dead && e.y < canvas.height);
  explosions = explosions.filter(e => !e.done);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  player.draw();
  bullets.forEach(b => b.draw());
  enemies.forEach(e => e.draw());
  explosions.forEach(ex => ex.draw());

  ctx.fillStyle = 'white';
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText('Score: ' + score, 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '14px "Press Start 2P"';
    ctx.fillText('GAME OVER', 90, canvas.height / 2 - 10);
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText('Press R to Restart', 50, canvas.height / 2 + 20);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();

document.addEventListener('keydown', e => {
  if (gameOver && e.key === 'r') {
    initGame();
  }
});
