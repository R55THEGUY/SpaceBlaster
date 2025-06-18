// game.js

// ... (your existing code for canvas, ctx, images, sounds) ...

// --- Game State Variables ---
let gameStarted = false; // Track if the game has started
let score = 0;
let lastFrameTime = 0;
const frameRate = 1000 / 60; // 60 frames per second
let gameLoopId;

// --- DOM Elements ---
const mainMenu = document.getElementById('mainMenu');
const startButton = document.getElementById('startButton');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');
const finalScoreDisplay = document.getElementById('finalScore');
const fullscreenButton = document.getElementById('fullscreenButton'); //

// Mobile Controls
const mobileControls = document.getElementById('mobileControls'); //
const leftButton = document.getElementById('leftButton'); //
const rightButton = document.getElementById('rightButton'); //
const shootButton = document.getElementById('shootButton'); //

// New: Portrait Warning Element
const portraitWarning = document.createElement('div');
portraitWarning.className = 'portrait-warning';
portraitWarning.innerHTML = 'Please rotate your device to landscape mode for the best experience! <br> Tap anywhere to continue and go fullscreen.';
document.body.appendChild(portraitWarning);

// --- Game Object Arrays ---
let player;
let bullets = [];
let enemies = [];
let explosions = [];

// --- Game Configuration ---
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;
const ENEMY_SPEED = 2;
const ENEMY_SPAWN_INTERVAL = 1200; // milliseconds
let lastEnemySpawnTime = 0;

// --- Sound Functions ---
function playSound(audioElement) {
    audioElement.currentTime = 0; // Rewind to start
    audioElement.play().catch(e => console.error("Audio playback failed:", e)); // Catch and log errors
}

function playShootSound() { playSound(shootSound); }
function playExplosionSound() { playSound(explosionSound); }
function playGameOverSound() { playSound(gameOverSound); }
function playTapSound() { playSound(tapSound); } //

// --- Game Loop and Initialization Functions ---

function startGame() {
    playTapSound();
    gameStarted = true;
    score = 0;
    bullets = [];
    enemies = [];
    explosions = [];
    player = new Player(); // Reinitialize player
    gameOverScreen.classList.add('hidden');
    mainMenu.classList.add('hidden');
    mobileControls.classList.remove('hidden'); // Show mobile controls when game starts
    canvas.focus(); // Ensure canvas can receive input if applicable

    // Hide portrait warning if visible
    portraitWarning.classList.add('hidden');

    // Start the game loop
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameStarted = false;
    playGameOverSound();
    finalScoreDisplay.textContent = score; //
    gameOverScreen.classList.remove('hidden'); //
    mobileControls.classList.add('hidden'); // Hide mobile controls when game ends
    cancelAnimationFrame(gameLoopId);
}

function gameLoop(currentTime) {
    if (!gameStarted) return; // Stop if game not started

    const deltaTime = currentTime - lastFrameTime;

    if (deltaTime >= frameRate) {
        update(deltaTime);
        render();
        lastFrameTime = currentTime;
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // Player movement (desktop/keyboard)
    player.update();

    // Spawn enemies
    lastEnemySpawnTime += deltaTime;
    if (lastEnemySpawnTime >= ENEMY_SPAWN_INTERVAL) {
        enemies.push(new Enemy());
        lastEnemySpawnTime = 0;
    }

    // Update and filter bullets
    bullets = bullets.filter(bullet => {
        bullet.update();
        return bullet.y > 0; // Keep bullets on screen
    });

    // Update and filter enemies
    enemies = enemies.filter(enemy => {
        enemy.update();
        // Check for collision with player (simple AABB)
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            // Player hit by enemy
            endGame();
            return false; // Remove enemy
        }
        return enemy.y < canvas.height; // Keep enemies on screen
    });

    // Bullet-enemy collision detection
    bullets.forEach(bullet => {
        enemies.forEach(enemy => {
            if (!bullet.isHit && !enemy.isHit &&
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // Collision
                bullet.isHit = true;
                enemy.isHit = true;
                score += 10;
                playExplosionSound();
                explosions.push(new Explosion(enemy.x, enemy.y)); // Create explosion at enemy position
            }
        });
    });

    // Filter out hit bullets and enemies
    bullets = bullets.filter(bullet => !bullet.isHit);
    enemies = enemies.filter(enemy => !enemy.isHit);

    // Update and filter explosions
    explosions = explosions.filter(explosion => {
        explosion.update();
        return !explosion.isFinished;
    });

    // Check if player has lives (not implemented in this version, but good for future)
    // For now, any enemy hit ends the game.
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    player.draw();

    bullets.forEach(bullet => bullet.draw());
    enemies.forEach(enemy => enemy.draw());
    explosions.forEach(explosion => explosion.draw());

    // Draw score
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + score, 10, 30);
}

