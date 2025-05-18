document.addEventListener('DOMContentLoaded', () => {
// Game elements
const gameContainer = document.getElementById('game-container');
const dino = document.getElementById('dino');
const scoreDisplay = document.getElementById('game-score');
const highScoreDisplay = document.getElementById('high-score');
const startButton = document.getElementById('start-game');
const gameOverMessage = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const playAgainButton = document.getElementById('play-again');

// Game state
let isPlaying = false;
let score = 0;
let highScore = 0;
let speed = 4.5;
let obstacles = [];
let gameLoopId; // Thay thế gameInterval
let obstacleInterval;
let isJumping = false;
let isDucking = false;

// Các biến vật lý cho cú nhảy - Đã được điều chỉnh cho mô hình nhảy mới
let dinoVerticalPosition = 0; // Vị trí hiện tại của khủng long theo chiều dọc (thay cho jumpHeight)
let dinoVerticalVelocity = 0;   // Vận tốc hiện tại của khủng long theo chiều dọc
let gravityAcceleration = 0.75;  // Gia tốc trọng trường (thay cho gravity, trước là 0.8)
let jumpInitialVelocity = 14; // Vận tốc nhảy ban đầu (giữ nguyên hoặc tăng nhẹ, trước là 12 theo user edit, 15 theo bot)

// Biến cho hoạt ảnh chạy của khủng long
let dinoRunFrame = 0;
let dinoRunAnimationTimer = 0;
const DINO_RUN_ANIMATION_SPEED = 7; // Chuyển frame sau mỗi X lần gọi updateGame (tốc độ chạy)
const dinoIdleSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-full h-full text-gold">
<path fill="currentColor" d="M13 2V3H12V9H11V10H9V11H8V12H7V13H5V12H4V11H3V9H2V15H3V16H4V17H5V18H6V22H8V21H9V20H10V19H11V18H12V17H13V16H14V15H15V14H16V13H17V12H18V11H19V10H20V9H21V8H22V7H23V3H22V2H13M7 5V6H8V7H9V8H10V4H8V5H7Z" />
</svg>`;
const dinoRunFrame1SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-full h-full text-gold">
<path fill="currentColor" d="M13 2V3H12V9H11V10H9V11H8V12H7V13H5V12H4V11H3V9H2V15H3V16H4V17H5V18H6V22H8V21H9V20H10V19H11V18H12V17H13V16H14V15H15V14H16V13H17V12H18V11H19V10H20V9H21V8H22V7H23V3H22V2H13M7 5V6H8V7H9V8H10V4H8V5H7Z"/>
</svg>`; // Chân sau hơi co
const dinoRunFrame2SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-full h-full text-gold">
<path fill="currentColor" d="M13 2V3H12V9H11V10H9V11H8V12H7V13H5V12H4V11H3V9H2V15H3V16H4V17H5V18H6V19H7V20H8V22H9V20H10V18H11V17H12V16H13V15H14V14H15V13H16V12H17V11H18V10H19V9H20V8H21V7H23V3H22V2H13M7 5V6H8V7H9V8H10V4H8V5H7Z"/>
</svg>`; // Chân trước hơi co
const dinoDuckSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-full h-full text-gold">
<path fill="currentColor" d="M13 2V3H12V9H11V10H9V11H8V12H7V13H5V12H4V11H3V9H2V15H3V16H4V17H5V18H6V22H8V21H9V20H10V19H11V18H12V17H13V16H14V15H15V14H16V13H17V12H18V11H19V10H20V9H21V8H22V7H23V3H22V2H13M7 5V6H8V7H9V8H10V4H8V5H7Z" />
</svg>`;

// Biến và SVG cho Power-up Khiên
let powerUps = [];
let hasShield = false;
const SHIELD_POWER_UP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-10 h-10 text-neon-purple animate-pulse-slow">
<path fill="currentColor" d="M12 2L4.5 5v6c0 5.55 3.84 10.74 7.5 12c3.66-1.26 7.5-6.45 7.5-12V5L12 2zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.92V13H5V6.3l7-3.11v9.8z"/>
</svg>`;
let shieldEffectElement = null; 
const SHIELD_SPAWN_INTERVAL = 7000; 
let lastShieldSpawnTime = 0;


// Obstacle types
const obstacleTypes = [
{
    name: 'cactus',
    height: 40, // Giữ nguyên chiều cao để không ảnh hưởng đến gameplay hiện tại
    width: 25,  // Có thể tăng nhẹ chiều rộng nếu SVG mới to hơn
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" class="w-full h-full text-neon-green">
        <path fill="currentColor" d="M32,5c-2.2,0-4,1.8-4,4v30h-4c-2.2,0-4,1.8-4,4s1.8,4,4,4h4v6h-2c-1.1,0-2,0.9-2,2s0.9,2,2,2h10c1.1,0,2-0.9,2-2s-0.9-2-2-2h-2v-6h4c2.2,0,4-1.8,4-4s-1.8-4-4-4h-4V9c0-2.2-1.8-4-4-4Z M24,43c-1.1,0-2-0.9-2-2s0.9-2,2-2h16c1.1,0,2,0.9,2,2s-0.9,2-2,2H24Z M44,27c-1.1,0-2-0.9-2-2v-8c0-1.1,0.9-2,2-2s2,0.9,2,2v8C46,26.1,45.1,27,44,27Z M20,27c-1.1,0-2-0.9-2-2v-8c0-1.1,0.9-2,2-2s2,0.9,2,2v8C22,26.1,21.1,27,20,27Z"/>
    </svg>` // SVG xương rồng chi tiết hơn
},
{
    name: 'bird',
    height: 28, // Giảm nhẹ chiều cao để phù hợp với SVG mới
    width: 38,  // Tăng chiều rộng cho phù hợp với sải cánh
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" class="w-full h-full text-neon-blue">
        <path fill="currentColor" d="M60.8,19.4c-2.4-5.1-8.1-7.8-13.3-6.1c-3.2,1-5.7,3.6-7.2,6.6c-1.2-2.1-2.9-3.9-4.9-5.2C31.5,12,26.1,11.4,21,13.5c-5.1,2.1-8.2,7.3-7.6,12.7c0.2,2.6,1.2,5,2.8,6.9c-3.6,1.8-6.1,5.4-6.1,9.5c0,5.8,4.7,10.4,10.4,10.4h27c5.8,0,10.4-4.7,10.4-10.4C58.1,30.8,54.3,25.9,60.8,19.4z"/>
        <g transform="translate(22.9, 21.2) scale(0.8)">
            <path fill="currentColor" d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
        </g>
    </svg>` // SVG chim chi tiết hơn, đang bay
}
];

// Initialize game
function initGame() {
// Reset game state
score = 0;
obstacles = [];
isPlaying = true;
isJumping = false;
dinoVerticalPosition = 0; // Reset vị trí
dinoVerticalVelocity = 0;   // Reset vận tốc
speed = 4.5; 
hasShield = false; 
removeShieldEffect(); 
powerUps.forEach(p => p.remove()); 
powerUps = []; 
lastShieldSpawnTime = Date.now(); 

// Update UI
scoreDisplay.textContent = '0';
gameOverMessage.classList.add('hidden');

// Clear previous obstacles
const existingObstacles = gameContainer.querySelectorAll('.obstacle');
existingObstacles.forEach(obstacle => obstacle.remove());

// Reset dino position and state
dino.style.bottom = '0px';
isDucking = false;
dino.style.height = '48px'; // Reset height
dino.innerHTML = dinoIdleSVG; // Set SVG mặc định khi init

// Xóa background position cũ nếu có
gameContainer.style.backgroundPositionX = '0px';

// Start game loop with requestAnimationFrame
if (gameLoopId) cancelAnimationFrame(gameLoopId); // Hủy vòng lặp cũ nếu có
gameLoopId = requestAnimationFrame(updateGame);

// Start generating obstacles with better timing
obstacleInterval = setInterval(createObstacle, 1700);
}

// Create obstacle function
function createObstacle() {
if (!isPlaying) return;

// Randomly select obstacle type with slight bias toward cactus at beginning
let randomType;
if (score < 10) {
    // Ở điểm số thấp, nhiều khả năng là xương rồng hơn
    randomType = obstacleTypes[Math.random() < 0.7 ? 0 : 1];
} else {
    randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
}

// Create obstacle element
const obstacle = document.createElement('div');
obstacle.classList.add('obstacle', 'absolute');
obstacle.style.right = '0px';

// Set position based on type (birds are higher)
if (randomType.name === 'bird') {
    // Điều chỉnh độ cao của birds để tránh xung đột với người chơi khi nhảy
    // Birds bay ở ba độ cao khác nhau: thấp, trung bình và cao
    const heightLevels = [25, 15, 50]; // Điều chỉnh độ cao chim (trước là 25, 50, 75)
    const selectedHeight = heightLevels[Math.floor(Math.random() * heightLevels.length)];
    obstacle.style.bottom = `${selectedHeight}px`;
} else {
    obstacle.style.bottom = '0px';
}

// Set dimensions
obstacle.style.width = `${randomType.width}px`;
obstacle.style.height = `${randomType.height}px`;

// Add icon
obstacle.innerHTML = randomType.icon;

// Store obstacle type
obstacle.dataset.type = randomType.name;

// Add to game container
gameContainer.appendChild(obstacle);

// Add to obstacles array
obstacles.push(obstacle);

// Increase difficulty over time - more gradually
if (score > 0 && score % 7 === 0) { // Tăng tốc độ mỗi 7 điểm thay vì 5
    speed += 0.5; // Giảm mức tăng tốc độ (trước là 0.25)
    // Khoảng cách giữa các chướng ngại vật giảm khi tốc độ tăng
    clearInterval(obstacleInterval);
    const newInterval = Math.max(1000, 1700 - (score * 15)); // Điều chỉnh logic khoảng cách (trước là max(1200, 1800 - (score*30)))
    obstacleInterval = setInterval(createObstacle, newInterval);
}
}

// Update game function (game loop)
function updateGame() {
if (!isPlaying) return;

// Di chuyển background
let currentBgPosX = parseFloat(gameContainer.style.backgroundPositionX || 0);
gameContainer.style.backgroundPositionX = `${currentBgPosX - speed / 2}px`;

// Cập nhật và tạo power-ups
updatePowerUps();
tryCreateShieldPowerUp();

// Update dino position if jumping
if (isJumping) {
    // Áp dụng trọng trường vào vận tốc
    dinoVerticalVelocity -= gravityAcceleration;
    // Áp dụng vận tốc vào vị trí
    dinoVerticalPosition += dinoVerticalVelocity;

    // Kiểm tra nếu chạm đất
    if (dinoVerticalPosition <= 0) {
        isJumping = false;
        dinoVerticalPosition = 0;
        dinoVerticalVelocity = 0;
        dino.style.bottom = '0px';
        dino.style.transform = 'rotate(0deg)'; // Reset xoay khi chạm đất
        dino.innerHTML = dinoIdleSVG; // Đặt lại SVG chạy khi chạm đất
        
        dino.classList.add('landing');
        setTimeout(() => {
            dino.classList.remove('landing');
        }, 200);
        
        if (isDucking) { 
            endDuck(); 
        }
    } else {
        // Cập nhật vị trí trực quan nếu vẫn ở trên không
        dino.style.bottom = `${dinoVerticalPosition}px`;
        // Phản hồi trực quan trong khi nhảy (xoay)
        if (dinoVerticalVelocity > 0) { 
            dino.style.transform = 'rotate(-10deg)';
        } else { 
            dino.style.transform = 'rotate(5deg)'; 
        }
    }
} else if (isDucking) {
    // Nếu đang cúi (và không nhảy)
    dino.innerHTML = dinoDuckSVG; // Giữ SVG cúi
} else {
    // Khủng long đang chạy trên mặt đất (hoạt ảnh chạy)
    dinoRunAnimationTimer++;
    if (dinoRunAnimationTimer >= DINO_RUN_ANIMATION_SPEED) {
        dinoRunAnimationTimer = 0;
        dinoRunFrame = (dinoRunFrame + 1) % 2;
        if (dinoRunFrame === 0) {
            dino.innerHTML = dinoRunFrame1SVG;
        } else {
            dino.innerHTML = dinoRunFrame2SVG;
        }
    }
}

// Cập nhật vị trí của hiệu ứng khiên nếu có
if (hasShield && shieldEffectElement) {
    const dinoRect = dino.getBoundingClientRect();
    const gameContainerRect = gameContainer.getBoundingClientRect();
    
    // Tính toán vị trí của khiên so với gameContainer
    shieldEffectElement.style.left = `${dinoRect.left - gameContainerRect.left - 6}px`; 
    shieldEffectElement.style.bottom = `${parseFloat(dino.style.bottom || 0) - 6}px`;
}

// Move obstacles
obstacles.forEach((obstacle, index) => {
    // Get current position
    const currentRight = parseFloat(obstacle.style.right);
    
    // Move obstacle
    obstacle.style.right = `${currentRight + speed}px`;
    
    // Check if obstacle is off screen
    if (currentRight > gameContainer.offsetWidth + obstacle.offsetWidth) { // Thêm offsetWidth để đảm bảo xóa hẳn
        // Remove obstacle
        obstacle.remove();
        obstacles.splice(index, 1);
        
        // Increase score
        score++;
        scoreDisplay.textContent = score;
    }
    
    // Check for collision
    if (checkCollision(obstacle)) {
        if (hasShield) {
            hasShield = false;
            removeShieldEffect();
            // playSound('shield_break.mp3'); // Gợi ý âm thanh khiên vỡ
            // Xóa chướng ngại vật đã va chạm với khiên
            obstacle.remove();
            obstacles.splice(index, 1); 
        } else {
            gameOver();
        }
    }
});

// Continue game loop
gameLoopId = requestAnimationFrame(updateGame);
}

// Jump function
function jump() {
if (!isPlaying || isJumping) return;

// Can't jump while ducking
if (isDucking) {
    endDuck();
    return;
}

// Add small squish animation before jumping
dino.classList.add('pre-jump');

// Immediately start the jump for better responsiveness
isJumping = true;
dinoVerticalVelocity = jumpInitialVelocity; // Đặt vận tốc nhảy ban đầu
// Không cập nhật dino.style.bottom trực tiếp ở đây nữa

// Remove pre-jump class
setTimeout(() => {
    dino.classList.remove('pre-jump');
}, 50);
}

// Duck function
function duck() {
if (!isPlaying || isJumping) return;

isDucking = true;
dino.style.height = '24px'; // Half height when ducking
dino.style.transform = 'translateY(12px)'; // Shift down to look better
dino.classList.add('ducking'); // Thêm class để có thể tạo hiệu ứng CSS

// Change appearance to ducking pose - SVG mới
dino.innerHTML = dinoDuckSVG;
}

// End duck function
function endDuck() {
if (!isDucking) return;

isDucking = false;
dino.style.height = '48px'; // Reset height
dino.style.transform = 'translateY(0)'; // Reset position
dino.classList.remove('ducking'); // Xóa class ducking

// Change back to normal pose
dino.innerHTML = dinoIdleSVG; // Khi kết thúc cúi, trở về trạng thái chạy/đứng yên
}

// Check collision function
function checkCollision(obstacle) {
// Get dino position with adjusted hitbox
const dinoRect = dino.getBoundingClientRect();
const obstacleRect = obstacle.getBoundingClientRect();

// Create a smaller hitbox for more precise collision
// Tăng margin cho hitbox để làm cho game công bằng hơn
const hitboxMargin = 5; // Giảm từ 10 xuống 5 để hitbox ôm sát hơn
const dinoHitbox = {
    left: dinoRect.left + hitboxMargin,
    right: dinoRect.right - hitboxMargin,
    top: dinoRect.top + hitboxMargin,
    bottom: dinoRect.bottom - hitboxMargin
};
const obstacleType = obstacle.dataset.type;

// Special case for jumping over cactus
if (isJumping && obstacleType === 'cactus') {
    // When jumping, give extra clearance over cactus
    // Tăng khoảng trống khi nhảy qua xương rồng
    const jumpClearance = 8;
    
    return (
        dinoHitbox.right > obstacleRect.left + 2 &&
        dinoHitbox.left < obstacleRect.right - 2 &&
        dinoHitbox.bottom - jumpClearance > obstacleRect.top &&
        dinoHitbox.top < obstacleRect.bottom - jumpClearance
    );
}

// Special case for birds - providing more forgiving collision detection
if (obstacleType === 'bird') {
    // Cải thiện hệ thống phát hiện va chạm với birds
    const birdClearance = isJumping ? 12 : 5;  // Tăng khoảng trống khi nhảy qua birds
    
    return (
        dinoHitbox.right > obstacleRect.left + 5 &&
        dinoHitbox.left < obstacleRect.right - 5 &&
        dinoHitbox.bottom - birdClearance > obstacleRect.top + 5 &&
        dinoHitbox.top + birdClearance < obstacleRect.bottom - 5
    );
}

// If ducking and obstacle is a bird, reduce collision height for the dino
if (isDucking && obstacleType === 'bird') {
    // When ducking, birds should fly over the dinosaur
    // Create a modified collision box that's lower to the ground
    const modifiedDinoTop = dinoRect.bottom - (dinoRect.height / 2);
    
    return (
        dinoHitbox.right > obstacleRect.left &&
        dinoHitbox.left < obstacleRect.right &&
        dinoHitbox.bottom > obstacleRect.top &&
        modifiedDinoTop < obstacleRect.bottom
    );
}

// Standard collision detection with improved precision
return (
    dinoHitbox.right > obstacleRect.left + 2 &&
    dinoHitbox.left < obstacleRect.right - 2 &&
    dinoHitbox.bottom > obstacleRect.top + 2 &&
    dinoHitbox.top < obstacleRect.bottom - 2
);
}

// Game over function
function gameOver() {
isPlaying = false;

// Clear intervals and animation frame
cancelAnimationFrame(gameLoopId);
clearInterval(obstacleInterval);
// Đặt lại frame chạy của khủng long khi game over
dino.innerHTML = dinoIdleSVG; 
dinoRunFrame = 0;
dinoRunAnimationTimer = 0;
hasShield = false; // Reset khiên khi game over
removeShieldEffect(); // Xóa hiệu ứng khiên nếu có
powerUps.forEach(p => p.remove());
powerUps = [];

// Update high score
if (score > highScore) {
    highScore = score;
    highScoreDisplay.textContent = highScore;
}

// Show game over message
finalScoreDisplay.textContent = score;
gameOverMessage.classList.remove('hidden');
}

// Event listeners
startButton.addEventListener('click', initGame);
playAgainButton.addEventListener('click', initGame);

// Keyboard controls
document.addEventListener('keydown', (event) => {
// Phản hồi ngay lập tức với các phím di chuyển
if ((event.code === 'Space' || event.code === 'ArrowUp') && isPlaying) {
    event.preventDefault();
    // Chỉ nhảy nếu chưa đang nhảy
    if (!isJumping) {
        jump();
    }
} else if (event.code === 'ArrowDown' && isPlaying) {
    event.preventDefault();
    duck();
}
});

// Handle key up for ending duck
document.addEventListener('keyup', (event) => {
if (event.code === 'ArrowDown' && isPlaying && isDucking) {
    event.preventDefault();
    endDuck();
}
});

// Mobile touch controls
gameContainer.addEventListener('touchstart', (event) => {
if (!isPlaying) return;
event.preventDefault();

// Nhảy khi chạm màn hình
if (!isJumping) {
    jump();
}
});

// --- Power-up Shield Functions ---
function createShieldPowerUp() {
if (!isPlaying) return;

const powerUp = document.createElement('div');
powerUp.classList.add('power-up', 'shield-powerup', 'absolute');
powerUp.style.right = '0px';
// Xuất hiện ở độ cao cố định, ví dụ 50px từ dưới lên
powerUp.style.bottom = '20px'; 
powerUp.innerHTML = SHIELD_POWER_UP_SVG;
powerUp.dataset.type = 'shield';

gameContainer.appendChild(powerUp);
powerUps.push(powerUp);
lastShieldSpawnTime = Date.now(); // Cập nhật thời gian khiên vừa xuất hiện
}

function tryCreateShieldPowerUp() {
// Chỉ tạo khiên nếu không có khiên nào đang hiển thị và đủ thời gian kể từ lần cuối
const noShieldOnScreen = !powerUps.some(p => p.dataset.type === 'shield');
if (isPlaying && noShieldOnScreen && (Date.now() - lastShieldSpawnTime > SHIELD_SPAWN_INTERVAL)) {
    if (Math.random() < 0.25) { // 25% cơ hội xuất hiện mỗi khi đủ điều kiện
        createShieldPowerUp();
    }
}
}

function updatePowerUps() {
if (!isPlaying) return;

powerUps.forEach((powerUp, index) => {
    const currentRight = parseFloat(powerUp.style.right);
    powerUp.style.right = `${currentRight + speed}px`;

    if (currentRight > gameContainer.offsetWidth + powerUp.offsetWidth) {
        powerUp.remove();
        powerUps.splice(index, 1);
    } else {
        // Kiểm tra va chạm với khủng long
        const dinoRect = dino.getBoundingClientRect();
        const powerUpRect = powerUp.getBoundingClientRect();

        if (
            dinoRect.right > powerUpRect.left &&
            dinoRect.left < powerUpRect.right &&
            dinoRect.bottom > powerUpRect.top &&
            dinoRect.top < powerUpRect.bottom
        ) {
            if (powerUp.dataset.type === 'shield') {
                hasShield = true;
                applyShieldEffect();
                // playSound('shield_pickup.mp3'); // Gợi ý âm thanh nhặt khiên
                powerUp.remove();
                powerUps.splice(index, 1);
            }
        }
    }
});
}

function applyShieldEffect() {
if (shieldEffectElement) removeShieldEffect(); // Xóa cái cũ nếu có

shieldEffectElement = document.createElement('div');
shieldEffectElement.classList.add('shield-effect');
// Style cho shield effect (vòng tròn bao quanh khủng long)
shieldEffectElement.style.position = 'absolute';
shieldEffectElement.style.width = '60px'; // Lớn hơn khủng long một chút
shieldEffectElement.style.height = '60px';
shieldEffectElement.style.border = '3px solid rgba(77, 201, 255, 0.7)'; // Màu neon-blue với độ trong suốt
shieldEffectElement.style.borderRadius = '50%';
shieldEffectElement.style.boxShadow = '0 0 15px rgba(77, 201, 255, 0.5)';
// Loại bỏ left/top cố định, sẽ cập nhật trong updateGame
// shieldEffectElement.style.left = '-6px'; 
// shieldEffectElement.style.top = '-6px';
shieldEffectElement.style.pointerEvents = 'none'; // Không cản click
shieldEffectElement.style.animation = 'pulse-shield 1.5s infinite alternate';
shieldEffectElement.style.zIndex = '1'; // Đảm bảo nó ở trên khủng long một chút nhưng dưới các UI khác

// dino.appendChild(shieldEffectElement); // Không append vào dino nữa
gameContainer.appendChild(shieldEffectElement); // Append vào gameContainer
// Vị trí ban đầu sẽ được đặt trong updateGame
}

function removeShieldEffect() {
if (shieldEffectElement) {
    shieldEffectElement.remove();
    shieldEffectElement = null;
}
}
// --- End Power-up Shield Functions ---

// Add CSS for game
const style = document.createElement('style');
style.textContent = `
#game-container {
    position: relative;
    overflow: hidden;
    background-image: linear-gradient(
        45deg, 
        rgba(255,255,255,0.03) 25%, 
        transparent 25%, transparent 50%, 
        rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.03) 75%, 
        transparent 75%, transparent
    );
    background-size: 30px 30px; /* Kích thước của sọc */
}

