const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ASSETS = {
  bg: "assets/bg.png",
  player: "assets/player.png",
  enemy: "assets/enemy.png",
  explosion: "assets/explosion.png",
  bullet: "assets/bullet.png"
};

const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

const loadImage = src => new Promise(res => {
  const img = new Image();
  img.src = src;
  img.onload = () => res(img);
});

class Sprite {
  constructor(img, frameWidth, frameCount, frameSpeed) {
    this.img = img;
    this.frameWidth = frameWidth;
    this.frameHeight = img.height;
    this.frameCount = frameCount;
    this.frameSpeed = frameSpeed;
    this.frame = 0;
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    if (this.time > this.frameSpeed) {
      this.time = 0;
      this.frame = (this.frame + 1) % this.frameCount;
    }
  }

  draw(x, y, frameOverride = null) {
    const frame = frameOverride !== null ? frameOverride : this.frame;
    ctx.drawImage(
      this.img,
      frame * this.frameWidth, 0,
      this.frameWidth, this.frameHeight,
      x, y,
      this.frameWidth, this.frameHeight
    );
  }
}

(async function startGame() {
  const [bgImg, playerImg, enemyImg, explosionImg, bulletImg] = await Promise.all([
    loadImage(ASSETS.bg),
    loadImage(ASSETS.player),
    loadImage(ASSETS.enemy),
    loadImage(ASSETS.explosion),
    loadImage(ASSETS.bullet)
  ]);

  const playerSprite = new Sprite(playerImg, playerImg.width / 3, 3, 100);
  const enemySprite = new Sprite(enemyImg, enemyImg.width / 5, 5, 100);
  const explosionSprite = new Sprite(explosionImg, explosionImg.width / 3, 3, 50);

  let player = {
    x: 400,
    y: 500,
    speed: 200,
    width: playerImg.width / 3,
    height: playerImg.height
  };

  let bullets = [];
  let enemies = [];
  let explosions = [];

  let lastTime = performance.now();
  let shootCooldown = 0;

  function spawnEnemy() {
    enemies.push({
      x: Math.random() * (canvas.width - enemySprite.frameWidth),
      y: -enemySprite.frameHeight,
      speed: 60 + Math.random() * 40
    });
  }

  setInterval(spawnEnemy, 1000);

  function update(dt) {
    // Player movement
    if (keys["ArrowLeft"]) player.x -= player.speed * dt;
    if (keys["ArrowRight"]) player.x += player.speed * dt;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    // Player shooting
    shootCooldown -= dt * 1000;
    if (keys[" "] && shootCooldown <= 0) {
      bullets.push({ x: player.x + player.width / 2 - 4, y: player.y });
      shootCooldown = 300;
    }

    // Bullets
    bullets = bullets.filter(b => b.y > -16);
    bullets.forEach(b => b.y -= 400 * dt);

    // Enemies
    enemies = enemies.filter(e => e.y < canvas.height);
    enemies.forEach(e => e.y += e.speed * dt);
    enemySprite.update(dt * 1000);

    // Explosions
    explosions = explosions.filter(ex => ex.time < explosionSprite.frameCount * explosionSprite.frameSpeed);
    explosions.forEach(ex => {
      ex.time += dt * 1000;
      ex.frame = Math.floor(ex.time / explosionSprite.frameSpeed);
    });

    // Collision detection
    bullets.forEach((b, i) => {
      enemies.forEach((e, j) => {
        if (b.x < e.x + enemySprite.frameWidth &&
            b.x + 8 > e.x &&
            b.y < e.y + enemySprite.frameHeight &&
            b.y + 16 > e.y) {
          bullets.splice(i, 1);
          enemies.splice(j, 1);
          explosions.push({
            x: e.x,
            y: e.y,
            frame: 0,
            time: 0
          });
        }
      });
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    // Bullets
    bullets.forEach(b => {
      ctx.drawImage(bulletImg, b.x, b.y, 8, 16);
    });

    // Enemies
    enemies.forEach(e => {
      enemySprite.draw(e.x, e.y);
    });

    // Player
    const movingLeft = keys["ArrowLeft"];
    const movingRight = keys["ArrowRight"];
    const frame = movingLeft ? 0 : movingRight ? 2 : 1;
    playerSprite.draw(player.x, player.y, frame);

    // Explosions
    explosions.forEach(ex => {
      explosionSprite.draw(ex.x, ex.y, ex.frame);
    });
  }

  function loop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