// --- Player Class ---
class Player {
    constructor() {
        this.width = 64; // Adjust based on player sprite
        this.height = 64; // Adjust based on player sprite
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = PLAYER_SPEED;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.lastShotTime = 0;
        this.fireRate = 200; // milliseconds between shots
        this.spriteSheet = playerImage;
        this.frameWidth = 16; // Width of a single frame in the sprite sheet
        this.frameHeight = 16; // Height of a single frame in the sprite sheet
        this.scale = this.width / this.frameWidth; // Calculate scale based on desired display size
    }

    draw() {
        // Draw the player sprite from the spritesheet
        ctx.drawImage(
            this.spriteSheet,
            0, // Source X (start of the frame in sprite sheet)
            0, // Source Y (start of the frame in sprite sheet)
            this.frameWidth, // Source Width (width of the frame)
            this.frameHeight, // Source Height (height of the frame)
            this.x, // Destination X (where to draw on canvas)
            this.y, // Destination Y (where to draw on canvas)
            this.width, // Destination Width (stretched width on canvas)
            this.height // Destination Height (stretched height on canvas)
        );
    }

    update() {
        if (this.isMovingLeft && this.x > 0) {
            this.x -= this.speed;
        }
        if (this.isMovingRight && this.x + this.width < canvas.width) {
            this.x += this.speed;
        }
    }

    shoot() {
        const currentTime = performance.now();
        if (currentTime - this.lastShotTime > this.fireRate) {
            bullets.push(new Bullet(this.x + this.width / 2 - 2, this.y)); // Bullet from center-top of player
            playShootSound();
            this.lastShotTime = currentTime;
        }
    }
}

// --- Bullet Class ---
class Bullet {
    constructor(x, y) {
        this.width = 4;
        this.height = 10;
        this.x = x;
        this.y = y;
        this.speed = BULLET_SPEED;
        this.color = '#00ffff'; // Cyan bullet
        this.isHit = false; // Flag to mark if bullet has hit something
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y -= this.speed;
    }
}

// --- Enemy Class ---
class Enemy {
    constructor() {
        this.width = 64;
        this.height = 64;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height; // Start above canvas
        this.speed = ENEMY_SPEED + (score / 1000); // Increase speed with score
        this.isHit = false; // Flag to mark if enemy has been hit
        this.spriteSheet = enemyImage;
        this.frameWidth = 16;
        this.frameHeight = 16;
        this.scale = this.width / this.frameWidth;
    }

    draw() {
        ctx.drawImage(
            this.spriteSheet,
            0, 0, // Source X, Y
            this.frameWidth, this.frameHeight, // Source Width, Height
            this.x, this.y, // Destination X, Y
            this.width, this.height // Destination Width, Height
        );
    }

    update() {
        this.y += this.speed;
    }
}

// --- Explosion Class ---
class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.frameRate = 50; // milliseconds per frame
        this.lastFrameTime = 0;
        this.isFinished = false;
        this.spriteSheet = explosionImage;
        this.frameWidth = 16; // Width of a single frame in the explosion sprite sheet
        this.frameHeight = 16; // Height of a single frame in the explosion sprite sheet
        this.numFrames = 5; // Number of frames in your explosion sprite sheet
        this.width = 64; // Display width
        this.height = 64; // Display height
    }

    draw() {
        const sx = this.frame * this.frameWidth; // Calculate source X based on current frame
        ctx.drawImage(
            this.spriteSheet,
            sx, 0, // Source X, Y
            this.frameWidth, this.frameHeight, // Source Width, Height
            this.x, this.y, // Destination X, Y
            this.width, this.height // Destination Width, Height
        );
    }

    update() {
        const currentTime = performance.now();
        if (currentTime - this.lastFrameTime > this.frameRate) {
            this.frame++;
            this.lastFrameTime = currentTime;
            if (this.frame >= this.numFrames) {
                this.isFinished = true;
            }
        }
    }
}