#dino {
    /* transition: bottom 0.08s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.1s ease; */
    /* Loại bỏ 'bottom' khỏi transition, chỉ giữ lại 'transform' */
    transition: transform 0.1s ease;
}

#dino.pre-jump {
    transform: scale(0.9, 1.1);
}

#dino.ducking {
    transform: translateY(12px) scale(1.1, 0.8); /* Hiệu ứng ép xuống khi cúi */
}

#dino.landing {
    animation: land 0.2s ease;
}

@keyframes land {
    0% { transform: scale(1.1, 0.9); }
    100% { transform: scale(1, 1); }
}

.obstacle {
    position: absolute;
    z-index: 5;
    will-change: right;
    /* transition: right 0.016s linear; Bỏ transition, JS sẽ xử lý */
}
`;
document.head.appendChild(style);
});

// Create and animate particles
function createParticles() {
const colors = ['#4dc9ff', '#b967ff', '#ff71ce', '#01fdaa', '#d4af37'];
const container = document.getElementById('particles-container');
const maxParticles = window.innerWidth < 768 ? 15 : 30;

for (let i = 0; i < maxParticles; i++) {
    const particle = document.createElement('div');
    particle.classList.add('moving-particle');
    
    // Random properties
    const size = Math.random() * 15 + 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.backgroundColor = color;
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${Math.random() * 100}vh`;
    
    // Animation - faster moving
    const duration = Math.random() * 10 + 5; // Reduced from 20+10 to 10+5
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${Math.random() * 5}s`;
    
    container.appendChild(particle);
}
}

// Mobile Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
const openMenuBtn = document.getElementById('open-menu');
const closeMenuBtn = document.getElementById('close-menu');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuLinks = mobileMenu.querySelectorAll('a');

openMenuBtn.addEventListener('click', function() {
    mobileMenu.classList.add('active');
});

closeMenuBtn.addEventListener('click', function() {
    mobileMenu.classList.remove('active');
});

// Close menu when clicking a link
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', function() {
        mobileMenu.classList.remove('active');
    });
});

// Project Modals
const projectCards = document.querySelectorAll('.project-card');
const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.close-modal');

projectCards.forEach(card => {
    card.addEventListener('click', function() {
        const projectId = this.getAttribute('data-project');
        const modal = document.getElementById(`${projectId}-modal`);
        modal.classList.add('active');
    });
});

closeButtons.forEach(button => {
    button.addEventListener('click', function() {
        const modal = this.closest('.modal');
        modal.classList.remove('active');
    });
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Cursor trail effect
const cursorContainer = document.getElementById('cursor-container');
const maxParticles = 20;
const particles = [];

document.addEventListener('mousemove', function(e) {
    createCursorParticle(e.clientX, e.clientY);
});

function createCursorParticle(x, y) {
    if (particles.length >= maxParticles) {
        const oldParticle = particles.shift();
        oldParticle.remove();
    }
    
    const particle = document.createElement('div');
    particle.classList.add('cursor-particle');
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    // Random color
    const colors = ['#d4af37', '#4dc9ff', '#b967ff', '#ff71ce', '#01fdaa'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    particle.style.backgroundColor = color;
    
    cursorContainer.appendChild(particle);
    particles.push(particle);
    
    // Fade out and remove
    setTimeout(() => {
        particle.style.opacity = '0';
        setTimeout(() => {
            if (particles.includes(particle)) {
                const index = particles.indexOf(particle);
                if (index > -1) {
                    particles.splice(index, 1);
                }
                particle.remove();
            }
        }, 800);
    }, 100);
}
});

// Initialize particles
document.addEventListener('DOMContentLoaded', createParticles);

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    });
});
});

// Scroll Animation Script (Mới)
document.addEventListener('DOMContentLoaded', function() {
const animatedElements = document.querySelectorAll('.scroll-animate');

if (!animatedElements.length) return;

const observerOptions = {
    root: null, // Sử dụng viewport làm root
    rootMargin: '0px',
    threshold: 0.1 // Kích hoạt khi 10% phần tử hiển thị (có thể điều chỉnh)
};

const observer = new IntersectionObserver((entries, observerInstance) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Lấy transition-delay từ style của element (nếu có)
            const delay = parseFloat(entry.target.style.transitionDelay);
            if (delay > 0) {
                observerInstance.unobserve(entry.target); // Đơn giản là unobserve ngay
            } else {
                observerInstance.unobserve(entry.target); // Chỉ animate một lần
            }
        }
    });
}, observerOptions);

animatedElements.forEach(el => {
    observer.observe(el);
});

// Mobile menu functionality
const mobileMenuBtn = document.getElementById('open-menu');
const closeMobileMenuBtn = document.getElementById('close-menu');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn && closeMobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.add('active');
    });
    
    closeMobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.remove('active');
    });
    
    // Close menu when clicking links
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
        });
    });
}

// Art circles decoration
const artCircles = document.querySelectorAll('.art-circle');
artCircles.forEach(circle => {
    // Ensure they have positions if not set by CSS
    if (!circle.style.top && !circle.style.left && !circle.style.right && !circle.style.bottom) {
        circle.style.top = `${Math.random() * 100}vh`;
        circle.style.left = `${Math.random() * 100}vw`;
    }
});
});


document.addEventListener('DOMContentLoaded', function() {
// Thêm class mouse-tracking cho tất cả project cards
const cards = document.querySelectorAll('.project-card');

cards.forEach(card => {
    card.classList.add('mouse-tracking');
    
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
});

function handleMouseMove(e) {
    const card = e.currentTarget;
    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;
    
    // Tính toán vị trí chuột tương đối
    const mouseX = e.clientX - cardRect.left;
    const mouseY = e.clientY - cardRect.top;
    
    // Chuyển đổi vị trí chuột thành góc xoay
    // -15 đến 15 độ
    const rotateY = ((mouseX / cardWidth) - 0.5) * 12; // Giảm xuống từ 20 để hiệu ứng mềm mại hơn
    const rotateX = ((0.5 - (mouseY / cardHeight)) * 12); // Giảm xuống từ 20 để hiệu ứng mềm mại hơn
    
    // Áp dụng biến đổi - hiệu chỉnh cho từng loại card
    let zDistance = 10;
    let scale = 1.05;
    
    // Điều chỉnh mức độ hiệu ứng dựa vào loại card
    if (card.closest('#services')) {
        zDistance = 8;  // Hơi nhẹ cho services
    } else if (card.closest('#experience')) {
        zDistance = 6;  // Nhẹ hơn cho experience
        scale = 1.03;
    } else if (card.closest('#contact')) {
        zDistance = 5;  // Rất nhẹ cho contact
        scale = 1.02;
    }
    
    card.style.transform = `
        perspective(1000px) 
        rotateY(${rotateY}deg) 
        rotateX(${rotateX}deg) 
        translateZ(${zDistance}px)
        scale3d(${scale}, ${scale}, ${scale})
    `;
    
    // Hiệu ứng bóng động
    card.style.boxShadow = `
        ${-rotateY/2}px ${rotateX/2}px 20px rgba(0,0,0,0.4),
        0 0 30px rgba(212, 175, 55, 0.3)
    `;
    
    // Hiệu ứng ánh sáng động
    const glarePos = `${50 + (rotateY*2)}% ${50 - (rotateX*2)}%`;
    card.style.backgroundImage = `
        radial-gradient(circle at ${glarePos}, 
        rgba(255, 255, 255, 0.1) 0%, 
        rgba(255, 255, 255, 0) 60%)
    `;
    
    // Xử lý các phần tử con
    const title = card.querySelector('h3, h4');
    const description = card.querySelector('p');
    const button = card.querySelector('button, a.button-hover');
    const icon = card.querySelector('svg');
    
    if (title) {
        title.style.transform = `translateZ(${zDistance*3}px) translateX(${rotateY/2}px) translateY(${-rotateX/2}px)`;
    }
    if (description) {
        description.style.transform = `translateZ(${zDistance*2}px) translateX(${rotateY/3}px) translateY(${-rotateX/3}px)`;
    }
    if (button) {
        button.style.transform = `translateZ(${zDistance*2.5}px) translateX(${rotateY/2}px) translateY(${-rotateX/2}px)`;
    }
    if (icon) {
        icon.style.transform = `translateZ(${zDistance*4}px) translateX(${rotateY/4}px) translateY(${-rotateX/4}px)`;
    }
}

function handleMouseLeave(e) {
    const card = e.currentTarget;
    
    // Reset transform
    card.style.transform = `perspective(1000px) rotateY(0) rotateX(0) translateZ(0) scale3d(1, 1, 1)`;
    card.style.boxShadow = 'none';
    card.style.backgroundImage = 'none';
    
    // Reset các phần tử con
    const elements = card.querySelectorAll('h3, h4, p, button, a.button-hover, svg');
    elements.forEach(el => {
        el.style.transform = 'translateZ(0)';
    });
}

// Thêm hiệu ứng cho các phần tử con ở hover state qua CSS
const style = document.createElement('style');
style.textContent = `
    /* Hiệu ứng nổi cho các phần tử con của card */
    .project-card h3,
    .project-card h4,
    .project-card p,
    .project-card .flex,
    .project-card button, 
    .project-card a.button-hover,
    .project-card svg {
        transition: transform 0.3s ease;
    }
    
    /* Điều chỉnh hiệu ứng cho từng loại card */
    #services .project-card:hover svg {
        transform: translateZ(32px) scale(1.1);
        filter: drop-shadow(0 10px 10px rgba(0,0,0,0.2));
    }
    
    #experience .project-card:hover h4 {
        transform: translateZ(24px);
        color: #f5d77f;
    }
    
    #contact .project-card:hover svg {
        transform: translateZ(20px);
        filter: drop-shadow(0 10px 10px rgba(0,0,0,0.2));
    }
