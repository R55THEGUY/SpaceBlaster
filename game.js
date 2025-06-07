 const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const images = {};
const keys = {};
let player, bullets = [], enemies = [], explosions = [];
let score = 0;
let gameOver = false;

const loadImage = (name, src) => {
  return new Promise(resolve => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      images[name] = img;
      resolve();
    };
  });
};

const loadAssets = async () => {
  await Promise.all([
    loadImage("bg", "assets/bg.png"),
    loadImage("player", "assets/player.png"),
    loadImage("enemy", "assets/enemy.png"),
    loadImage("bullet", "assets/bullet.png"),
    loadImage("explosion", "assets/explosion.png")
  ]);
};

const createPlayer = () => ({
  x: canvas.width / 2 - 48,
  y: canvas.height - 120,
  width: 64,
  height: 64,
  speed: 6,
  frame: 1 // 0: left, 1: idle, 2: right
});

const createEnemy = () => ({
  x: Math.random() * (canvas.width - 64),
  y: -64,
  speed: 2 + Math.random() * 2,
  frame: 0,
  frameTimer: 0
});

const createExplosion = (x, y) => ({
  x, y,
  frame: 0,
  timer: 0
});

const drawText = (text, x, y, size = 32, color = "white") => {
  ctx.font = `${size}px Minecraft`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
};

const resetGame = () => {
  player = createPlayer();
  bullets = [];
  enemies = [];
  explosions = [];
  score = 0;
  gameOver = false;
};

const update = (delta) => {
  if (gameOver) return;

  // Player movement
  if (keys["ArrowLeft"]) {
    player.x -= player.speed;
    player.frame = 0;
  } else if (keys["ArrowRight"]) {
    player.x += player.speed;
    player.frame = 2;
  } else {
    player.frame = 1;
  }

  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // Bullets
  bullets.forEach(b => b.y -= 10);
  bullets = bullets.filter(b => b.y > -20);

  // Enemies
  enemies.forEach(e => {
    e.y += e.speed;
    e.frameTimer += delta;
    if (e.frameTimer > 100) {
      e.frame = (e.frame + 1) % 5;
      e.frameTimer = 0;
    }
  });

  // Spawn new enemies
  if (Math.random() < 0.03) enemies.push(createEnemy());

  // Collisions
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (b.x < e.x + 64 && b.x + 6 > e.x && b.y < e.y + 64 && b.y + 12 > e.y) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        explosions.push(createExplosion(e.x, e.y));
        score += 10;
      }
    });
  });

  // Player collision
  enemies.forEach(e => {
    if (player.x < e.x + 64 && player.x + player.width > e.x &&
        player.y < e.y + 64 && player.y + player.height > e.y) {
      gameOver = true;
    }
  });

  // Explosions
  explosions = explosions.filter(ex => ex.frame < 3);
  explosions.forEach(ex => {
    ex.timer += delta;
    ex.frame = Math.floor(ex.timer / 100);
  });
};

const render = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);

  // Player
  ctx.drawImage(
    images.player,
    player.frame * 48, 0, 48, 48,
    player.x, player.y,
    player.width, player.height
  );

  // Bullets
  bullets.forEach(b => {
    ctx.drawImage(images.bullet, b.x, b.y, 6, 12);
  });

  // Enemies
  enemies.forEach(e => {
    ctx.drawImage(
      images.enemy,
      e.frame * 64, 0, 64, 64,
      e.x, e.y,
      64 * 1.6, 64 * 1.6
    );
  });

  // Explosions
  explosions.forEach(ex => {
    ctx.drawImage(
      images.explosion,
      ex.frame * 64, 0, 64, 64,
      ex.x, ex.y,
      64, 64
    );
  });

  drawText(`Score: ${score}`, 20, 40);

  if (gameOver) {
    drawText("GAME OVER", canvas.width / 2 - 140, canvas.height / 2, 48, "red");
    drawText("Press R to Restart", canvas.width / 2 - 180, canvas.height / 2 + 50);
  }
};

let lastTime = 0;
const gameLoop = (timestamp) => {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  update(delta);
  render();
  requestAnimationFrame(gameLoop);
};

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " " && !gameOver) {
    bullets.push({ x: player.x + player.width / 2 - 3, y: player.y });
  }
  if (e.key === "r" && gameOver) {
    resetGame();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

loadAssets().then(() => {
  resetGame();
  requestAnimationFrame(gameLoop);
});