// --- Fullscreen Functionality ---
function toggleFullscreen() {
    playTapSound();
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// --- Event Listeners ---
document.addEventListener('keydown', (e) => {
    if (!gameStarted) return;
    if (e.key === 'ArrowLeft') player.isMovingLeft = true;
    if (e.key === 'ArrowRight') player.isMovingRight = true;
    if (e.key === ' ') {
        e.preventDefault(); // Prevent spacebar from scrolling
        player.shoot();
    }
});

document.addEventListener('keyup', (e) => {
    if (!gameStarted) return;
    if (e.key === 'ArrowLeft') player.isMovingLeft = false;
    if (e.key === 'ArrowRight') player.isMovingRight = false;
});

// Mobile Controls Event Listeners
function setupMobileControls() {
    let shootInterval;

    leftButton.addEventListener('touchstart', () => {
        if (!gameStarted) return;
        player.isMovingLeft = true;
        playTapSound();
    });
    leftButton.addEventListener('touchend', () => {
        player.isMovingLeft = false;
    });

    rightButton.addEventListener('touchstart', () => {
        if (!gameStarted) return;
        player.isMovingRight = true;
        playTapSound();
    });
    rightButton.addEventListener('touchend', () => {
        player.isMovingRight = false;
    });

    shootButton.addEventListener('touchstart', (e) => {
        if (!gameStarted) return;
        e.preventDefault(); // Prevent touch-hold from triggering context menus
        player.shoot();
        shootInterval = setInterval(() => player.shoot(), player.fireRate);
        playTapSound();
    });
    shootButton.addEventListener('touchend', () => {
        clearInterval(shootInterval);
    });
}

// Fullscreen on tap and initial game setup
document.addEventListener('DOMContentLoaded', () => {
    // Check if images are loaded before proceeding
    Promise.all([
        new Promise(resolve => { playerImage.onload = resolve; }),
        new Promise(resolve => { enemyImage.onload = resolve; }),
        new Promise(resolve => { explosionImage.onload = resolve; })
    ]).then(() => {
        console.log("All images loaded.");

        // Attach event listeners for start and restart buttons
        if (startButton) {
            startButton.addEventListener('click', () => {
                playTapSound();
                startGame();
            });
        } else {
            console.error("ERROR: startButton element not found after DOMContentLoaded. Check index.html IDs.");
        }
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                playTapSound();
                startGame();
            });
        } else {
            console.error("ERROR: restartButton element not found after DOMContentLoaded. Check index.html IDs.");
        }
        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', toggleFullscreen); // toggleFullscreen already plays sound
        } else {
            console.error("ERROR: fullscreenButton element not found after DOMContentLoaded. Check index.html IDs.");
        }

        // Check for robustness
        if (!mainMenu) console.error("ERROR: mainMenu element not found after DOMContentLoaded. Check index.html IDs.");
        if (!gameOverScreen) console.error("ERROR: gameOverScreen element not found after DOMContentLoaded. Check index.html IDs.");
        if (!finalScoreDisplay) console.error("ERROR: finalScoreDisplay element not found after DOMContentLoaded. Check index.html IDs.");
        if (!mobileControls) console.error("ERROR: mobileControls element not found after DOMContentLoaded. Check index.html IDs.");
        if (!leftButton) console.error("ERROR: leftButton element not found after DOMContentLoaded. Check index.html IDs.");
        if (!rightButton) console.error("ERROR: rightButton element not found after DOMContentLoaded. Check index.html IDs.");
        if (!shootButton) console.error("ERROR: shootButton element not found after DOMContentLoaded. Check index.html IDs.");

        // Setup mobile touch controls
        setupMobileControls();

        // New: Event listener for any tap on the body/game-container to trigger fullscreen and then start game if not started
        // Use a flag to ensure it only happens once to prevent re-triggering startGame accidentally.
        let initialInteractionDone = false;
        document.body.addEventListener('click', handleInitialInteraction, { once: true });
        document.body.addEventListener('touchstart', handleInitialInteraction, { once: true });

        function handleInitialInteraction() {
            if (initialInteractionDone) return;
            initialInteractionDone = true;

            // Request fullscreen
            toggleFullscreen(); // This plays the tap sound.

            // If game hasn't started yet, and we have a start button, simulate a click
            if (!gameStarted && startButton) {
                startButton.click(); // This will call startGame()
            }
            // If the game needs to be explicitly started and not just via a menu,
            // you might call startGame() here directly, but startButton.click() is safer
            // as it relies on existing game logic.

            // Only show controls on mobile
            if (window.innerWidth <= 768) { // Assuming 768px is your mobile breakpoint
                 mobileControls.classList.remove('hidden');
            }
        }

        // New: Orientation change listener for the warning message
        window.addEventListener('orientationchange', checkOrientation);
        window.addEventListener('resize', checkOrientation); // Also check on resize for desktop/tablet transitions
        checkOrientation(); // Initial check on load
    });
});

// New: Function to check and display orientation warning
function checkOrientation() {
    // Only show warning if on a mobile-like device (max-width: 768px)
    if (window.innerWidth <= 768 && window.innerHeight > window.innerWidth) { // Portrait mode
        portraitWarning.classList.remove('hidden');
        // Optionally, if you want to block input in portrait, add a class to game-container
        // gameContainer.classList.add('blurred-for-portrait');
    } else { // Landscape or desktop
        portraitWarning.classList.add('hidden');
        // gameContainer.classList.remove('blurred-for-portrait');
    }
}


// Adjust canvas size on window resize (optional, but good for responsiveness)
window.addEventListener('resize', () => {
    // If you want the canvas to dynamically resize *within* the game-container
    // you might need to handle this here, but current CSS with aspect-ratio is often sufficient.
    // canvas.width = canvas.offsetWidth;
    // canvas.height = canvas.offsetHeight;
    // render(); // Rerender content if canvas size changes
});