`;
document.head.appendChild(style);
});

document.addEventListener('DOMContentLoaded', function() {
// Lấy tất cả các section và dot navigation items
const sections = document.querySelectorAll('section, header');
const navDots = document.querySelectorAll('.dots-nav-item');

// Thêm ID cho header section nếu chưa có
const heroSection = document.querySelector('header');
if (heroSection && !heroSection.id) heroSection.id = 'hero';

// Khởi tạo Intersection Observer để theo dõi các section đang hiển thị
const observerOptions = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.5 // 50% của section cần hiển thị để kích hoạt
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Lấy ID của section đang hiển thị
            const activeId = entry.target.id;
            
            // Cập nhật trạng thái active cho các dot
            updateActiveDot(activeId);
            
            // Thêm hiệu ứng ping cho dot đang active
            addPingEffect(activeId);
        }
    });
}, observerOptions);

// Quan sát tất cả các section
sections.forEach(section => {
    if (section.id) { // Chỉ quan sát section có ID
        observer.observe(section);
    }
});

// Xử lý sự kiện click cho các dot navigation
navDots.forEach(dot => {
    dot.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            // Cuộn đến section một cách mượt mà
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Cập nhật trạng thái active cho các dot
            updateActiveDot(targetId.substring(1)); // Loại bỏ dấu # ở đầu
        }
    });
});

// Function cập nhật trạng thái active cho các dot
function updateActiveDot(activeId) {
    navDots.forEach(dot => {
        const dotSection = dot.getAttribute('data-section');
        
        if (dotSection === activeId) {
            dot.classList.add('active');
            // Thêm phần tử ping khi active
            const dotElement = dot.querySelector('.dot');
            if (dotElement && !dotElement.querySelector('.ping')) {
                const pingElement = document.createElement('span');
                pingElement.classList.add('ping', 'absolute', '-inset-1', 'bg-gold/50', 'rounded-full', 'animate-ping');
                dotElement.appendChild(pingElement);
            }
        } else {
            dot.classList.remove('active');
            // Xóa phần tử ping khi không active
            const pingElement = dot.querySelector('.ping');
            if (pingElement) pingElement.remove();
        }
    });
}

// Function thêm hiệu ứng ping cho dot đang active
function addPingEffect(activeId) {
    const activeDot = document.querySelector(`.dots-nav-item[data-section="${activeId}"]`);
    if (activeDot) {
        const dotElement = activeDot.querySelector('.dot');
        if (dotElement) {
            // Tạo hiệu ứng ping
            const existingPing = dotElement.querySelector('.ping');
            if (!existingPing) {
                const pingElement = document.createElement('span');
                pingElement.classList.add('ping', 'absolute', '-inset-1', 'bg-gold/50', 'rounded-full', 'animate-ping');
                dotElement.appendChild(pingElement);
            }
        }
    }
}

// Hàm tính vị trí cuộn hiện tại và cập nhật dot active khi người dùng cuộn
function handleScroll() {
    const scrollPosition = window.scrollY + window.innerHeight / 2;
    
    // Lặp qua tất cả các section để tìm section đang hiển thị
    sections.forEach(section => {
        if (!section.id) return; // Bỏ qua section không có ID
        
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        
        // Kiểm tra nếu vị trí cuộn nằm trong phạm vi của section
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            updateActiveDot(section.id);
        }
    });
}

// Đăng ký sự kiện cuộn
window.addEventListener('scroll', handleScroll);

// Kích hoạt lần đầu tiên khi trang tải
handleScroll();
});